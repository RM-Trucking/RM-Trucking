import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';

const users = `${SCHEMA}."User"`;
const roles = `${SCHEMA}."Role"`;
const userRoles = `${SCHEMA}."UserRoleAssignment"`;
const userStations = `${SCHEMA}."UserStationAssignment"`;
const rolePermissions = `${SCHEMA}."RolePermission"`;
const roleHierarchy = `${SCHEMA}."RoleHierarchyLink"`;
const permissions = `${SCHEMA}."Permission"`;
const resetOtps = `${SCHEMA}."PasswordResetOtp"`;

export interface RoleRecord {
    roleId: number;
    name: string;
    description: string | null;
    roleKind: 'EMPLOYEE' | 'CUSTOMER';
    status: 'ACTIVE' | 'INACTIVE';
    isSystemManaged: 'Y' | 'N';
    createdBy: number | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
}

export interface UserRecord {
    userId: number;
    userName: string;
    loginUserName: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    createdBy: number | null;
    activeStatus: 'Y' | 'N';
    userType: 'EMPLOYEE' | 'CUSTOMER';
    customerId: number | null;
}

export async function getPermissionCatalog(conn: Connection): Promise<any[]> {
    return (await conn.query(`SELECT * FROM ${permissions} ORDER BY "applicationCode", "moduleKey", "permissionCode"`)) as any[];
}

export interface PermissionImportRecord {
    permissionCode: string;
    displayName: string;
    applicationCode: 'warehouse' | 'maintenance' | 'network_services';
    permissionKey: string;
    moduleKey: string;
    resourceKey: string;
    actionKey: string;
    description: string | null;
    forEmployee: 'Y' | 'N';
    forCustomer: 'Y' | 'N';
}

export async function upsertPermission(conn: Connection, permission: PermissionImportRecord): Promise<'inserted' | 'updated'> {
    const existing = (await conn.query(
        `SELECT "permissionId" FROM ${permissions} WHERE UPPER("permissionCode") = UPPER(?)`,
        [permission.permissionCode],
    )) as any[];

    if (existing.length > 0) {
        await conn.query(
            `UPDATE ${permissions} SET "displayName" = ?, "applicationCode" = ?, "permissionKey" = ?, "moduleKey" = ?, "resourceKey" = ?, "actionKey" = ?, "description" = ?, "forEmployee" = ?, "forCustomer" = ? WHERE UPPER("permissionCode") = UPPER(?)`,
            [permission.displayName, permission.applicationCode, permission.permissionKey, permission.moduleKey, permission.resourceKey, permission.actionKey, permission.description, permission.forEmployee, permission.forCustomer, permission.permissionCode] as any[],
        );
        return 'updated';
    }

    await conn.query(
        `INSERT INTO ${permissions} ("permissionCode", "displayName", "applicationCode", "permissionKey", "moduleKey", "resourceKey", "actionKey", "description", "forEmployee", "forCustomer") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [permission.permissionCode, permission.displayName, permission.applicationCode, permission.permissionKey, permission.moduleKey, permission.resourceKey, permission.actionKey, permission.description, permission.forEmployee, permission.forCustomer] as any[],
    );
    return 'inserted';
}

export async function getPermissionsByCodes(conn: Connection, permissionCodes: string[]): Promise<any[]> {
    if (permissionCodes.length === 0) return [];
    const marks = permissionCodes.map(() => '?').join(', ');
    return (await conn.query(
        `SELECT * FROM ${permissions} WHERE UPPER("permissionCode") IN (${marks})`,
        permissionCodes.map((code) => code.toUpperCase()),
    )) as any[];
}

export async function getRoleById(conn: Connection, roleId: number): Promise<RoleRecord | null> {
    const rows = (await conn.query(`SELECT * FROM ${roles} WHERE "roleId" = ?`, [roleId])) as RoleRecord[];
    return rows[0] ?? null;
}

export async function getRoleByName(conn: Connection, name: string, roleKind: 'EMPLOYEE' | 'CUSTOMER'): Promise<RoleRecord | null> {
    const rows = (await conn.query(`SELECT * FROM ${roles} WHERE UPPER("name") = UPPER(?) AND "roleKind" = ?`, [name, roleKind])) as RoleRecord[];
    return rows[0] ?? null;
}

function buildRoleFilters(roleKind?: 'EMPLOYEE' | 'CUSTOMER', roleName?: string, includeRoleKind = true): { whereClause: string; values: string[] } {
    const filters: string[] = ['"status" = ?'];
    const values: string[] = ['ACTIVE'];
    if (includeRoleKind && roleKind) {
        filters.push('"roleKind" = ?');
        values.push(roleKind);
    }
    if (roleName?.trim()) {
        filters.push('UPPER("name") LIKE UPPER(?)');
        values.push(`%${roleName.trim()}%`);
    }
    return { whereClause: ` WHERE ${filters.join(' AND ')}`, values };
}

export async function getRoles(
    conn: Connection,
    roleKind?: 'EMPLOYEE' | 'CUSTOMER',
    roleName?: string,
    page = 1,
    pageSize = 20,
): Promise<RoleRecord[]> {
    const { whereClause, values } = buildRoleFilters(roleKind, roleName);
    const offset = (page - 1) * pageSize;
    return (await conn.query(
        `SELECT * FROM ${roles}${whereClause} ORDER BY "name" OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [...values, offset, pageSize],
    )) as RoleRecord[];
}

export async function countRoles(conn: Connection, roleKind?: 'EMPLOYEE' | 'CUSTOMER', roleName?: string): Promise<number> {
    const { whereClause, values } = buildRoleFilters(roleKind, roleName);
    const rows = (await conn.query(`SELECT COUNT(*) AS "totalCount" FROM ${roles}${whereClause}`, values)) as Array<{ totalCount?: number; TOTALCOUNT?: number }>;
    return Number(rows[0]?.totalCount ?? rows[0]?.TOTALCOUNT ?? 0);
}

export async function countRolesByKind(conn: Connection, roleName?: string): Promise<Record<'EMPLOYEE' | 'CUSTOMER', number>> {
    const { whereClause, values } = buildRoleFilters(undefined, roleName, false);
    const rows = (await conn.query(
        `SELECT "roleKind", COUNT(*) AS "roleCount" FROM ${roles}${whereClause} GROUP BY "roleKind"`,
        values,
    )) as Array<{ roleKind?: string; ROLEKIND?: string; roleCount?: number; ROLECOUNT?: number }>;
    const counts: Record<'EMPLOYEE' | 'CUSTOMER', number> = { EMPLOYEE: 0, CUSTOMER: 0 };
    for (const row of rows) {
        const roleKind = String(row.roleKind ?? row.ROLEKIND ?? '').toUpperCase();
        if (roleKind === 'EMPLOYEE' || roleKind === 'CUSTOMER') {
            counts[roleKind] = Number(row.roleCount ?? row.ROLECOUNT ?? 0);
        }
    }
    return counts;
}

export async function getRoleOptions(conn: Connection, roleKind?: 'EMPLOYEE' | 'CUSTOMER'): Promise<Array<Pick<RoleRecord, 'roleId' | 'name' | 'roleKind'>>> {
    const roleKindFilter = roleKind ? ' AND "roleKind" = ?' : '';
    const values = roleKind ? ['ACTIVE', roleKind] : ['ACTIVE'];
    return (await conn.query(
        `SELECT "roleId", "name", "roleKind" FROM ${roles} WHERE "status" = ?${roleKindFilter} ORDER BY "name"`,
        values,
    )) as Array<Pick<RoleRecord, 'roleId' | 'name' | 'roleKind'>>;
}

export async function getParentRoleIds(conn: Connection, childRoleId: number): Promise<number[]> {
    const rows = (await conn.query(
        `SELECT "parentRoleId" FROM ${roleHierarchy} WHERE "childRoleId" = ? ORDER BY "parentRoleId"`,
        [childRoleId],
    )) as Array<{ parentRoleId: number }>;
    return rows.map(({ parentRoleId }) => Number(parentRoleId));
}

export async function getParentRoles(conn: Connection, childRoleId: number): Promise<Array<Pick<RoleRecord, 'roleId' | 'name'>>> {
    return (await conn.query(
        `SELECT r."roleId", r."name" FROM ${roleHierarchy} h INNER JOIN ${roles} r ON r."roleId" = h."parentRoleId" WHERE h."childRoleId" = ? ORDER BY r."name"`,
        [childRoleId],
    )) as Array<Pick<RoleRecord, 'roleId' | 'name'>>;
}

export async function assignParentRole(conn: Connection, parentRoleId: number, childRoleId: number, createdBy: number | null): Promise<void> {
    await conn.query(
        `INSERT INTO ${roleHierarchy} ("parentRoleId", "childRoleId", "createdBy", "createdAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [parentRoleId, childRoleId, createdBy] as any[],
    );
}

function withCause(message: string, cause: unknown): Error {
    const error = new Error(message);
    (error as Error & { cause?: unknown }).cause = cause;
    return error;
}

export async function replaceParentRoles(conn: Connection, childRoleId: number, parentRoleIds: number[], createdBy: number | null): Promise<void> {
    try {
        await conn.query(`DELETE FROM ${roleHierarchy} WHERE "childRoleId" = ?`, [childRoleId]);
        for (const parentRoleId of parentRoleIds) {
            await assignParentRole(conn, parentRoleId, childRoleId, createdBy);
        }
    } catch (error) {
        throw withCause(`RoleHierarchyLink operation failed for childRoleId=${childRoleId}`, error);
    }
}

export async function insertRole(conn: Connection, input: {
    name: string;
    description: string | null;
    roleKind: 'EMPLOYEE' | 'CUSTOMER';
    status: 'ACTIVE' | 'INACTIVE';
    isSystemManaged?: 'Y' | 'N';
    createdBy: number | null;
}): Promise<RoleRecord> {
    try {
        await conn.query(
            `INSERT INTO ${roles} ("name", "description", "roleKind", "status", "isSystemManaged", "createdBy", "createdAt", "updatedBy", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)`,
            [input.name, input.description, input.roleKind, input.status, input.isSystemManaged ?? 'N', input.createdBy, input.createdBy] as any[],
        );
    } catch (error) {
        throw withCause(`Role INSERT failed for name=${input.name}`, error);
    }
    const role = await getRoleByName(conn, input.name, input.roleKind);
    if (!role) throw new Error('Failed to retrieve the created role');
    return role;
}

export async function updateRole(conn: Connection, roleId: number, input: {
    name?: string;
    description?: string | null;
    roleKind?: 'EMPLOYEE' | 'CUSTOMER';
    status?: 'ACTIVE' | 'INACTIVE';
    isSystemManaged?: 'Y' | 'N';
    updatedBy?: number | null;
}): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    for (const [field, column] of [
        ['name', 'name'],
        ['description', 'description'],
        ['roleKind', 'roleKind'],
        ['status', 'status'],
        ['isSystemManaged', 'isSystemManaged'],
        ['updatedBy', 'updatedBy'],
    ] as const) {
        if (input[field] !== undefined) {
            sets.push(`"${column}" = ?`);
            values.push(input[field]);
        }
    }
    if (sets.length === 0) return;
    sets.push('"updatedAt" = CURRENT_TIMESTAMP');
    try {
        await conn.query(`UPDATE ${roles} SET ${sets.join(', ')} WHERE "roleId" = ?`, [...values, roleId] as any[]);
    } catch (error) {
        throw withCause(`Role UPDATE failed for roleId=${roleId}`, error);
    }
}

export async function getRolePermissionCodes(conn: Connection, roleId: number): Promise<string[]> {
    const rows = (await conn.query(`SELECT "permissionCode" FROM ${rolePermissions} WHERE "roleId" = ?`, [roleId])) as Array<{ permissionCode: string }>;
    return rows.map(({ permissionCode }) => permissionCode);
}

export async function replaceRolePermissions(conn: Connection, roleId: number, permissionCodes: string[], grantedBy: number | null): Promise<void> {
    const permissionRows = await getPermissionsByCodes(conn, permissionCodes);
    if (permissionRows.length !== permissionCodes.length) throw new Error('One or more permission codes were not found');

    try {
        await conn.query(`DELETE FROM ${rolePermissions} WHERE "roleId" = ?`, [roleId]);
    } catch (error) {
        throw withCause(`RolePermission DELETE failed for roleId=${roleId}`, error);
    }
    for (const permission of permissionRows) {
        const permissionCode = String(permission.permissionCode ?? permission.PERMISSIONCODE);
        try {
            await conn.query(
                `INSERT INTO ${rolePermissions} ("roleId", "permissionCode", "grantedBy", "createdAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [roleId, permissionCode, grantedBy] as any[],
            );
        } catch (error) {
            throw withCause(`RolePermission INSERT failed for roleId=${roleId}, permissionCode=${permissionCode}`, error);
        }
    }
}

export async function getUserById(conn: Connection, userId: number): Promise<UserRecord | null> {
    const rows = (await conn.query(`SELECT * FROM ${users} WHERE "userId" = ?`, [userId])) as UserRecord[];
    return rows[0] ?? null;
}

export async function getUserByLoginName(conn: Connection, loginUserName: string): Promise<UserRecord | null> {
    const rows = (await conn.query(`SELECT * FROM ${users} WHERE UPPER("loginUserName") = UPPER(?)`, [loginUserName])) as UserRecord[];
    return rows[0] ?? null;
}

export async function getUserByName(conn: Connection, userName: string): Promise<UserRecord | null> {
    const rows = (await conn.query(
        `SELECT * FROM ${users} WHERE UPPER("userName") = UPPER(?) OR UPPER("loginUserName") = UPPER(?)`,
        [userName, userName],
    )) as UserRecord[];
    return rows[0] ?? null;
}

export async function getUserByEmail(conn: Connection, email: string): Promise<UserRecord | null> {
    const rows = (await conn.query(`SELECT * FROM ${users} WHERE UPPER("email") = UPPER(?)`, [email])) as UserRecord[];
    return rows[0] ?? null;
}

export async function getUsers(conn: Connection): Promise<UserRecord[]> {
    return (await conn.query(
        `SELECT "userId", "userName", "loginUserName", "email", "createdAt", "createdBy", "activeStatus", "userType", "customerId" FROM ${users} ORDER BY "userName"`,
    )) as UserRecord[];
}

export interface UserPageOptions {
    userType?: 'EMPLOYEE' | 'CUSTOMER';
    page: number;
    pageSize: number;
    search?: string;
    activeStatus?: 'Y' | 'N';
}

export async function getUsersPage(conn: Connection, { userType, page, pageSize, search, activeStatus }: UserPageOptions) {
    const filters: string[] = [];
    const values: string[] = [];
    if (userType) {
        filters.push('u."userType" = ?');
        values.push(userType);
    }
    if (activeStatus) {
        filters.push('u."activeStatus" = ?');
        values.push(activeStatus);
    }
    if (search) {
        filters.push(`(
            LOCATE(?, LOWER(u."userName")) > 0 OR LOCATE(?, LOWER(u."loginUserName")) > 0
            OR LOCATE(?, CAST(u."createdBy" AS VARCHAR(20))) > 0
            OR EXISTS (
                SELECT 1 FROM ${userRoles} ur JOIN ${roles} r ON r."roleId" = ur."roleId"
                WHERE ur."userId" = u."userId" AND ur."assignmentStatus" = 'ACTIVE'
                    AND r."status" = 'ACTIVE' AND LOCATE(?, LOWER(r."name")) > 0
            )
        )`);
        values.push(...Array<string>(4).fill(search.toLowerCase()));
    }
    const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
    const counts = await conn.query(
        `SELECT COUNT(*) AS "totalCount" FROM ${users} u${where}`, values,
    ) as Array<{ totalCount?: number; TOTALCOUNT?: number }>;
    const rows = await conn.query(
        `SELECT u."userId", u."userName", u."loginUserName", u."email", u."createdAt", u."createdBy",
            u."activeStatus", u."userType", u."customerId" FROM ${users} u${where}
            ORDER BY u."userName", u."userId" OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [...values, (page - 1) * pageSize, pageSize],
    ) as UserRecord[];
    return { rows, totalCount: Number(counts[0]?.totalCount ?? counts[0]?.TOTALCOUNT ?? 0) };
}

export async function insertUser(conn: Connection, input: {
    userName: string;
    loginUserName: string;
    email: string;
    passwordHash: string;
    userType: 'EMPLOYEE' | 'CUSTOMER';
    customerId: number | null;
    createdBy: number | null;
}): Promise<UserRecord> {
    await conn.query(
        `INSERT INTO ${users} ("userName", "loginUserName", "email", "passwordHash", "createdAt", "createdBy", "activeStatus", "userType", "customerId") VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'Y', ?, ?)`,
        [input.userName, input.loginUserName, input.email, input.passwordHash, input.createdBy, input.userType, input.customerId] as any[],
    );
    const result = (await conn.query(`SELECT IDENTITY_VAL_LOCAL() AS "userId" FROM SYSIBM.SYSDUMMY1`)) as Array<{ userId: number }>;
    const user = await getUserById(conn, Number(result[0]?.userId));
    if (!user) throw new Error('Failed to retrieve the created user');
    return user;
}

export async function updateUser(conn: Connection, userId: number, input: {
    userName?: string;
    email?: string;
    userType?: 'EMPLOYEE' | 'CUSTOMER';
    customerId?: number | null;
    activeStatus?: 'Y' | 'N';
}): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    for (const [field, column] of [
        ['userName', 'userName'],
        ['email', 'email'],
        ['userType', 'userType'],
        ['customerId', 'customerId'],
        ['activeStatus', 'activeStatus'],
    ] as const) {
        if (input[field] !== undefined) {
            sets.push(`"${column}" = ?`);
            values.push(input[field]);
        }
    }
    if (sets.length > 0) {
        await conn.query(`UPDATE ${users} SET ${sets.join(', ')} WHERE "userId" = ?`, [...values, userId] as any[]);
    }
}

export async function getUserRoles(conn: Connection, userId: number): Promise<RoleRecord[]> {
    return (await conn.query(
        `SELECT r.* FROM ${roles} r INNER JOIN ${userRoles} ur ON ur."roleId" = r."roleId" WHERE ur."userId" = ? AND ur."assignmentStatus" = 'ACTIVE' AND r."status" = 'ACTIVE' ORDER BY r."name"`,
        [userId],
    )) as RoleRecord[];
}

export async function assignRole(conn: Connection, userId: number, roleId: number, grantedBy: number | null, reason: string | null): Promise<void> {
    const existing = (await conn.query(`SELECT "userId" FROM ${userRoles} WHERE "userId" = ? AND "roleId" = ?`, [userId, roleId])) as any[];
    if (existing.length > 0) {
        await conn.query(
            `UPDATE ${userRoles} SET "assignmentStatus" = 'ACTIVE', "validFrom" = CURRENT_TIMESTAMP, "validTo" = NULL, "grantedBy" = ?, "reason" = ? WHERE "userId" = ? AND "roleId" = ?`,
            [grantedBy, reason, userId, roleId] as any[],
        );
        return;
    }
    await conn.query(
        `INSERT INTO ${userRoles} ("userId", "roleId", "assignmentStatus", "validFrom", "validTo", "grantedBy", "reason", "createdAt") VALUES (?, ?, 'ACTIVE', CURRENT_TIMESTAMP, NULL, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, roleId, grantedBy, reason] as any[],
    );
}

export async function assignUserStation(conn: Connection, userId: number, stationId: number): Promise<void> {
    await conn.query(`INSERT INTO ${userStations} ("userId", "stationId") VALUES (?, ?)`, [userId, stationId]);
}

export async function removeRole(conn: Connection, userId: number, roleId: number): Promise<void> {
    await conn.query(
        `UPDATE ${userRoles} SET "assignmentStatus" = 'INACTIVE', "validTo" = CURRENT_TIMESTAMP WHERE "userId" = ? AND "roleId" = ?`,
        [userId, roleId],
    );
}

export async function getUserPermissions(conn: Connection, userId: number): Promise<any[]> {
    return (await conn.query(
        `SELECT DISTINCT p.* FROM ${permissions} p INNER JOIN ${rolePermissions} rp ON rp."permissionCode" = p."permissionCode" INNER JOIN ${userRoles} ur ON ur."roleId" = rp."roleId" INNER JOIN ${roles} r ON r."roleId" = ur."roleId" WHERE ur."userId" = ? AND ur."assignmentStatus" = 'ACTIVE' AND r."status" = 'ACTIVE'`,
        [userId],
    )) as any[];
}

export async function createResetOtp(conn: Connection, userId: number, otpHash: string, expiresAtIso: string): Promise<void> {
    await conn.query(`UPDATE ${resetOtps} SET "status" = 'INVALIDATED' WHERE "userId" = ? AND "status" = 'PENDING'`, [userId]);
    await conn.query(
        `INSERT INTO ${resetOtps} ("userId", "otpHash", "createdAt", "expiresAt", "attemptCount", "status") VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0, 'PENDING')`,
        [userId, otpHash, expiresAtIso] as any[],
    );
}

export async function getPendingResetOtp(conn: Connection, userId: number): Promise<any | null> {
    const rows = (await conn.query(
        `SELECT * FROM ${resetOtps} WHERE "userId" = ? AND "status" = 'PENDING' AND "expiresAt" > CURRENT_TIMESTAMP ORDER BY "createdAt" DESC FETCH FIRST 1 ROW ONLY`,
        [userId],
    )) as any[];
    return rows[0] ?? null;
}

export async function incrementResetOtpAttempts(conn: Connection, resetOtpId: number, maxAttempts: number): Promise<void> {
    await conn.query(
        `UPDATE ${resetOtps} SET "attemptCount" = "attemptCount" + 1, "status" = CASE WHEN "attemptCount" + 1 >= ? THEN 'LOCKED' ELSE "status" END WHERE "resetOtpId" = ?`,
        [maxAttempts, resetOtpId],
    );
}

export async function consumeResetOtp(conn: Connection, resetOtpId: number): Promise<void> {
    await conn.query(
        `UPDATE ${resetOtps} SET "status" = 'CONSUMED', "consumedAt" = CURRENT_TIMESTAMP WHERE "resetOtpId" = ? AND "status" = 'PENDING'`,
        [resetOtpId],
    );
}

export async function updatePassword(conn: Connection, userId: number, passwordHash: string): Promise<void> {
    await conn.query(`UPDATE ${users} SET "passwordHash" = ? WHERE "userId" = ?`, [passwordHash, userId]);
}
