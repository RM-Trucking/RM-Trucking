import { Connection } from 'odbc';
import { Role, CreateRoleRequest, UpdateRoleRequest, RoleResponse } from '../../entities/maintenance';
import * as roleDB from '../../database/maintenance/role';
import * as permissionDB from '../../database/maintenance/permission';
import * as rolePermissionDB from '../../database/maintenance/role_permission';

/**
 * Role service
 */

/**
 * Extract permission names from permission object
 * Converts: { "MAINTENANCE": { "canViewUser": true, "canCreateUser": false } }
 * To: ["canViewUser"]
 */
function extractPermissionNames(permissionsObj: any): string[] {
    const names: string[] = [];

    if (!permissionsObj || typeof permissionsObj !== 'object') {
        return names;
    }

    for (const [module, flags] of Object.entries(permissionsObj)) {
        if (!flags || typeof flags !== 'object') continue;

        for (const [flagName, flagValue] of Object.entries(flags)) {
            if (flagValue === true) {
                names.push(flagName);
            }
        }
    }

    return names;
}

/**
 * Create a new role
 */
export async function createNewRole(
    conn: Connection,
    createRoleReq: CreateRoleRequest,
    permissionsObj?: Record<string, Record<string, boolean>>
): Promise<RoleResponse> {
    // Check if role name already exists
    const existingRole = await roleDB.getRoleByName(conn, createRoleReq.roleName);
    if (existingRole) {
        throw new Error('Role name already exists');
    }

    const roleId = await roleDB.createRole(conn, createRoleReq.roleName, createRoleReq.createdBy || 1);

    // Assign permissions if provided
    if (permissionsObj) {
        const permissionNames = extractPermissionNames(permissionsObj);

        if (permissionNames.length > 0) {
            // Get all available permissions
            const allPermissions = await permissionDB.getPermissions(conn);

            // Filter permissions based on names
            const permissionsToAssign = allPermissions.filter(p =>
                permissionNames.includes(p.permissionName)
            );

            // Assign each permission to the role
            for (const permission of permissionsToAssign) {
                await rolePermissionDB.assignPermissionToRole(conn, roleId, permission.permissionId);
            }
        }
    }

    const role = await roleDB.getRoleById(conn, roleId);
    if (!role) {
        throw new Error('Failed to create role');
    }

    return roleToResponse(role);
}

/**
 * Get role by ID
 */
export async function getRoleDetails(conn: Connection, roleId: number): Promise<RoleResponse> {
    const role = await roleDB.getRoleById(conn, roleId);
    if (!role) {
        throw new Error('Role not found');
    }

    // Get permissions for this role
    const rolePermissions = await rolePermissionDB.getPermissionsByRole(conn, roleId);
    const permissions = await Promise.all(
        rolePermissions.map(rp => permissionDB.getPermissionById(conn, rp.permissionId))
    );

    const response = roleToResponse(role);
    response.permissions = permissions.filter(Boolean) as any;

    return response;
}

/**
 * Update role and permissions
 */
export async function updateRoleDetails(
    conn: Connection,
    roleId: number,
    updateReq: UpdateRoleRequest,
    permissionsObj?: Record<string, Record<string, boolean>>
): Promise<RoleResponse> {
    const role = await roleDB.getRoleById(conn, roleId);
    if (!role) {
        throw new Error('Role not found');
    }

    if (updateReq.roleName) {
        // Check if new name already exists
        const existingRole = await roleDB.getRoleByName(conn, updateReq.roleName);
        if (existingRole && existingRole.roleId !== roleId) {
            throw new Error('Role name already exists');
        }

        await roleDB.updateRole(conn, roleId, updateReq.roleName);
    }

    // Update permissions if provided
    if (permissionsObj) {
        // Remove all current permissions
        await rolePermissionDB.removeAllPermissionsFromRole(conn, roleId);

        const permissionNames = extractPermissionNames(permissionsObj);

        if (permissionNames.length > 0) {
            // Get all available permissions
            const allPermissions = await permissionDB.getPermissions(conn);

            // Filter permissions based on names
            const permissionsToAssign = allPermissions.filter(p =>
                permissionNames.includes(p.permissionName)
            );

            // Assign each permission to the role
            for (const permission of permissionsToAssign) {
                await rolePermissionDB.assignPermissionToRole(conn, roleId, permission.permissionId);
            }
        }
    }

    const updatedRole = await roleDB.getRoleById(conn, roleId);
    if (!updatedRole) {
        throw new Error('Failed to update role');
    }

    return roleToResponse(updatedRole);
}

/**
 * Delete role
 */
export async function deleteRoleAccount(conn: Connection, roleId: number): Promise<boolean> {
    const role = await roleDB.getRoleById(conn, roleId);
    if (!role) {
        throw new Error('Role not found');
    }

    // Remove all permissions for this role
    await rolePermissionDB.removeAllPermissionsFromRole(conn, roleId);

    // Delete the role
    return await roleDB.deleteRole(conn, roleId);
}

/**
 * Get all roles
 */
export async function listAllRoles(
    conn: Connection,
    limit: number = 10,
    offset: number = 0
): Promise<{ roles: RoleResponse[]; total: number }> {
    const { roles, total } = await roleDB.getAllRoles(conn, limit, offset);
    return {
        roles: roles.map(roleToResponse),
        total
    };
}

/**
 * Convert Role entity to RoleResponse
 */
function roleToResponse(role: Role): RoleResponse {
    return {
        roleId: role.roleId,
        roleName: role.roleName,
        createdAt: role.createdAt,
        createdBy: role.createdBy
    };
}
