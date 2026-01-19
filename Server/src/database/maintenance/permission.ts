import { Connection } from 'odbc';
import { Permission } from '../../entities/maintenance';
import { SCHEMA } from '../../config/db2';



/**
 * Permission database queries
 * Note: Permissions are static and pre-populated in the database
 */

/**
 * Get all permissions
 */
export async function getPermissions(conn: Connection): Promise<Permission[]> {

    const query = `
        SELECT "permissionId", "moduleName", "permissionName"
        FROM ${SCHEMA}."Permissions"
        ORDER BY "permissionId" ASC
    `;

    const result = (await conn.query(query)) as Permission[];
    return result;

}

/**
 * Get permission by ID
 */
export async function getPermissionById(conn: Connection, permissionId: number): Promise<Permission | null> {
    const query = `
        SELECT permission_id AS permissionId, module_name AS moduleName, permission_name AS permissionName
        FROM RANDM_TST.PERMISSION
        WHERE permission_id = ?
    `;


    const result = (await conn.query(query, [permissionId])) as Permission[];
    return result.length > 0 ? result[0] : null;

}

/**
 * Get permissions by module
 */
export async function getPermissionsByModule(conn: Connection, moduleName: string): Promise<Permission[]> {
    const query = `
        SELECT permission_id AS permissionId, module_name AS moduleName, permission_name AS permissionName
        FROM RANDM_TST.PERMISSION
        WHERE module_name = ?
        ORDER BY permission_id ASC
    `;


    const result = (await conn.query(query, [moduleName])) as Permission[];
    return result;

}

/**
 * Seed static permissions into database (for initialization)
 */
// export async function seedPermissions(conn: Connection): Promise<void> {
//     const query = `
//     INSERT INTO RANDM_TST.PERMISSION (PERMISSIONID, MODULENAME, PERMISSIONNAME)
//     VALUES (?, ?, ?)
//   `;

//     for (const permission of STATIC_PERMISSIONS) {
//         try {
//             await conn.query(query, [
//                 permission.permissionId,
//                 permission.moduleName,
//                 permission.permissionName
//             ]);
//         } catch (error) {
//             // Permission might already exist, continue
//         }
//     }
// }

// mapping function removed; direct query results are returned
