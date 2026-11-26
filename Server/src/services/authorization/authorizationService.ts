import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { Connection } from 'odbc';
import { Permission, PermissionApplicationCode, Role, User } from '../../entities/authorization';
import { AuthorizationRoleKind, AuthorizationStatus } from '../../entities/authorization/User';
import { createPasswordHash, verifyStoredPassword } from '../../utils/password';
import { sendEmail, sendPasswordResetOtpEmail } from '../../utils/emailService';
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
    userType: AuthorizationRoleKind;
    customerId?: number | null;
    roleIds?: number[];
    stationIds?: number[];
}

export interface UpdateUserRequest {
    userName?: string;
    email?: string;
    userType?: AuthorizationRoleKind;
    customerId?: number | null;
    activeStatus?: 'Y' | 'N';
    roleIds?: number[];
    stationIds?: number[];
}

type UserWithRoleIds = Omit<User, 'passwordHash'> & { roleIds: number[]; stationIds: number[] };
type UserListItem = Omit<User, 'passwordHash'> & {
    roles: Array<{ roleId: number; roleName: string }>;
    customerName: string | null;
    stations: Array<{ stationId: number; stationName: string }>;
    createdByName: string | null;
    updatedByName: string | null;
};
type CreatedUser = UserWithRoleIds & { credentialEmailSent: boolean };

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

type RoleWithAuditNames = Role & { createdByName: string | null; updatedByName: string | null };

async function addRoleAuditNames(conn: Connection, role: Role): Promise<RoleWithAuditNames> {
    return {
        ...role,
        createdByName: await authorizationRepository.getUserNameById(conn, role.createdBy),
        updatedByName: await authorizationRepository.getUserNameById(conn, role.updatedBy),
    };
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
        forEmployee: String(row.forEmployee ?? row.FOREMPLOYEE ?? 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
        forCustomer: String(row.forCustomer ?? row.FORCUSTOMER ?? 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
    };
}

async function validatePermissionCodes(conn: Connection, codes: string[], roleKind: AuthorizationRoleKind): Promise<string[]> {
    if (!Array.isArray(codes) || codes.some((code) => typeof code !== 'string' || !code.trim())) {
        throw new Error('permissionCodes must be an array of non-empty strings');
    }
    if (roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
        throw new Error('roleKind must be EMPLOYEE or CUSTOMER');
    }
    const requestedCodes = [...new Set(codes.map((code) => code.trim().toUpperCase()))];
    const rows = await authorizationRepository.getPermissionsByCodes(conn, requestedCodes);
    const codeByNormalizedValue = new Map<string, { permissionCode: string; isAllowed: boolean }>(
        rows.map((row) => {
            const permissionCode = String(row.permissionCode ?? row.PERMISSIONCODE);
            const roleFlag = roleKind === 'EMPLOYEE'
                ? row.forEmployee ?? row.FOREMPLOYEE
                : row.forCustomer ?? row.FORCUSTOMER;
            return [permissionCode.toUpperCase(), { permissionCode, isAllowed: String(roleFlag ?? 'N').toUpperCase() === 'Y' }];
        }),
    );
    const invalid = requestedCodes.filter((code) => !codeByNormalizedValue.has(code));
    if (invalid.length) throw new Error(`Unknown permission codes: ${invalid.join(', ')}`);
    const incompatible = requestedCodes.filter((code) => !codeByNormalizedValue.get(code)!.isAllowed);
    if (incompatible.length) throw new Error(`Permissions not available for ${roleKind}: ${incompatible.join(', ')}`);
    return requestedCodes.map((code) => codeByNormalizedValue.get(code)!.permissionCode);
}

async function validateRoleIdsForUser(conn: Connection, userType: AuthorizationRoleKind, roleIds: number[]): Promise<Role[]> {
    if (!Array.isArray(roleIds) || roleIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
        throw new Error('roleIds must be an array of positive integer IDs');
    }
    if (new Set(roleIds).size > 1) throw new Error('A user can only have one role');
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

async function validateStationIdsForCustomer(conn: Connection, customerId: number, stationIds: number[]): Promise<number[]> {
    if (!Array.isArray(stationIds) || stationIds.length === 0 || stationIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
        throw new Error('Customer users require at least one positive integer stationId');
    }
    const uniqueStationIds = [...new Set(stationIds)];
    const validStationIds = await authorizationRepository.getActiveStationIdsForCustomer(conn, customerId, uniqueStationIds);
    if (validStationIds.length !== uniqueStationIds.length) {
        throw new Error('All stationIds must belong to the customer and be active');
    }
    return uniqueStationIds;
}

export async function createRole(conn: Connection, input: CreateRoleRequest, actorUserId: number | null = null): Promise<RoleWithAuditNames & { permissionCodes: string[]; parentRoleIds: number[] }> {
    const name = input.name?.trim();
    if (!name) throw new Error('Role name is required');
    if (await authorizationRepository.getRoleByName(conn, name, input.roleKind)) throw new Error('Role name already exists for this role type');

    const permissionCodes = await validatePermissionCodes(conn, input.permissionCodes ?? [], input.roleKind);
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
        return { ...(await addRoleAuditNames(conn, role)), permissionCodes, parentRoleIds: uniqueParentRoleIds };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}

export async function updateRole(conn: Connection, roleId: number, input: UpdateRoleRequest, actorUserId: number | null = null): Promise<RoleWithAuditNames & { permissionCodes: string[]; parentRoleIds: number[] }> {
    const role = await authorizationRepository.getRoleById(conn, roleId);
    if (!role) throw new Error('Role not found');
    const permissionCodes = input.permissionCodes === undefined
        ? undefined
        : await validatePermissionCodes(conn, input.permissionCodes, input.roleKind ?? role.roleKind);
    if (input.roleKind !== undefined && input.roleKind !== role.roleKind && input.permissionCodes === undefined) {
        const existingPermissionCodes = await authorizationRepository.getRolePermissionCodes(conn, roleId);
        await validatePermissionCodes(conn, existingPermissionCodes, input.roleKind);
    }
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
        ...(await addRoleAuditNames(conn, updated)),
        permissionCodes: await authorizationRepository.getRolePermissionCodes(conn, roleId),
        parentRoleIds: await authorizationRepository.getParentRoleIds(conn, roleId),
    };
}

export async function getRoleDetails(conn: Connection, roleId: number): Promise<RoleWithAuditNames & { permissions: Permission[]; parentRoleIds: number[] }> {
    const role = await authorizationRepository.getRoleById(conn, roleId);
    if (!role) throw new Error('Role not found');
    const codes = await authorizationRepository.getRolePermissionCodes(conn, roleId);
    const rows = await authorizationRepository.getPermissionsByCodes(conn, codes);
    return {
        ...(await addRoleAuditNames(conn, role)),
        permissions: rows.map(mapPermission),
        parentRoleIds: await authorizationRepository.getParentRoleIds(conn, roleId),
    };
}

export async function listRoles(
    conn: Connection,
    roleKind?: AuthorizationRoleKind,
    roleName?: string,
    page = 1,
    pageSize = 20,
): Promise<{
    roles: Array<RoleWithAuditNames & { permissionCodes: string[]; parentRoleIds: number[]; authorityRoles: Array<Pick<Role, 'roleId' | 'name'>>; userCount: number }>;
    pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
    roleCounts: Record<'EMPLOYEE' | 'CUSTOMER', number>;
}> {
    if (roleKind !== undefined && roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
        throw new Error('roleKind must be EMPLOYEE or CUSTOMER');
    }
    if (!Number.isSafeInteger(page) || page < 1) throw new Error('page must be a positive integer');
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error('pageSize must be between 1 and 100');

    const roleRows = await authorizationRepository.getRoles(conn, roleKind, roleName?.trim() || undefined, page, pageSize);
    const totalCount = await authorizationRepository.countRoles(conn, roleKind, roleName?.trim() || undefined);
    const roleCounts = await authorizationRepository.countRolesByKind(conn);
    const userCountsByRole = await authorizationRepository.countUsersByRoleIds(conn, roleRows.map(({ roleId }) => roleId));
    const roles = await Promise.all(roleRows.map(async (role) => ({
        ...(await addRoleAuditNames(conn, role)),
        permissionCodes: await authorizationRepository.getRolePermissionCodes(conn, role.roleId),
        parentRoleIds: await authorizationRepository.getParentRoleIds(conn, role.roleId),
        authorityRoles: await authorizationRepository.getParentRoles(conn, role.roleId),
        userCount: userCountsByRole[role.roleId] ?? 0,
    })));
    return {
        roles,
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
        roleCounts,
    };
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

export async function createUser(conn: Connection, input: CreateUserRequest, actorUserId: number | null = null): Promise<CreatedUser> {
    const userName = input.userName?.trim();
    const loginUserName = input.loginUserName?.trim();
    const email = input.email?.trim();
    if (!userName || !loginUserName || !email) throw new Error('Missing required user fields');
    if (input.userType !== 'EMPLOYEE' && input.userType !== 'CUSTOMER') throw new Error('userType must be EMPLOYEE or CUSTOMER');
    if (input.userType === 'CUSTOMER' && (!Number.isSafeInteger(input.customerId) || input.customerId! <= 0)) {
        throw new Error('Customer users require a positive integer customerId');
    }
    if (input.customerId != null && (!Number.isSafeInteger(input.customerId) || input.customerId <= 0)) {
        throw new Error('customerId must be a positive integer');
    }
    const stationIds = input.userType === 'CUSTOMER'
        ? await validateStationIdsForCustomer(conn, input.customerId!, input.stationIds ?? [])
        : [];
    if (input.userType === 'EMPLOYEE' && input.stationIds != null && (!Array.isArray(input.stationIds) || input.stationIds.length > 0)) {
        throw new Error('stationIds can only be assigned to CUSTOMER users');
    }
    if (await authorizationRepository.getUserByLoginName(conn, loginUserName)) throw new Error('Login name already exists');
    // if (await authorizationRepository.getUserByEmail(conn, email)) throw new Error('Email already exists');

    const roles = await validateRoleIdsForUser(conn, input.userType, input.roleIds ?? []);
    const roleIds = roles.map(({ roleId }) => roleId);
    const passwordCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const generatedPassword = Array.from(
        { length: 10 },
        () => passwordCharacters.charAt(randomInt(passwordCharacters.length)),
    ).join('');
    await conn.beginTransaction();
    try {
        const user = await authorizationRepository.insertUser(conn, {
            userName,
            loginUserName,
            email,
            passwordHash: createPasswordHash(generatedPassword),
            userType: input.userType,
            customerId: input.customerId ?? null,
            createdBy: actorUserId,
            updatedBy: actorUserId,
        });
        for (const roleId of roleIds) await authorizationRepository.assignRole(conn, user.userId, roleId, actorUserId);
        await authorizationRepository.replaceUserStations(conn, user.userId, stationIds, actorUserId);
        await conn.commit();
        let credentialEmailSent = true;
        try {
            await sendEmail(
                email,
                'Your RM Trucking account credentials',
                `Your account has been created.\n\nLogin user name: ${loginUserName}\nPassword: ${generatedPassword}\n\nPlease sign in and change your password after logging in.`,
            );
        } catch (error) {
            credentialEmailSent = false;
            console.error(`Failed to send initial credentials for userId=${user.userId}:`, error instanceof Error ? error.message : String(error));
        }
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return { ...safeUser, roleIds, stationIds, credentialEmailSent };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}

export async function updateUser(conn: Connection, userId: number, input: UpdateUserRequest, actorUserId: number | null = null): Promise<UserWithRoleIds> {
    const existing = await authorizationRepository.getUserById(conn, userId);
    if (!existing) throw new Error('User not found');
    const userType = input.userType ?? existing.userType;
    if (userType !== 'EMPLOYEE' && userType !== 'CUSTOMER') throw new Error('userType must be EMPLOYEE or CUSTOMER');
    const customerId = input.customerId ?? existing.customerId;
    if (customerId !== null && (!Number.isSafeInteger(customerId) || customerId <= 0)) throw new Error('customerId must be a positive integer');
    if (input.userType !== undefined && input.userType !== existing.userType && input.roleIds === undefined) {
        throw new Error('roleIds must be provided when changing userType');
    }
    if (userType === 'CUSTOMER' && customerId === null) throw new Error('Customer users require a customerId');
    const customerChanged = input.customerId !== undefined && input.customerId !== existing.customerId;
    if (userType === 'CUSTOMER' && input.stationIds === undefined && (existing.userType !== 'CUSTOMER' || customerChanged)) {
        throw new Error('stationIds must be provided when changing a user to CUSTOMER or changing customerId');
    }
    let stationIds: number[] | undefined;
    if (userType === 'CUSTOMER' && input.stationIds !== undefined) {
        stationIds = await validateStationIdsForCustomer(conn, customerId!, input.stationIds);
    } else if (userType === 'EMPLOYEE') {
        if (input.stationIds != null && (!Array.isArray(input.stationIds) || input.stationIds.length > 0)) {
            throw new Error('stationIds can only be assigned to CUSTOMER users');
        }
        if (existing.userType === 'CUSTOMER') stationIds = [];
    }
    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase() && await authorizationRepository.getUserByEmail(conn, input.email)) {
        throw new Error('Email already exists');
    }
    const roleIds = input.roleIds === undefined
        ? undefined
        : (await validateRoleIdsForUser(conn, userType, input.roleIds)).map(({ roleId }) => roleId);

    await conn.beginTransaction();
    try {
        await authorizationRepository.updateUser(conn, userId, { ...input, updatedBy: actorUserId });
        if (stationIds !== undefined) await authorizationRepository.replaceUserStations(conn, userId, stationIds, actorUserId);
        if (roleIds !== undefined) {
            const oldRoles = await authorizationRepository.getUserRoles(conn, userId);
            for (const role of oldRoles) await authorizationRepository.removeRole(conn, userId, role.roleId);
            for (const roleId of roleIds) await authorizationRepository.assignRole(conn, userId, roleId, actorUserId);
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    }
    const updated = await authorizationRepository.getUserById(conn, userId);
    if (!updated) throw new Error('User not found after update');
    const { passwordHash: _passwordHash, ...safeUser } = updated;
    return {
        ...safeUser,
        roleIds: await authorizationRepository.getUserRoleIds(conn, userId),
        stationIds: await authorizationRepository.getUserStationIds(conn, userId),
    };
}

export async function listUsers(
    conn: Connection,
    userType: AuthorizationRoleKind,
    search: string | undefined,
    page: number,
    pageSize: number,
): Promise<{
    users: UserListItem[];
    pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
    userCounts: Record<'EMPLOYEE' | 'CUSTOMER', number>;
}> {
    if (userType !== 'EMPLOYEE' && userType !== 'CUSTOMER') throw new Error('userType must be EMPLOYEE or CUSTOMER');
    if (!Number.isSafeInteger(page) || page < 1) throw new Error('page must be a positive integer');
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error('pageSize must be between 1 and 100');

    const normalizedSearch = search?.trim() || undefined;
    const rows = await authorizationRepository.getUsers(conn, userType, normalizedSearch, page, pageSize);
    const totalCount = await authorizationRepository.countUsers(conn, userType, normalizedSearch);
    const userCounts = await authorizationRepository.countUsersByType(conn);
    const users = await mapUserListItems(conn, rows);
    return {
        users,
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
        userCounts,
    };
}

async function mapUserListItems(conn: Connection, rows: authorizationRepository.UserRecord[]): Promise<UserListItem[]> {
    const assignments = await authorizationRepository.getUserRoleDetailsForUsers(conn, rows.map(({ userId }) => userId));
    const stationAssignments = await authorizationRepository.getUserStationDetailsForUsers(conn, rows.map(({ userId }) => userId));
    const rolesByUser = new Map<number, Array<{ roleId: number; roleName: string }>>();
    const stationsByUser = new Map<number, Array<{ stationId: number; stationName: string }>>();
    for (const { userId, roleId, roleName } of assignments) {
        const roles = rolesByUser.get(userId) ?? [];
        if (!roles.some((role) => role.roleId === roleId)) roles.push({ roleId, roleName });
        rolesByUser.set(userId, roles);
    }
    for (const { userId, stationId, stationName } of stationAssignments) {
        const stations = stationsByUser.get(userId) ?? [];
        if (!stations.some((station) => station.stationId === stationId)) stations.push({ stationId, stationName });
        stationsByUser.set(userId, stations);
    }
    const users = rows.map(({ passwordHash: _passwordHash, ...user }) => ({
        ...user,
        roles: rolesByUser.get(user.userId) ?? [],
        customerName: user.customerName ?? null,
        stations: stationsByUser.get(user.userId) ?? [],
        createdByName: user.createdByName ?? null,
        updatedByName: user.updatedByName ?? null,
    }));
    return users;
}

export async function listUsersByRoleId(
    conn: Connection,
    roleId: number,
    search: string | undefined,
    page: number,
    pageSize: number,
): Promise<{
    role: Pick<Role, 'roleId' | 'name' | 'roleKind'>;
    users: UserListItem[];
    pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
}> {
    if (!Number.isSafeInteger(roleId) || roleId <= 0) throw new Error('roleId must be a positive integer');
    if (!Number.isSafeInteger(page) || page < 1) throw new Error('page must be a positive integer');
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error('pageSize must be between 1 and 100');

    const role = await authorizationRepository.getRoleById(conn, roleId);
    if (!role) throw new Error('Role not found');
    const normalizedSearch = search?.trim() || undefined;
    const rows = await authorizationRepository.getUsersByRoleId(conn, roleId, normalizedSearch, page, pageSize);
    const totalCount = await authorizationRepository.countUsersByRoleId(conn, roleId, normalizedSearch);
    return {
        role: { roleId: role.roleId, name: role.name, roleKind: role.roleKind },
        users: await mapUserListItems(conn, rows),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    };
}

export async function getUserById(conn: Connection, userId: number): Promise<UserWithRoleIds | null> {
    const user = await authorizationRepository.getUserById(conn, userId);
    if (!user) return null;
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
        ...safeUser,
        roleIds: await authorizationRepository.getUserRoleIds(conn, userId),
        stationIds: await authorizationRepository.getUserStationIds(conn, userId),
    };
}

export async function setUserActiveStatus(
    conn: Connection,
    userId: number,
    activeStatus: 'Y' | 'N',
    actorUserId: number | null = null,
): Promise<UserWithRoleIds> {
    if (!await authorizationRepository.getUserById(conn, userId)) throw new Error('User not found');
    await authorizationRepository.updateUser(conn, userId, { activeStatus, updatedBy: actorUserId });
    const user = await getUserById(conn, userId);
    if (!user) throw new Error('User not found after status update');
    return user;
}

export async function getUserRoles(conn: Connection, userId: number): Promise<RoleWithAuditNames[]> {
    const roles = await authorizationRepository.getUserRoles(conn, userId);
    return Promise.all(roles.map((role) => addRoleAuditNames(conn, role)));
}

export async function getUserPermissions(conn: Connection, userId: number): Promise<Permission[]> {
    const rows = await authorizationRepository.getUserPermissions(conn, userId);
    return rows.map(mapPermission);
}

export async function removeUserRole(conn: Connection, userId: number, roleId: number): Promise<void> {
    await authorizationRepository.removeRole(conn, userId, roleId);
}

export async function login(conn: Connection, input: LoginRequest): Promise<{ user: Omit<User, 'passwordHash'>; roles: RoleWithAuditNames[]; permissions: Permission[]; tokenPair: TokenPair }> {
    const user = await authorizationRepository.getUserByLoginName(conn, input.loginUserName);
    if (!user || user.activeStatus !== 'Y' || !verifyStoredPassword(input.password, user.passwordHash)) throw new Error('Invalid username or password');
    const roles = await getUserRoles(conn, user.userId);
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

export async function getPermissionCatalog(conn: Connection, roleKind: AuthorizationRoleKind): Promise<Record<PermissionApplicationCode, Record<string, Permission[]>>> {
    if (roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
        throw new Error('roleKind must be EMPLOYEE or CUSTOMER');
    }
    const catalog: Record<PermissionApplicationCode, Record<string, Permission[]>> = {
        warehouse: {},
        maintenance: {},
        network_services: {},
    };
    for (const row of await authorizationRepository.getPermissionCatalog(conn)) {
        const permission = mapPermission(row);
        if (roleKind === 'EMPLOYEE' && permission.forEmployee !== 'Y') continue;
        if (roleKind === 'CUSTOMER' && permission.forCustomer !== 'Y') continue;
        const modules = catalog[permission.applicationCode];
        modules[permission.moduleKey] ??= [];
        modules[permission.moduleKey].push(permission);
    }
    return catalog;
}

export async function getRolePermissionSummary(conn: Connection, userId: number): Promise<{ roles: RoleWithAuditNames[]; permissions: Permission[] }> {
    const roles = await getUserRoles(conn, userId);
    const permissions = await getUserPermissions(conn, userId);
    return { roles, permissions };
}