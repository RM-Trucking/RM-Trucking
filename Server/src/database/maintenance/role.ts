import { Connection } from 'odbc';
import { Role } from '../../entities/maintenance';

/**
 * Role database queries
 */

/**
 * Create a new role
 */
export async function createRole(
    conn: Connection,
    roleName: string,
    createdBy: number
): Promise<number> {
    const query = `
    INSERT INTO RANDM_TST.ROLE (ROLENAME, CREATEDAT, CREATEDBY)
    VALUES (?, CURRENT_TIMESTAMP, ?)
  `;

    await conn.query(query, [roleName, createdBy]);

    // Get the inserted role ID
    const resultQuery = `SELECT ROLEID FROM RANDM_TST.ROLE WHERE ROLENAME = ? ORDER BY ROLEID DESC FETCH FIRST 1 ROWS ONLY`;
    const result = (await conn.query(resultQuery, [roleName])) as any[];

    return result[0]?.ROLEID || 0;
}

/**
 * Get role by ID
 */
export async function getRoleById(conn: Connection, roleId: number): Promise<Role | null> {
    const query = `
        SELECT role_id AS roleId, role_name AS roleName, created_at AS createdAt, created_by AS createdBy
        FROM RANDM_TST.ROLE
        WHERE role_id = ?
    `;

    const result = (await conn.query(query, [roleId])) as Role[];
    return result.length > 0 ? result[0] : null;
}

/**
 * Get role by name
 */
export async function getRoleByName(conn: Connection, roleName: string): Promise<Role | null> {
    const query = `
        SELECT role_id AS roleId, role_name AS roleName, created_at AS createdAt, created_by AS createdBy
        FROM RANDM_TST.ROLE
        WHERE role_name = ?
    `;

    const result = (await conn.query(query, [roleName])) as Role[];
    return result.length > 0 ? result[0] : null;
}

/**
 * Get all roles with pagination
 */
export async function getAllRoles(
    conn: Connection,
    limit: number = 10,
    offset: number = 0
): Promise<{ roles: Role[]; total: number }> {
    // Get total count
    const countQuery = `SELECT COUNT(*) as TOTAL FROM RANDM_TST.ROLE`;
    const countResult = (await conn.query(countQuery)) as any[];
    const total = countResult[0]?.TOTAL || 0;

    // Get paginated results
    const query = `
        SELECT role_id AS roleId, role_name AS roleName, created_at AS createdAt, created_by AS createdBy
        FROM RANDM_TST.ROLE
        ORDER BY role_id DESC
        FETCH FIRST ${limit} ROWS ONLY OFFSET ${offset}
    `;

    const roles = (await conn.query(query)) as Role[];
    return { roles, total };
}

/**
 * Update role
 */
export async function updateRole(
    conn: Connection,
    roleId: number,
    roleName: string
): Promise<boolean> {
    const query = `UPDATE RANDM_TST.ROLE SET ROLENAME = ? WHERE ROLEID = ?`;
    await conn.query(query, [roleName, roleId]);
    return true;
}

/**
 * Delete role
 */
export async function deleteRole(conn: Connection, roleId: number): Promise<boolean> {
    const query = `DELETE FROM RANDM_TST.ROLE WHERE ROLEID = ?`;
    await conn.query(query, [roleId]);
    return true;
}

// mapping function removed; direct query results are returned
