import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { Connection } from 'odbc';
import { Permission, PermissionApplicationCode, Role, User } from '../../entities/authorization';
import { AuthorizationRoleKind, AuthorizationStatus } from '../../entities/authorization/User';
import { createPasswordHash, verifyStoredPassword } from '../../utils/password';
import { sendPasswordResetOtpEmail } from '../../utils/emailService';
import * as authorizationRepository from '../../database/authorization/authorizationRepository';

export interface LoginRequest {
    loginUserName: string;
    password: string;
}

export interface CreateRoleRequest {
    name: string;
    description?: string | null;
    roleKind: AuthorizationRoleKind;
    status?: AuthorizationStatus;
    permissionCodes?: string[];
    parentRoleIds?: number[];
}

export interface UpdateRoleRequest {
    name?: string;
    description?: string | null;
    roleKind?: AuthorizationRoleKind;
    status?: AuthorizationStatus;
    permissionCodes?: string[];
    parentRoleIds?: number[];
}

export interface CreateUserRequest {
    userName: string;
    loginUserName: string;
    email: string;
    password: string;
    userType: AuthorizationRoleKind;
    customerId?: number | null;
    roleIds?: number[];
}

export interface UpdateUserRequest {
    userName?: string;
    email?: string;
    userType?: AuthorizationRoleKind;
    customerId?: number | null;
    activeStatus?: 'Y' | 'N';
    roleIds?: number[];
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'authorization-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'authorization-refresh-secret';
const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRY || '3600s';
const REFRESH_TOKEN_TTL = process.env.REFRESH_EXPIRY || '7d';
const RESET_OTP_SECRET = process.env.RESET_OTP_SECRET || process.env.JWT_SECRET || '';
const RESET_OTP_TTL_MINUTES = Number(process.env.RESET_OTP_TTL_MINUTES || 10);
const RESET_OTP_MAX_ATTEMPTS = Number(process.env.RESET_OTP_MAX_ATTEMPTS || 5);

export function getRoleIdsForUser(user: User, roles: Role[]): number[] {
    return roles.filter((role) => role.roleKind === user.userType).map((role) => role.roleId);
}

export function getPermissionsByUser(_user: User, permissions: Permission[]): Permission[] {
    return permissions;
}

export function hasPermission(
    user: User,
    requiredPermissionKey: string,
    permissions: Permission[],
    userType?: AuthorizationRoleKind,
): boolean {
    const target = requiredPermissionKey.trim().toUpperCase();
    void userType;
    return permissions.some((permission) => permission.permissionKey.toUpperCase() === target);
}

export function canAccessCustomerData(user: User, targetCustomerId: number | null): boolean {
    return user.userType === 'EMPLOYEE' || (user.customerId !== null && user.customerId === targetCustomerId);
}

export function isCustomerReadOnly(user: User): boolean {
    return user.userType === 'CUSTOMER';
}

function mapPermission(row: any): Permission {
    const applicationCode = String(row.applicationCode ?? row.APPLICATIONCODE ?? '');
    const moduleKey = String(row.moduleKey ?? row.moduleName ?? row.MODULEKEY ?? row.MODULENAME ?? '');
    const resourceKey = String(row.resourceKey ?? row.formName ?? row.form ?? row.RESOURCEKEY ?? row.FORMNAME ?? '');
    const actionKey = String(row.actionKey ?? row.actionName ?? row.permissionName ?? row.ACTIONKEY ?? row.ACTIONNAME ?? row.PERMISSIONNAME ?? '');
    const storedKey = row.permissionKey ?? row.PERMISSIONKEY;
    const permissionKey = String(storedKey ?? [moduleKey, resourceKey, actionKey].filter(Boolean).join('.'));

    return {
        permissionId: Number(row.permissionId ?? row.PERMISSIONID),
        permissionCode: String(row.permissionCode ?? row.PERMISSIONCODE),
        displayName: String(row.displayName ?? row.DISPLAYNAME ?? row.permissionName ?? row.PERMISSIONNAME ?? permissionKey),
        applicationCode: applicationCode as PermissionApplicationCode,
        permissionKey,
        moduleKey,
        resourceKey,
        actionKey,
        description: row.description ?? row.DESCRIPTION ?? null,
    };
}

async function validatePermissionCodes(conn: Connection, codes: string[]): Promise<string[]> {
    if (!Array.isArray(codes) || codes.some((code) => typeof code !== 'string' || !code.trim())) {
        throw new Error('permissionCodes must be an array of non-empty strings');
    }
    const requestedCodes = [...new Set(codes.map((code) => code.trim().toUpperCase()))];
    const rows = await authorizationRepository.getPermissionsByCodes(conn, requestedCodes);
    const codeByNormalizedValue = new Map(
        rows.map((row) => {
            const permissionCode = String(row.permissionCode ?? row.PERMISSIONCODE);
            return [permissionCode.toUpperCase(), permissionCode];
        }),
    );
    const invalid = requestedCodes.filter((code) => !codeByNormalizedValue.has(code));
    if (invalid.length) throw new Error(`Unknown permission codes: ${invalid.join(', ')}`);
    return requestedCodes.map((code) => codeByNormalizedValue.get(code)!);
}

async function validateRoleIdsForUser(conn: Connection, userType: AuthorizationRoleKind, roleIds: number[]): Promise<Role[]> {
    if (!Array.isArray(roleIds) || roleIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
        throw new Error('roleIds must be an array of positive integer IDs');
    }
    const roles: Role[] = [];
    for (const roleId of [...new Set(roleIds)]) {
        const role = await authorizationRepository.getRoleById(conn, roleId);
        if (!role || role.status !== 'ACTIVE' || role.roleKind !== userType) {
            throw new Error(`Role ${roleId} is missing, inactive, or incompatible with user type`);
        }
        roles.push(role);
    }
    return roles;
}

export async function createRole(conn: Connection, input: CreateRoleRequest, actorUserId: number | null = null): Promise<Role & { permissionCodes: string[]; parentRoleIds: number[] }> {
    const name = input.name?.trim();
    if (!name) throw new Error('Role name is required');
    if (await authorizationRepository.getRoleByName(conn, name, input.roleKind)) throw new Error('Role name already exists for this role type');

    const permissionCodes = await validatePermissionCodes(conn, input.permissionCodes ?? []);
    const parentRoleIds = input.parentRoleIds ?? [];
    if (!Array.isArray(parentRoleIds) || parentRoleIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
        throw new Error('parentRoleIds must be an array of positive integer role IDs');
    }
    const uniqueParentRoleIds = [...new Set(parentRoleIds)];
    for (const parentRoleId of uniqueParentRoleIds) {
        const parentRole = await authorizationRepository.getRoleById(conn, parentRoleId);
        if (!parentRole || parentRole.status !== 'ACTIVE' || parentRole.roleKind !== input.roleKind) {
            throw new Error(`Parent role ${parentRoleId} is missing, inactive, or has a different role type`);
        }
    }

    await conn.beginTransaction();
    try {
        const role = await authorizationRepository.insertRole(conn, {
            name,
            description: input.description ?? null,
            roleKind: input.roleKind,
            status: input.status ?? 'ACTIVE',
            createdBy: actorUserId,
        });
        await authorizationRepository.replaceRolePermissions(conn, role.roleId, permissionCodes, actorUserId);
        for (const parentRoleId of uniqueParentRoleIds) {
            await authorizationRepository.assignParentRole(conn, parentRoleId, role.roleId, actorUserId);
        }
        await conn.commit();
        return { ...role, permissionCodes, parentRoleIds: uniqueParentRoleIds };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}

export async function updateRole(conn: Connection, roleId: number, input: UpdateRoleRequest, actorUserId: number | null = null): Promise<Role & { permissionCodes: string[]; parentRoleIds: number[] }> {
    const role = await authorizationRepository.getRoleById(conn, roleId);
    if (!role) throw new Error('Role not found');
    const permissionCodes = input.permissionCodes === undefined ? undefined : await validatePermissionCodes(conn, input.permissionCodes);
    const parentRoleIds = input.parentRoleIds;
    if (parentRoleIds !== undefined) {
        if (!Array.isArray(parentRoleIds) || parentRoleIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
            throw new Error('parentRoleIds must be an array of positive integer role IDs');
        }
        const roleKind = input.roleKind ?? role.roleKind;
        for (const parentRoleId of [...new Set(parentRoleIds)]) {
            const parentRole = await authorizationRepository.getRoleById(conn, parentRoleId);
            if (parentRoleId === roleId || !parentRole || parentRole.status !== 'ACTIVE' || parentRole.roleKind !== roleKind) {
                throw new Error(`Parent role ${parentRoleId} is missing, inactive, self-referential, or incompatible with role type`);
            }
        }
    }

    await conn.beginTransaction();
    try {
        await authorizationRepository.updateRole(conn, roleId, { ...input, updatedBy: actorUserId });
        if (permissionCodes !== undefined) await authorizationRepository.replaceRolePermissions(conn, roleId, permissionCodes, actorUserId);
        if (parentRoleIds !== undefined) {
            await authorizationRepository.replaceParentRoles(conn, roleId, [...new Set(parentRoleIds)], actorUserId);
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    }

    const updated = await authorizationRepository.getRoleById(conn, roleId);
    if (!updated) throw new Error('Role not found after update');
    return {
        ...updated,
        permissionCodes: await authorizationRepository.getRolePermissionCodes(conn, roleId),
        parentRoleIds: await authorizationRepository.getParentRoleIds(conn, roleId),
    };
}

export async function getRoleDetails(conn: Connection, roleId: number): Promise<Role & { permissions: Permission[]; parentRoleIds: number[] }> {
    const role = await authorizationRepository.getRoleById(conn, roleId);
    if (!role) throw new Error('Role not found');
    const codes = await authorizationRepository.getRolePermissionCodes(conn, roleId);
    const rows = await authorizationRepository.getPermissionsByCodes(conn, codes);
    return {
        ...role,
        permissions: rows.map(mapPermission),
        parentRoleIds: await authorizationRepository.getParentRoleIds(conn, roleId),
    };
}

export async function listRoles(conn: Connection, roleKind?: AuthorizationRoleKind, roleName?: string): Promise<Array<Role & { permissionCodes: string[]; parentRoleIds: number[] }>> {
    if (roleKind !== undefined && roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
        throw new Error('roleKind must be EMPLOYEE or CUSTOMER');
    }
    const roles = await authorizationRepository.getRoles(conn, roleKind, roleName?.trim() || undefined);
    return Promise.all(roles.map(async (role) => ({
        ...role,
        permissionCodes: await authorizationRepository.getRolePermissionCodes(conn, role.roleId),
        parentRoleIds: await authorizationRepository.getParentRoleIds(conn, role.roleId),
    })));
}

export async function getRoleOptions(conn: Connection, roleKind?: AuthorizationRoleKind): Promise<Array<Pick<Role, 'roleId' | 'name' | 'roleKind'>>> {
    if (roleKind !== undefined && roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
        throw new Error('roleKind must be EMPLOYEE or CUSTOMER');
    }
    return authorizationRepository.getRoleOptions(conn, roleKind);
}

export async function deactivateRole(conn: Connection, roleId: number, actorUserId: number | null = null): Promise<void> {
    const role = await authorizationRepository.getRoleById(conn, roleId);
    if (!role) throw new Error('Role not found');
    await authorizationRepository.updateRole(conn, roleId, { status: 'INACTIVE', updatedBy: actorUserId });
}

export async function createUser(conn: Connection, input: CreateUserRequest, actorUserId: number | null = null): Promise<Omit<User, 'passwordHash'>> {
    const userName = input.userName?.trim();
    const loginUserName = input.loginUserName?.trim();
    const email = input.email?.trim();
    if (!userName || !loginUserName || !email || !input.password) throw new Error('Missing required user fields');
    if (input.userType === 'CUSTOMER' && !input.customerId) throw new Error('Customer users require a customerId');
    if (await authorizationRepository.getUserByLoginName(conn, loginUserName)) throw new Error('Login name already exists');
    if (await authorizationRepository.getUserByEmail(conn, email)) throw new Error('Email already exists');

    const roleIds = input.roleIds ?? [];
    await validateRoleIdsForUser(conn, input.userType, roleIds);
    await conn.beginTransaction();
    try {
        const user = await authorizationRepository.insertUser(conn, {
            userName,
            loginUserName,
            email,
            passwordHash: createPasswordHash(input.password),
            userType: input.userType,
            customerId: input.customerId ?? null,
            createdBy: actorUserId,
        });
        for (const roleId of roleIds) await authorizationRepository.assignRole(conn, user.userId, roleId, actorUserId, 'Initial assignment');
        await conn.commit();
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}

export async function updateUser(conn: Connection, userId: number, input: UpdateUserRequest, actorUserId: number | null = null): Promise<Omit<User, 'passwordHash'>> {
    const existing = await authorizationRepository.getUserById(conn, userId);
    if (!existing) throw new Error('User not found');
    const userType = input.userType ?? existing.userType;
    if (userType === 'CUSTOMER' && (input.customerId ?? existing.customerId) === null) throw new Error('Customer users require a customerId');
    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase() && await authorizationRepository.getUserByEmail(conn, input.email)) {
        throw new Error('Email already exists');
    }
    const roleIds = input.roleIds;
    if (roleIds !== undefined) await validateRoleIdsForUser(conn, userType, roleIds);

    await conn.beginTransaction();
    try {
        await authorizationRepository.updateUser(conn, userId, input);
        if (roleIds !== undefined) {
            const oldRoles = await authorizationRepository.getUserRoles(conn, userId);
            for (const role of oldRoles) await authorizationRepository.removeRole(conn, userId, role.roleId);
            for (const roleId of roleIds) await authorizationRepository.assignRole(conn, userId, roleId, actorUserId, 'Role reassignment');
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    }
    const updated = await authorizationRepository.getUserById(conn, userId);
    if (!updated) throw new Error('User not found after update');
    const { passwordHash: _passwordHash, ...safeUser } = updated;
    return safeUser;
}

export async function listUsers(conn: Connection): Promise<Array<Omit<User, 'passwordHash'>>> {
    const rows = await authorizationRepository.getUsers(conn);
    return rows.map(({ passwordHash: _passwordHash, ...user }) => user);
}

export async function getUserRoles(conn: Connection, userId: number): Promise<Role[]> {
    return authorizationRepository.getUserRoles(conn, userId);
}

export async function getUserPermissions(conn: Connection, userId: number): Promise<Permission[]> {
    const rows = await authorizationRepository.getUserPermissions(conn, userId);
    return rows.map(mapPermission);
}

export async function assignUserRole(conn: Connection, userId: number, roleId: number, actorUserId: number | null = null): Promise<void> {
    const user = await authorizationRepository.getUserById(conn, userId);
    const role = await authorizationRepository.getRoleById(conn, roleId);
    if (!user || !role || role.status !== 'ACTIVE' || user.userType !== role.roleKind) throw new Error('User or compatible active role not found');
    await authorizationRepository.assignRole(conn, userId, roleId, actorUserId, 'User-role assignment');
}

export async function removeUserRole(conn: Connection, userId: number, roleId: number): Promise<void> {
    await authorizationRepository.removeRole(conn, userId, roleId);
}

export async function login(conn: Connection, input: LoginRequest): Promise<{ user: Omit<User, 'passwordHash'>; roles: Role[]; permissions: Permission[]; tokenPair: TokenPair }> {
    const user = await authorizationRepository.getUserByLoginName(conn, input.loginUserName);
    if (!user || user.activeStatus !== 'Y' || !verifyStoredPassword(input.password, user.passwordHash)) throw new Error('Invalid username or password');
    const roles = await authorizationRepository.getUserRoles(conn, user.userId);
    const permissions = await getUserPermissions(conn, user.userId);
    const tokenPair = generateTokenPair(user);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { user: safeUser, roles, permissions, tokenPair };
}

export function generateTokenPair(user: User): TokenPair {
    const accessToken = jwt.sign({
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        userType: user.userType,
        customerId: user.customerId,
    }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL } as any);
    const refreshToken = jwt.sign({ userId: user.userId, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL } as any);
    return { accessToken, refreshToken };
}

export async function refreshToken(conn: Connection, refreshTokenValue: string): Promise<TokenPair> {
    try {
        const payload = jwt.verify(refreshTokenValue, REFRESH_SECRET) as { userId: number; type: string };
        if (payload.type !== 'refresh') throw new Error('Invalid refresh token');
        const user = await authorizationRepository.getUserById(conn, payload.userId);
        if (!user || user.activeStatus !== 'Y') throw new Error('User not active');
        return generateTokenPair(user);
    } catch {
        throw new Error('Invalid or expired refresh token');
    }
}

function createOtpHash(userId: number, otp: string): string {
    if (!RESET_OTP_SECRET) throw new Error('RESET_OTP_SECRET or JWT_SECRET must be configured');
    return createHmac('sha256', RESET_OTP_SECRET).update(`${userId}:${otp}`).digest('hex');
}

export async function sendResetLink(conn: Connection, email: string): Promise<{ message: string }> {
    const message = 'If an active account matches that email, a password reset code will be sent.';
    const user = await authorizationRepository.getUserByEmail(conn, email);
    if (!user || user.activeStatus !== 'Y') return { message };

    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + RESET_OTP_TTL_MINUTES * 60_000).toISOString();
    await authorizationRepository.createResetOtp(conn, user.userId, createOtpHash(user.userId, otp), expiresAt);
    await sendPasswordResetOtpEmail(user.email, otp, RESET_OTP_TTL_MINUTES);
    return { message };
}

export async function validateResetOtp(conn: Connection, email: string, otp: string): Promise<{ valid: true }> {
    if (!/^\d{6}$/.test(otp)) throw new Error('Invalid or expired reset code');
    const user = await authorizationRepository.getUserByEmail(conn, email);
    if (!user || user.activeStatus !== 'Y') throw new Error('Invalid or expired reset code');
    const challenge = await authorizationRepository.getPendingResetOtp(conn, user.userId);
    if (!challenge || Number(challenge.attemptCount ?? challenge.ATTEMPTCOUNT) >= RESET_OTP_MAX_ATTEMPTS) {
        throw new Error('Invalid or expired reset code');
    }
    const expected = String(challenge.otpHash ?? challenge.OTPHASH);
    const provided = createOtpHash(user.userId, otp);
    const matches = expected.length === provided.length && timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    if (!matches) {
        await authorizationRepository.incrementResetOtpAttempts(conn, Number(challenge.resetOtpId ?? challenge.RESETOTPID), RESET_OTP_MAX_ATTEMPTS);
        throw new Error('Invalid or expired reset code');
    }
    return { valid: true };
}

export async function resetPassword(conn: Connection, email: string, otp: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) throw new Error('Password must be at least 8 characters long');
    if (!/^\d{6}$/.test(otp)) throw new Error('Invalid or expired reset code');
    const user = await authorizationRepository.getUserByEmail(conn, email);
    if (!user || user.activeStatus !== 'Y') throw new Error('Invalid or expired reset code');
    const challenge = await authorizationRepository.getPendingResetOtp(conn, user.userId);
    if (!challenge || Number(challenge.attemptCount ?? challenge.ATTEMPTCOUNT) >= RESET_OTP_MAX_ATTEMPTS) throw new Error('Invalid or expired reset code');
    const expected = String(challenge.otpHash ?? challenge.OTPHASH);
    const provided = createOtpHash(user.userId, otp);
    const matches = expected.length === provided.length && timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    if (!matches) {
        await authorizationRepository.incrementResetOtpAttempts(conn, Number(challenge.resetOtpId ?? challenge.RESETOTPID), RESET_OTP_MAX_ATTEMPTS);
        throw new Error('Invalid or expired reset code');
    }

    await conn.beginTransaction();
    try {
        await authorizationRepository.updatePassword(conn, user.userId, createPasswordHash(newPassword));
        await authorizationRepository.consumeResetOtp(conn, Number(challenge.resetOtpId ?? challenge.RESETOTPID));
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}

export async function getPermissionCatalog(conn: Connection): Promise<Record<PermissionApplicationCode, Record<string, Permission[]>>> {
    const catalog: Record<PermissionApplicationCode, Record<string, Permission[]>> = {
        warehouse: {},
        maintenance: {},
        network_services: {},
    };
    for (const row of await authorizationRepository.getPermissionCatalog(conn)) {
        const permission = mapPermission(row);
        const modules = catalog[permission.applicationCode];
        modules[permission.moduleKey] ??= [];
        modules[permission.moduleKey].push(permission);
    }
    return catalog;
}

export async function getRolePermissionSummary(conn: Connection, userId: number): Promise<{ roles: Role[]; permissions: Permission[] }> {
    const roles = await authorizationRepository.getUserRoles(conn, userId);
    const permissions = await getUserPermissions(conn, userId);
    return { roles, permissions };
}