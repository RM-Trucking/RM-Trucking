import { Connection } from 'odbc';
import { Permission, AssignPermissionRequest, AssignMultiplePermissionsRequest } from '../../entities/maintenance';
import * as permissionDB from '../../database/maintenance/permission';
import * as rolePermissionDB from '../../database/maintenance/role_permission';

/**
 * Permission service
 */

/**
 * Get all permissions
 */
export async function getPermissions(conn: Connection): Promise<Permission[]> {
    return await permissionDB.getPermissions(conn);
}

/**
 * Get permission by ID
 */
export async function getPermissionDetails(conn: Connection, permissionId: number): Promise<Permission> {
    const permission = await permissionDB.getPermissionById(conn, permissionId);
    if (!permission) {
        throw new Error('Permission not found');
    }
    return permission;
}

/**
 * Get permissions by module
 */
export async function listPermissionsByModule(conn: Connection, moduleName: string): Promise<Permission[]> {
    return await permissionDB.getPermissionsByModule(conn, moduleName);
}

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(
    conn: Connection,
    assignReq: AssignPermissionRequest
): Promise<{ roleId: number; permissionId: number }> {
    // Verify permission exists
    const permission = await permissionDB.getPermissionById(conn, assignReq.permissionId);
    if (!permission) {
        throw new Error('Permission not found');
    }

    // Check if already assigned
    const hasPermission = await rolePermissionDB.roleHasPermission(
        conn,
        assignReq.roleId,
        assignReq.permissionId
    );

    if (hasPermission) {
        throw new Error('Permission already assigned to this role');
    }

    // Assign permission
    await rolePermissionDB.assignPermissionToRole(conn, assignReq.roleId, assignReq.permissionId);

    return {
        roleId: assignReq.roleId,
        permissionId: assignReq.permissionId
    };
}

/**
 * Assign multiple permissions to role
 */
export async function assignMultiplePermissionsToRole(
    conn: Connection,
    assignReq: AssignMultiplePermissionsRequest
): Promise<{ roleId: number; assignedCount: number; failedCount: number }> {
    let assignedCount = 0;
    let failedCount = 0;

    for (const permissionId of assignReq.permissionIds) {
        try {
            const permission = await permissionDB.getPermissionById(conn, permissionId);
            if (!permission) {
                failedCount++;
                continue;
            }

            const hasPermission = await rolePermissionDB.roleHasPermission(conn, assignReq.roleId, permissionId);
            if (!hasPermission) {
                await rolePermissionDB.assignPermissionToRole(conn, assignReq.roleId, permissionId);
                assignedCount++;
            }
        } catch {
            failedCount++;
        }
    }

    return {
        roleId: assignReq.roleId,
        assignedCount,
        failedCount
    };
}

/**
 * Remove permission from role
 */
export async function removePermissionFromRole(
    conn: Connection,
    roleId: number,
    permissionId: number
): Promise<boolean> {
    const hasPermission = await rolePermissionDB.roleHasPermission(conn, roleId, permissionId);
    if (!hasPermission) {
        throw new Error('Permission not assigned to this role');
    }

    return await rolePermissionDB.removePermissionFromRole(conn, roleId, permissionId);
}

/**
 * Get permissions for a role
 */
export async function getRolePermissions(conn: Connection, roleId: number): Promise<Permission[]> {
    const rolePermissions = await rolePermissionDB.getPermissionsByRole(conn, roleId);

    const permissions = await Promise.all(
        rolePermissions.map(rp => permissionDB.getPermissionById(conn, rp.permissionId))
    );

    return permissions.filter(Boolean) as Permission[];
}

/**
 * Check if role has permission
 */
export async function checkRolePermission(
    conn: Connection,
    roleId: number,
    permissionId: number
): Promise<boolean> {
    return await rolePermissionDB.roleHasPermission(conn, roleId, permissionId);
}

/**
 * Seed static permissions
 */
// export async function initializePermissions(conn: Connection): Promise<void> {
//     try {
//         await permissionDB.seedPermissions(conn);
//     } catch (error) {
//         console.warn('Permissions already initialized or error occurred', error);
//     }
// }
