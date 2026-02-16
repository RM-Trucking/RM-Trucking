import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';
import { User } from '../../entities/maintenance';

/**
 * User database queries
 */

/**
 * Create a new user
 */
export async function createUser(
    conn: Connection,
    userName: string,
    loginUserName: string,
    email: string,
    passwordHash: string,
    roleId: number,
    userType: 'EMPLOYEE' | 'CUSTOMER',
    createdBy: number | null = null,
    customerId: number | null = null
): Promise<number> {
    const query = `
        INSERT INTO ${SCHEMA}."User" ("userName", "loginUserName", "email", "passwordHash", "createdAt", "activeStatus", "roleId", "userType", "customerId")
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'Y', ?, ?, ?)
    `;

    const params: any[] = [
        userName,
        loginUserName.toUpperCase(),
        email,
        passwordHash,
        roleId,
        userType,
        customerId || null
    ];

    await conn.query(query, params);

    // Get the inserted user ID
    const resultQuery = `SELECT "userId" FROM ${SCHEMA}."User" WHERE "loginUserName" = ? ORDER BY "userId" DESC FETCH FIRST 1 ROWS ONLY`;
    const result = (await conn.query(resultQuery, [loginUserName])) as any[];
    return result[0]?.user_id || 0;
}

/**
 * Get user by ID
 */
export async function getUserById(conn: Connection, userId: number): Promise<User | null> {
    const query = `
        SELECT "userId", "userName", "loginUserName", "email", "passwordHash", "createdAt", "createdBy", "activeStatus", "roleId", "userType", "customerId"
        FROM User
        WHERE "userId" = ?
    `;

    const result = (await conn.query(query, [userId])) as User[];
    return result.length > 0 ? result[0] : null;
}

/**
 * Get user by login username
 */
export async function getUserByLoginUsername(conn: Connection, loginUserName: string): Promise<User | null> {
    const query = `
        SELECT "userId", "userName", "loginUserName", "email", "passwordHash", "createdAt", "createdBy", "activeStatus", "roleId", "userType", "customerId"
        FROM ${SCHEMA}."User"
        WHERE "loginUserName" = ?
    `;

    const result = (await conn.query(query, [loginUserName.toUpperCase()])) as User[];
    return result[0];
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(
    conn: Connection,
    limit?: number,
    offset?: number,
    search?: string
): Promise<{ users: User[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];

    if (search) {
        whereClause = ` WHERE UPPER("userName") LIKE UPPER(?) OR UPPER("loginUserName") LIKE UPPER(?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM ${SCHEMA}."User"${whereClause}`;
    const countResult = (await conn.query(countQuery, params)) as any[];
    const total = countResult[0]?.TOTAL || 0;

    // Data query
    let query = `
        SELECT "userId", "userName", "loginUserName", "email", "createdAt", "createdBy", 
               "activeStatus", "roleId", "userType", "customerId"
        FROM ${SCHEMA}."User"
        ${whereClause}
        ORDER BY "userId" DESC`;

    if (limit !== undefined && offset !== undefined) {
        query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }

    const result = (await conn.query(query, params)) as User[];
    return { users: result, total };
}


/**
 * Update user
 */
export async function updateUser(
    conn: Connection,
    userId: number,
    updates: {
        userName?: string;
        loginUserName?: string;
        email?: string;
        roleId?: number;
        activeStatus?: string;
        userType?: string;
        customerId?: number | null;
    }
): Promise<boolean> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.userName) {
        updateFields.push('USERNAME = ?');
        values.push(updates.userName);
    }
    if (updates.loginUserName) {
        updateFields.push('LOGINUSERNAME = ?');
        values.push(updates.loginUserName.toUpperCase());
    }
    if (updates.email) {
        updateFields.push('EMAIL = ?');
        values.push(updates.email);
    }
    if (updates.roleId) {
        updateFields.push('ROLEID = ?');
        values.push(updates.roleId);
    }
    if (updates.activeStatus) {
        updateFields.push('ACTIVESTATUS = ?');
        values.push(updates.activeStatus);
    }
    if (updates.userType) {
        updateFields.push('USERTYPE = ?');
        values.push(updates.userType);
    }
    if (updates.customerId !== undefined) {
        updateFields.push('CUSTOMERID = ?');
        values.push(updates.customerId || null);
    }

    if (updateFields.length === 0) {
        return false;
    }

    values.push(userId);
    const query = `UPDATE RANDM_TST.USER SET ${updateFields.join(', ')} WHERE USERID = ?`;

    await conn.query(query, values);
    return true;
}

/**
 * Update user password hash
 */
export async function updateUserPassword(
    conn: Connection,
    userId: number,
    passwordHash: string
): Promise<boolean> {
    const query = `UPDATE User SET password_hash = ? WHERE user_id = ?`;
    await conn.query(query, [passwordHash, userId]);
    return true;
}

/**
 * Delete user
 */
export async function deleteUser(conn: Connection, userId: number): Promise<boolean> {
    const query = `DELETE FROM User WHERE user_id = ?`;
    await conn.query(query, [userId]);
    return true;
}

/**
 * Change user active status
 */
export async function changeUserStatus(
    conn: Connection,
    userId: number,
    activeStatus: 'Y' | 'N'
): Promise<boolean> {
    const query = `UPDATE User SET active_status = ? WHERE user_id = ?`;
    await conn.query(query, [activeStatus, userId]);
    return true;
}

/**
 * Get users by role
 */
export async function getUsersByRole(conn: Connection, roleId: number): Promise<User[]> {
    const query = `
        SELECT user_id, user_name, login_user_name, email, password_hash, created_at, created_by, active_status, role_id, user_type, customer_id
        FROM User
        WHERE role_id = ?
        ORDER BY user_id DESC
    `;

    const result = (await conn.query(query, [roleId])) as User[];
    return result;
}

/**
 * Store refresh token in database
 */
export async function storeRefreshToken(
    conn: Connection,
    userId: number,
    refreshToken: string,
    expiresAt: Date | string
): Promise<boolean> {
    const query = `
        INSERT INTO RefreshToken (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;

    try {
        const expiresAtStr = typeof expiresAt === 'string' ? expiresAt : expiresAt.toISOString();
        await conn.query(query, [userId as any, refreshToken, expiresAtStr]);
        return true;
    } catch (error) {
        console.error('Error storing refresh token:', error);
        return false;
    }
}

/**
 * Get valid refresh token
 */
export async function getRefreshToken(conn: Connection, userId: number, token: string): Promise<any | null> {
    const query = `
        SELECT user_id, token, expires_at
        FROM RefreshToken
        WHERE user_id = ? AND token = ? AND expires_at > CURRENT_TIMESTAMP
    `;

    const result = (await conn.query(query, [userId, token])) as any[];
    return result.length > 0 ? result[0] : null;
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(conn: Connection, userId: number, token: string): Promise<boolean> {
    const query = `
        DELETE FROM RefreshToken
        WHERE user_id = ? AND token = ?
    `;

    try {
        await conn.query(query, [userId, token]);
        return true;
    } catch (error) {
        console.error('Error revoking refresh token:', error);
        return false;
    }
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export async function revokeAllRefreshTokens(conn: Connection, userId: number): Promise<boolean> {
    const query = `
        DELETE FROM RefreshToken
        WHERE user_id = ?
    `;

    try {
        await conn.query(query, [userId]);
        return true;
    } catch (error) {
        console.error('Error revoking all refresh tokens:', error);
        return false;
    }
}

export async function getUserName(conn: Connection, userId: number): Promise<string> {
    const query = `SELECT "userName" FROM ${SCHEMA}."User" WHERE "userId" = ?`;
    const result = await conn.query(query, [userId]) as any[];
    return result.length ? result[0].userName : `User-${userId}`;
}
