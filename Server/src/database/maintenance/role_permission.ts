import { Connection } from 'odbc';
// import { RolePermissionMap, RolePermissionQueryResult } from '../../types/maintenance';

/**
 * RolePermissionMap database queries
 */

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(
    conn: Connection,
    roleId: number,
    permissionId: number
): Promise<number> {
    const query = `
    INSERT INTO RANDM_TST.ROLE_PERMISSION_MAP (ROLEID, PERMISSIONID)
    VALUES (?, ?)
  `;

    await conn.query(query, [roleId, permissionId]);

    // Get the inserted ID
    const resultQuery = `SELECT ROLEPERMISSIONID FROM RANDM_TST.ROLE_PERMISSION_MAP WHERE ROLEID = ? AND PERMISSIONID = ? ORDER BY ROLEPERMISSIONID DESC FETCH FIRST 1 ROWS ONLY`;
    const result = (await conn.query(resultQuery, [roleId, permissionId])) as any[];

    return result[0]?.ROLEPERMISSIONID || 0;
}

/**
 * Get all permissions for a role
 */
export async function getPermissionsByRole(conn: Connection, roleId: number): Promise<any[]> {
    const query = `
        SELECT role_permission_id AS rolePermissionId, role_id AS roleId, permission_id AS permissionId
        FROM RANDM_TST.ROLE_PERMISSION_MAP
        WHERE role_id = ?
        ORDER BY role_permission_id ASC
    `;

    const result = (await conn.query(query, [roleId])) as any[];
    return result;
}

/**
 * Check if role has permission
 */
export async function roleHasPermission(
    conn: Connection,
    roleId: number,
    permissionId: number
): Promise<boolean> {
    const query = `
    SELECT COUNT(*) as CNT FROM RANDM_TST.ROLE_PERMISSION_MAP
    WHERE ROLEID = ? AND PERMISSIONID = ?
  `;

    const result = (await conn.query(query, [roleId, permissionId])) as any[];
    return (result[0]?.CNT || 0) > 0;
}

/**
 * Remove permission from role
 */
export async function removePermissionFromRole(
    conn: Connection,
    roleId: number,
    permissionId: number
): Promise<boolean> {
    const query = `
    DELETE FROM RANDM_TST.ROLE_PERMISSION_MAP
    WHERE ROLEID = ? AND PERMISSIONID = ?
  `;

    await conn.query(query, [roleId, permissionId]);
    return true;
}

/**
 * Remove all permissions from role
 */
export async function removeAllPermissionsFromRole(conn: Connection, roleId: number): Promise<boolean> {
    const query = `
    DELETE FROM RANDM_TST.ROLE_PERMISSION_MAP
    WHERE ROLEID = ?
  `;

    await conn.query(query, [roleId]);
    return true;
}

/**
 * Assign multiple permissions to role
 */
export async function assignMultiplePermissionsToRole(
    conn: Connection,
    roleId: number,
    permissionIds: number[]
): Promise<number[]> {
    const assignedIds: number[] = [];

    for (const permissionId of permissionIds) {
        const id = await assignPermissionToRole(conn, roleId, permissionId);
        assignedIds.push(id);
    }

    return assignedIds;
}

/**
 * Map database row to RolePermissionMap entity
 */
function mapRolePermissionRow(row: any): any {
    return {
        rolePermissionId: row.ROLEPERMISSIONID,
        roleId: row.ROLEID,
        permissionId: row.PERMISSIONID
    };
}
