import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as authorizationService from '../../services/authorization/authorizationService';

function parsePositiveInteger(value: unknown, defaultValue: number): number | undefined {
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function createRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const role = await authorizationService.createRole(conn, req.body, Number((req as any).user?.userId) || null);
        res.status(201).json({ success: true, data: role });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function updateRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const role = await authorizationService.updateRole(conn, Number(req.params.roleId), req.body, Number((req as any).user?.userId) || null);
        res.status(200).json({ success: true, data: role });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function listRoles(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const roleKind = typeof req.query.roleKind === 'string' ? req.query.roleKind.toUpperCase() : undefined;
        if (roleKind !== undefined && roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
            res.status(400).json({ success: false, message: 'roleKind must be EMPLOYEE or CUSTOMER' });
            return;
        }
        if (req.query.roleName !== undefined && typeof req.query.roleName !== 'string') {
            res.status(400).json({ success: false, message: 'roleName must be a string' });
            return;
        }
        const roleName = typeof req.query.roleName === 'string' ? req.query.roleName.trim() : undefined;
        const page = parsePositiveInteger(req.query.page, 1);
        const pageSize = parsePositiveInteger(req.query.pageSize, 20);
        if (page === undefined || pageSize === undefined || pageSize > 100) {
            res.status(400).json({ success: false, message: 'page must be positive and pageSize must be between 1 and 100' });
            return;
        }
        const result = await authorizationService.listRoles(
            conn,
            roleKind as 'EMPLOYEE' | 'CUSTOMER' | undefined,
            roleName,
            page,
            pageSize,
        );
        res.status(200).json({
            success: true,
            data: result.roles,
            pagination: result.pagination,
            roleCounts: result.roleCounts,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

export async function getRoleOptions(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const roleKind = typeof req.query.roleKind === 'string' ? req.query.roleKind.toUpperCase() : undefined;
        if (roleKind !== undefined && roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
            res.status(400).json({ success: false, message: 'roleKind must be EMPLOYEE or CUSTOMER' });
            return;
        }
        const options = await authorizationService.getRoleOptions(conn, roleKind as 'EMPLOYEE' | 'CUSTOMER' | undefined);
        res.status(200).json({ success: true, data: options });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

export async function getRoleDetails(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        res.status(200).json({ success: true, data: await authorizationService.getRoleDetails(conn, Number(req.params.roleId)) });
    } catch (error) {
        res.status(404).json({ success: false, message: (error as Error).message });
    }
}

export async function deactivateRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await authorizationService.deactivateRole(conn, Number(req.params.roleId), Number((req as any).user?.userId) || null);
        res.status(200).json({ success: true, message: 'Role deactivated' });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function getPermissionCatalog(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const roleKind = typeof req.query.roleKind === 'string' ? req.query.roleKind.toUpperCase() : undefined;
        if (roleKind !== undefined && roleKind !== 'EMPLOYEE' && roleKind !== 'CUSTOMER') {
            res.status(400).json({ success: false, message: 'roleKind must be EMPLOYEE or CUSTOMER' });
            return;
        }
        res.status(200).json({
            success: true,
            data: await authorizationService.getPermissionCatalog(conn, roleKind as 'EMPLOYEE' | 'CUSTOMER' | undefined),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

export async function createUser(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const user = await authorizationService.createUser(conn, req.body, Number((req as any).user?.userId) || null);
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function updateUser(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const user = await authorizationService.updateUser(conn, Number(req.params.userId), req.body, Number((req as any).user?.userId) || null);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function assignRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await authorizationService.assignUserRole(conn, Number(req.body.userId), Number(req.body.roleId), Number((req as any).user?.userId) || null);
        res.status(200).json({ success: true, message: 'Role assigned' });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function removeRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await authorizationService.removeUserRole(conn, Number(req.params.userId), Number(req.params.roleId));
        res.status(200).json({ success: true, message: 'Role removed from user' });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function listUsers(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { userType, page, pageSize, search, activeStatus } = req.query;
        if ([userType, page, pageSize, search, activeStatus].every((value) => value === undefined)) {
            res.status(200).json({ success: true, data: await authorizationService.listUsers(conn) });
            return;
        }

        const pageNumber = parsePositiveInteger(page, 1);
        const size = parsePositiveInteger(pageSize, 20);
        if ((userType !== undefined && userType !== 'EMPLOYEE' && userType !== 'CUSTOMER')
            || (activeStatus !== undefined && activeStatus !== 'Y' && activeStatus !== 'N')
            || (search !== undefined && typeof search !== 'string')
            || pageNumber === undefined || size === undefined || size > 100
            || !Number.isSafeInteger((pageNumber - 1) * size)) {
            res.status(400).json({ success: false, message: 'Invalid user list filters or pagination.' });
            return;
        }
        const result = await authorizationService.listUsersPage(conn, {
            userType, page: pageNumber, pageSize: size, search: search?.trim(), activeStatus,
        });
        res.status(200).json({ success: true, data: result.users, pagination: result.pagination });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

export async function getUserRoleSummary(req: Request, res: Response, conn: Connection): Promise<void> {
    const user = (req as any).user ?? null;

    if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const roles = await authorizationService.getUserRoles(conn, Number(user.userId));
    res.status(200).json({
        userId: user.userId,
        userType: user.userType ?? 'EMPLOYEE',
        customerId: user.customerId ?? null,
        roles,
    });
}

export async function login(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await authorizationService.login(conn, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(401).json({ success: false, message: (error as Error).message });
    }
}

export async function refreshToken(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const tokenPair = await authorizationService.refreshToken(conn, req.body.refreshToken);
        res.status(200).json({ success: true, data: tokenPair });
    } catch (error) {
        res.status(401).json({ success: false, message: (error as Error).message });
    }
}

export async function forgotPassword(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await authorizationService.sendResetLink(conn, req.body.email);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function validateResetToken(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await authorizationService.validateResetOtp(conn, req.body.email, req.body.otp);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}

export async function resetPassword(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await authorizationService.resetPassword(conn, req.body.email, req.body.otp, req.body.newPassword);
        res.status(200).json({ success: true, data: { message: 'Password reset successful' } });
    } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
    }
}
