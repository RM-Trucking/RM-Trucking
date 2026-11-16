import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';

const users = `${SCHEMA}."User"`;
const roles = `${SCHEMA}."Role"`;
const userRoles = `${SCHEMA}."UserRoleAssignment"`;
const rolePermissions = `${SCHEMA}."RolePermission"`;
const permissions = `${SCHEMA}."Permissions"`;
const resetOtps = `${SCHEMA}."PasswordResetOtp"`;

export interface RoleRecord {
    roleId: number;
    name: string;
    description: string | null;
    roleKind: 'EMPLOYEE' | 'CUSTOMER';
    status: 'ACTIVE' | 'INACTIVE';
    isSystemManaged: boolean;
    rowVersion: number;
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
    return (await conn.query(`SELECT * FROM ${permissions} ORDER BY "permissionId"`)) as any[];
}

export async function getPermissionsByIds(conn: Connection, permissionIds: number[]): Promise<any[]> {
    if (permissionIds.length === 0) return [];
    const marks = permissionIds.map(() => '?').join(', ');
    return (await conn.query(
        `SELECT * FROM ${permissions} WHERE "permissionId" IN (${marks})`,
        permissionIds as any[],
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

export async function getRoles(conn: Connection): Promise<RoleRecord[]> {
    return (await conn.query(`SELECT * FROM ${roles} ORDER BY "name"`)) as RoleRecord[];
}

export async function insertRole(conn: Connection, input: {
    name: string;
    description: string | null;
    roleKind: 'EMPLOYEE' | 'CUSTOMER';
    status: 'ACTIVE' | 'INACTIVE';
    createdBy: number | null;
}): Promise<RoleRecord> {
    await conn.query(
        `INSERT INTO ${roles} ("name", "description", "roleKind", "status", "isSystemManaged", "rowVersion", "createdBy", "createdAt", "updatedBy", "updatedAt") VALUES (?, ?, ?, ?, 0, 1, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)`,
        [input.name, input.description, input.roleKind, input.status, input.createdBy, input.createdBy] as any[],
    );
    const result = (await conn.query(`SELECT IDENTITY_VAL_LOCAL() AS "roleId" FROM SYSIBM.SYSDUMMY1`)) as Array<{ roleId: number }>;
    const role = await getRoleById(conn, Number(result[0]?.roleId));
    if (!role) throw new Error('Failed to retrieve the created role');
    return role;
}

export async function updateRole(conn: Connection, roleId: number, input: {
    name?: string;
    description?: string | null;
    roleKind?: 'EMPLOYEE' | 'CUSTOMER';
    status?: 'ACTIVE' | 'INACTIVE';
    updatedBy?: number | null;
}): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    for (const [field, column] of [
        ['name', 'name'],
        ['description', 'description'],
        ['roleKind', 'roleKind'],
        ['status', 'status'],
        ['updatedBy', 'updatedBy'],
    ] as const) {
        if (input[field] !== undefined) {
            sets.push(`"${column}" = ?`);
            values.push(input[field]);
        }
    }
    if (sets.length === 0) return;
    sets.push('"updatedAt" = CURRENT_TIMESTAMP', '"rowVersion" = "rowVersion" + 1');
    await conn.query(`UPDATE ${roles} SET ${sets.join(', ')} WHERE "roleId" = ?`, [...values, roleId] as any[]);
}

export async function getRolePermissionIds(conn: Connection, roleId: number): Promise<number[]> {
    const rows = (await conn.query(`SELECT "permissionId" FROM ${rolePermissions} WHERE "roleId" = ?`, [roleId])) as Array<{ permissionId: number }>;
    return rows.map(({ permissionId }) => Number(permissionId));
}

export async function replaceRolePermissions(conn: Connection, roleId: number, permissionIds: number[], grantedBy: number | null): Promise<void> {
    await conn.query(`DELETE FROM ${rolePermissions} WHERE "roleId" = ?`, [roleId]);
    for (const permissionId of permissionIds) {
        await conn.query(
            `INSERT INTO ${rolePermissions} ("roleId", "permissionId", "grantedBy", "createdAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [roleId, permissionId, grantedBy] as any[],
        );
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

export async function getUserByEmail(conn: Connection, email: string): Promise<UserRecord | null> {
    const rows = (await conn.query(`SELECT * FROM ${users} WHERE UPPER("email") = UPPER(?)`, [email])) as UserRecord[];
    return rows[0] ?? null;
}

export async function getUsers(conn: Connection): Promise<UserRecord[]> {
    return (await conn.query(
        `SELECT "userId", "userName", "loginUserName", "email", "createdAt", "createdBy", "activeStatus", "userType", "customerId" FROM ${users} ORDER BY "userName"`,
    )) as UserRecord[];
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

export async function removeRole(conn: Connection, userId: number, roleId: number): Promise<void> {
    await conn.query(
        `UPDATE ${userRoles} SET "assignmentStatus" = 'INACTIVE', "validTo" = CURRENT_TIMESTAMP WHERE "userId" = ? AND "roleId" = ?`,
        [userId, roleId],
    );
}

export async function getUserPermissions(conn: Connection, userId: number): Promise<any[]> {
    return (await conn.query(
        `SELECT DISTINCT p.* FROM ${permissions} p INNER JOIN ${rolePermissions} rp ON rp."permissionId" = p."permissionId" INNER JOIN ${userRoles} ur ON ur."roleId" = rp."roleId" INNER JOIN ${roles} r ON r."roleId" = ur."roleId" WHERE ur."userId" = ? AND ur."assignmentStatus" = 'ACTIVE' AND r."status" = 'ACTIVE'`,
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
