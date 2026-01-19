/**
 * Permission Entity
 * Represents a permission in the system
 */
export interface Permission {
    permissionId: number;
    moduleName: string;
    permissionName: string;
    uiFieldName?: string; // Boolean flag name in UI (e.g., canViewUser, canCreateCustomer)
}

/**
 * Permission creation request
 */
export interface CreatePermissionRequest {
    moduleName: string;
    permissionName: string;
}

/**
 * Permission update request
 */
export interface UpdatePermissionRequest {
    moduleName?: string;
    permissionName?: string;
}

/**
 * Permission response
 */
export interface PermissionResponse {
    permissionId: number;
    moduleName: string;
    permissionName: string;
}

/**
 * Predefined static permissions
 */
// export const STATIC_PERMISSIONS: Permission[] = [
//     // User Management
//     { permissionId: 1, moduleName: 'User', permissionName: 'view' },
//     { permissionId: 2, moduleName: 'User', permissionName: 'create' },
//     { permissionId: 3, moduleName: 'User', permissionName: 'edit' },
//     { permissionId: 4, moduleName: 'User', permissionName: 'delete' },

//     // Role Management
//     { permissionId: 5, moduleName: 'Role', permissionName: 'view' },
//     { permissionId: 6, moduleName: 'Role', permissionName: 'create' },
//     { permissionId: 7, moduleName: 'Role', permissionName: 'edit' },
//     { permissionId: 8, moduleName: 'Role', permissionName: 'delete' },

//     // Permission Management
//     { permissionId: 9, moduleName: 'Permission', permissionName: 'view' },
//     { permissionId: 10, moduleName: 'Permission', permissionName: 'manage' },

//     // Customer Management
//     { permissionId: 11, moduleName: 'Customer', permissionName: 'view' },
//     { permissionId: 12, moduleName: 'Customer', permissionName: 'create' },
//     { permissionId: 13, moduleName: 'Customer', permissionName: 'edit' },
//     { permissionId: 14, moduleName: 'Customer', permissionName: 'delete' },
//     { permissionId: 15, moduleName: 'Customer', permissionName: 'assign' },

//     // Carrier Management
//     { permissionId: 16, moduleName: 'Carrier', permissionName: 'view' },
//     { permissionId: 17, moduleName: 'Carrier', permissionName: 'create' },
//     { permissionId: 18, moduleName: 'Carrier', permissionName: 'edit' },
//     { permissionId: 19, moduleName: 'Carrier', permissionName: 'delete' },
//     { permissionId: 20, moduleName: 'Carrier', permissionName: 'assign' },

//     // Station Management
//     { permissionId: 21, moduleName: 'Station', permissionName: 'view' },
//     { permissionId: 22, moduleName: 'Station', permissionName: 'create' },
//     { permissionId: 23, moduleName: 'Station', permissionName: 'edit' },
//     { permissionId: 24, moduleName: 'Station', permissionName: 'delete' },

//     // Rate Management
//     { permissionId: 25, moduleName: 'Rate', permissionName: 'view' },
//     { permissionId: 26, moduleName: 'Rate', permissionName: 'create' },
//     { permissionId: 27, moduleName: 'Rate', permissionName: 'edit' },
//     { permissionId: 28, moduleName: 'Rate', permissionName: 'delete' },

//     // Shipment Management
//     { permissionId: 29, moduleName: 'Shipment', permissionName: 'view' },
//     { permissionId: 30, moduleName: 'Shipment', permissionName: 'create' },
//     { permissionId: 31, moduleName: 'Shipment', permissionName: 'edit' },
//     { permissionId: 32, moduleName: 'Shipment', permissionName: 'delete' },
// ];
