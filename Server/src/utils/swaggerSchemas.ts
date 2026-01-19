import { Connection } from 'odbc';
import * as permissionDB from '../database/maintenance/permission';

/**
 * Generate Swagger schema for permissions dynamically from database
 */
export async function generatePermissionsSchema(conn: Connection): Promise<any> {
    try {
        const permissions = await permissionDB.getPermissions(conn);

        // Group permissions by module
        const modulePermissions: Record<string, any> = {};

        for (const perm of permissions) {
            if (!modulePermissions[perm.moduleName]) {
                modulePermissions[perm.moduleName] = {
                    type: 'object',
                    properties: {},
                    description: `${perm.moduleName} module permissions`
                };
            }

            // Use uiFieldName if available, otherwise use permissionName in camelCase
            const fieldName = perm.uiFieldName || camelCase(perm.permissionName);

            modulePermissions[perm.moduleName].properties[fieldName] = {
                type: 'boolean',
                description: perm.permissionName
            };
        }

        // Build the permissions object schema
        const permissionsSchema: any = {
            type: 'object',
            description: 'Permissions organized by module with boolean flags',
            additionalProperties: false,
            properties: modulePermissions
        };

        return permissionsSchema;
    } catch (error) {
        console.error('Error generating permissions schema:', error);
        // Return a generic schema if database fails
        return {
            type: 'object',
            description: 'Permissions organized by module with boolean flags',
            additionalProperties: true
        };
    }
}

/**
 * Convert snake_case to camelCase
 */
function camelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Generate example permissions payload from database
 */
export async function generatePermissionsExample(conn: Connection): Promise<any> {
    try {
        const permissions = await permissionDB.getPermissions(conn);

        const example: Record<string, Record<string, boolean>> = {};

        for (const perm of permissions) {
            if (!example[perm.moduleName]) {
                example[perm.moduleName] = {};
            }

            // Use uiFieldName if available
            const fieldName = perm.uiFieldName || camelCase(perm.permissionName);
            example[perm.moduleName][fieldName] = Math.random() > 0.5; // Random true/false for example
        }

        return example;
    } catch (error) {
        console.error('Error generating permissions example:', error);
        return {};
    }
}
