/**
 * Role Entity
 * Represents a role in the system
 */
export interface Role {
    roleId: number;
    roleName: string;
    createdAt: Date;
    createdBy: number;
}

/**
 * Role creation request
 */
export interface CreateRoleRequest {
    roleName: string;
    createdBy?: number;
    permissions?: Record<string, Record<string, boolean>>;  // Boolean flags organized by module
}

/**
 * Role update request
 */
export interface UpdateRoleRequest {
    roleName?: string;
}

/**
 * Role response
 */
export interface RoleResponse {
    roleId: number;
    roleName: string;
    createdAt: Date;
    createdBy: number;
    permissions?: Array<{ permissionId: number; moduleName: string; permissionName: string }>;
}