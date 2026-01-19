import { Connection } from 'odbc';
import jwt from 'jsonwebtoken';
import { User, LoginRequest, CreateUserRequest, UpdateUserRequest, UserResponse } from '../../entities/maintenance';
import * as userDB from '../../database/maintenance/user';
import { createPasswordHash, verifyStoredPassword, generatePassword } from '../../utils/password';

const JWT_SECRET: string = process.env.TOKEN_SECRET || 'your-secret-key';
const REFRESH_SECRET: string = process.env.REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '1d';
const REFRESH_EXPIRY: string = process.env.REFRESH_EXPIRY || '7d';

/**
 * User service
 */

/**
 * Register/Create a new user
 * Generates a random password and hashes it
 */
export async function createNewUser(
    conn: Connection,
    createUserReq: CreateUserRequest,
    adminId: number
): Promise<{ user: UserResponse }> {
    // Check if login username already exists
    const existingUser = await userDB.getUserByLoginUsername(conn, createUserReq.loginUserName);
    if (existingUser) {
        throw new Error('Login username already exists');
    }

    // Generate password and hash
    const passwordHash = createPasswordHash(createUserReq.loginPassword);

    console.log(passwordHash);


    // Create user
    const userId = await userDB.createUser(
        conn,
        createUserReq.userName,
        createUserReq.loginUserName,
        createUserReq.email,
        passwordHash,
        createUserReq.roleId || 1,
        createUserReq.userType,
        adminId,
        createUserReq.customerId || null
    );

    const user = await userDB.getUserById(conn, userId);
    if (!user) {
        throw new Error('Failed to create user');
    }

    return {
        user: user
    };
}

/**
 * User login
 */
export async function loginUser(conn: Connection, loginReq: LoginRequest): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    const user = await userDB.getUserByLoginUsername(conn, loginReq.loginUserName);

    console.log(user);


    if (!user) {
        throw new Error('Invalid username or password');
    }

    if (user.activeStatus !== 'Y') {
        throw new Error(`User account is inactive`);
    }

    // Verify password
    if (!verifyStoredPassword(loginReq.password, user.passwordHash)) {
        throw new Error('Invalid username or password');
    }

    // Generate access token
    const tokenPayload: any = {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        roleId: user.roleId
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as any);

    // Generate refresh token (as JWT)
    const refreshTokenPayload = {
        userId: user.userId,
        type: 'refresh'
    };
    const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as any);

    // Store refresh token in database
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days
    // await userDB.storeRefreshToken(conn, user.userId, refreshToken, refreshExpiresAt);

    return {
        accessToken,
        refreshToken,
        user: user
    };
}

/**
 * Get user by ID
 */
export async function getUserDetails(conn: Connection, userId: number): Promise<UserResponse> {
    const user = await userDB.getUserById(conn, userId);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

/**
 * Update user
 */
export async function updateUserDetails(
    conn: Connection,
    userId: number,
    updateReq: UpdateUserRequest
): Promise<UserResponse> {
    const user = await userDB.getUserById(conn, userId);
    if (!user) {
        throw new Error('User not found');
    }

    await userDB.updateUser(conn, userId, {
        userName: updateReq.userName,
        loginUserName: updateReq.loginUserName,
        email: updateReq.email,
        roleId: updateReq.roleId,
        userType: updateReq.userType,
        customerId: updateReq.customerId
    });

    const updatedUser = await userDB.getUserById(conn, userId);
    if (!updatedUser) {
        throw new Error('Failed to update user');
    }

    return updatedUser;
}

/**
 * Change user password
 */
export async function changeUserPassword(
    conn: Connection,
    userId: number,
    oldPassword: string,
    newPassword: string
): Promise<boolean> {
    const user = await userDB.getUserById(conn, userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Verify old password
    if (!verifyStoredPassword(oldPassword, user.passwordHash)) {
        throw new Error('Old password is incorrect');
    }

    // Hash new password
    const newPasswordHash = createPasswordHash(newPassword);

    // Update password
    return await userDB.updateUserPassword(conn, userId, newPasswordHash);
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPassword(conn: Connection, userId: number): Promise<string> {
    const user = await userDB.getUserById(conn, userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Generate new password
    const newPassword = generatePassword(12);
    const passwordHash = createPasswordHash(newPassword);

    // Update password
    await userDB.updateUserPassword(conn, userId, passwordHash);

    return newPassword;
}

/**
 * Delete user
 */
export async function deleteUserAccount(conn: Connection, userId: number): Promise<boolean> {
    const user = await userDB.getUserById(conn, userId);
    if (!user) {
        throw new Error('User not found');
    }

    return await userDB.deleteUser(conn, userId);
}

/**
 * Get all users
 */
export async function listAllUsers(
    conn: Connection,
    limit?: number,
    offset?: number,
    search?: string
): Promise<{ users: UserResponse[]; total: number }> {
    const { users, total } = await userDB.getAllUsers(conn, limit, offset, search);
    return { users, total };
}


/**
 * Get users by role
 */
export async function listUsersByRole(conn: Connection, roleId: number): Promise<UserResponse[]> {
    const users = await userDB.getUsersByRole(conn, roleId);
    return users;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(conn: Connection, userId: number, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await userDB.getUserById(conn, userId);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.activeStatus !== 'Y') {
        throw new Error('User account is inactive');
    }

    // Verify refresh token exists and is valid in database
    const storedToken = await userDB.getRefreshToken(conn, userId, refreshToken);
    if (!storedToken) {
        throw new Error('Invalid or expired refresh token');
    }

    // Verify refresh token JWT signature
    try {
        jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token
    const tokenPayload: any = {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        roleId: user.roleId
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as any);

    // Revoke old refresh token and issue new one (token rotation for security)
    await userDB.revokeRefreshToken(conn, userId, refreshToken);

    // Generate new refresh token (as JWT)
    const newRefreshTokenPayload = {
        userId: user.userId,
        type: 'refresh'
    };
    const newRefreshToken = jwt.sign(newRefreshTokenPayload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as any);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days
    await userDB.storeRefreshToken(conn, userId, newRefreshToken, refreshExpiresAt);

    return {
        accessToken,
        refreshToken: newRefreshToken
    };
}

/**
 * Logout - revoke refresh token
 */
export async function logoutUser(conn: Connection, userId: number, refreshToken: string): Promise<boolean> {
    return await userDB.revokeRefreshToken(conn, userId, refreshToken);
}

/**
 * Logout from all devices - revoke all refresh tokens
 */
export async function logoutFromAllDevices(conn: Connection, userId: number): Promise<boolean> {
    return await userDB.revokeAllRefreshTokens(conn, userId);
}
