/**
 * RolePermissionMap Entity
 * Maps permissions to roles
 */
export interface RolePermissionMap {
    rolePermissionId: number;
    roleId: number;
    permissionId: number;
}

/**
 * RolePermissionMap creation request
 */
export interface AssignPermissionRequest {
    roleId: number;
    permissionId: number;
}

/**
 * Multiple permissions assignment request
 */
export interface AssignMultiplePermissionsRequest {
    roleId: number;
    permissionIds: number[];
}

/**
 * RolePermissionMap response
 */
export interface RolePermissionResponse {
    rolePermissionId: number;
    roleId: number;
    permissionId: number;
}
