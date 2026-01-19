import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as roleService from '../../services/maintenance/role';
import { CreateRoleRequest, UpdateRoleRequest } from '../../entities/maintenance';

/**
 * POST /api/maintenance/roles
 * Create a new role with permissions
 * Accepts full permission object directly:
 * {
 *   "roleName": "Admin",
 *   "permissions": {
 *     "MAINTENANCE": {
 *       "canViewUser": true,
 *       "canCreateUser": true,
 *       "canEditUser": false
 *     },
 *     "CFSAIREXPORT": {
 *       "canViewWarehouseReceipt": true
 *     }
 *   }
 * }
 */
export async function createRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const createReq: CreateRoleRequest = req.body;
        const adminId = (req as any).user?.userId || 1;

        if (!createReq.roleName) {
            res.status(400).json({ error: 'Role name is required' });
            return;
        }

        const role = await roleService.createNewRole(
            conn,
            { ...createReq, createdBy: adminId },
            createReq.permissions
        );

        res.status(201).json({
            success: true,
            message: 'Role created successfully with permissions',
            data: role
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to create role',
            message: (error as Error).message
        });
    }
}

/**
 * GET /api/maintenance/roles/:roleId
 * Get role details
 */
export async function getRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { roleId } = req.params;
        const role = await roleService.getRoleDetails(conn, parseInt(roleId, 10));

        res.status(200).json({
            success: true,
            data: role
        });
    } catch (error) {
        res.status(404).json({
            error: 'Role not found',
            message: (error as Error).message
        });
    }
}

/**
 * PUT /api/maintenance/roles/:roleId
 * Update role and permissions
 */
export async function updateRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { roleId } = req.params;
        const updateReq: UpdateRoleRequest & { permissions?: Record<string, Record<string, boolean>> } = req.body;

        const role = await roleService.updateRoleDetails(
            conn,
            parseInt(roleId, 10),
            updateReq,
            updateReq.permissions
        );

        res.status(200).json({
            success: true,
            message: 'Role updated successfully',
            data: role
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update role',
            message: (error as Error).message
        });
    }
}

/**
 * DELETE /api/maintenance/roles/:roleId
 * Delete role
 */
export async function deleteRole(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { roleId } = req.params;
        await roleService.deleteRoleAccount(conn, parseInt(roleId, 10));

        res.status(200).json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete role',
            message: (error as Error).message
        });
    }
}

/**
 * GET /api/maintenance/roles
 * Get all roles with pagination
 */
export async function getAllRoles(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const offset = parseInt(req.query.offset as string, 10) || 0;

        const { roles, total } = await roleService.listAllRoles(conn, limit, offset);

        res.status(200).json({
            success: true,
            data: {
                roles,
                pagination: {
                    limit,
                    offset,
                    total,
                    hasMore: offset + limit < total
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch roles',
            message: (error as Error).message
        });
    }
}
