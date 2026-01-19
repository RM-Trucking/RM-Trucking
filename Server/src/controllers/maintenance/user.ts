import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as userService from '../../services/maintenance/user';
import { CreateUserRequest, UpdateUserRequest, LoginRequest } from '../../entities/maintenance';

/**
 * User Controller
 */

/**
 * POST /api/auth/login
 * User login endpoint
 */
export async function login(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { loginUserName, password } = req.body as LoginRequest;

        console.log(loginUserName, password);


        if (!loginUserName || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }

        const { accessToken, refreshToken, user } = await userService.loginUser(conn, { loginUserName, password });

        res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user
            }
        });
    } catch (error) {
        res.status(401).json({
            error: 'Authentication failed',
            message: (error as Error).message
        });
    }
}

/**
 * POST /api/users
 * Create a new user (admin only)
 * Auto-generates and returns password
 */
export async function createUser(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const createReq: CreateUserRequest = req.body;
        const adminId = (req as any).user?.userId || 1;

        console.log(createReq);


        if (!createReq.userName || !createReq.loginUserName || !createReq.email || !createReq.roleId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const { user } = await userService.createNewUser(conn, createReq, adminId);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user
            }
        });
    } catch (error) {
        console.log(error);

        res.status(400).json({
            error: 'Failed to create user',
            message: (error as Error).message
        });
    }
}

/**
 * GET /api/users/:userId
 * Get user details
 */
export async function getUser(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { userId } = req.params;
        const user = await userService.getUserDetails(conn, parseInt(userId, 10));

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(404).json({
            error: 'User not found',
            message: (error as Error).message
        });
    }
}

/**
 * PUT /api/users/:userId
 * Update user
 */
export async function updateUser(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { userId } = req.params;
        const updateReq: UpdateUserRequest = req.body;

        const user = await userService.updateUserDetails(conn, parseInt(userId, 10), updateReq);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update user',
            message: (error as Error).message
        });
    }
}

/**
 * POST /api/users/:userId/change-password
 * Change user password
 */
export async function changePassword(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { userId } = req.params;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            res.status(400).json({ error: 'Old password and new password are required' });
            return;
        }

        await userService.changeUserPassword(conn, parseInt(userId, 10), oldPassword, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to change password',
            message: (error as Error).message
        });
    }
}

/**
 * POST /api/users/:userId/reset-password
 * Reset user password (admin only)
 */
export async function resetPassword(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { userId } = req.params;
        const newPassword = await userService.resetUserPassword(conn, parseInt(userId, 10));

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            data: {
                newPassword,
                note: 'Please share this password with the user securely'
            }
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to reset password',
            message: (error as Error).message
        });
    }
}

/**
 * DELETE /api/users/:userId
 * Delete user
 */
export async function deleteUser(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { userId } = req.params;
        await userService.deleteUserAccount(conn, parseInt(userId, 10));

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete user',
            message: (error as Error).message
        });
    }
}

/**
 * GET /api/users
 * Get all users (with pagination)
 */
export async function getAllUsers(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
        const search = req.query.search ? (req.query.search as string) : undefined;

        const { users, total } = await userService.listAllUsers(conn, limit, offset, search);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    limit: limit ?? null,
                    offset: offset ?? null,
                    total,
                    hasMore: offset !== undefined && limit !== undefined ? offset + limit < total : false
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch users',
            message: (error as Error).message
        });
    }
}


/**
 * GET /api/users/role/:roleId
 * Get users by role
 */
export async function getUsersByRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { roleId } = req.params;
        const users = await userService.listUsersByRole(conn, parseInt(roleId, 10));

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch users',
            message: (error as Error).message
        });
    }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function refreshToken(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { refreshToken } = req.body;
        const userId = (req as any).user?.userId;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        if (!userId) {
            res.status(401).json({ error: 'User ID not found in token' });
            return;
        }

        const { accessToken, refreshToken: newRefreshToken } = await userService.refreshAccessToken(conn, userId, refreshToken);

        res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        res.status(401).json({
            error: 'Failed to refresh token',
            message: (error as Error).message
        });
    }
}

/**
 * POST /api/auth/logout
 * Logout - revoke all refresh tokens (clear everything)
 */
export async function logout(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'User ID not found in token' });
            return;
        }

        // Revoke all refresh tokens for this user
        await userService.logoutFromAllDevices(conn, userId);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to logout',
            message: (error as Error).message
        });
    }
}
