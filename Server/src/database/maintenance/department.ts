import { Connection } from 'odbc';
import { Department } from '../../entities/maintenance';
import { SCHEMA } from '../../config/db2';

/**
 * Create a new department and return its ID
 */
export async function createDepartment(conn: Connection, dept: Partial<Department>): Promise<number> {
  const insertQuery = `
    SELECT "departmentId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Department"
      ("stationId","departmentName","phoneNumber","email","createdAt","createdBy","activeStatus","entityId", "noteThreadId")
      VALUES (?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, ?, ?, ?)
    )
  `;

  const params = [
    dept.stationId,
    dept.departmentName,
    dept.phoneNumber,
    dept.email,
    dept.createdBy,
    dept.activeStatus,
    dept.entityId,
    dept.noteThreadId
  ].map(v => v === undefined || v === null ? '' : v); // normalize null/undefined

  const result = (await conn.query(insertQuery, params)) as any[];
  return result[0]?.departmentId;
}


/**
 * Get department by ID
 */
export async function getDepartmentById(
  conn: Connection,
  departmentId: number
): Promise<(Department & { customerName: string; stationName: string }) | null> {
  const query = `
    SELECT d.*, 
           s."stationName",
           s."entityId",
           s."noteThreadId", 
           c."customerName"
    FROM ${SCHEMA}."Department" d
    JOIN ${SCHEMA}."Station" s 
      ON d."stationId" = s."stationId"
    JOIN ${SCHEMA}."Customer" c 
      ON s."customerId" = c."customerId"
    WHERE d."departmentId" = ?
  `;

  const result = (await conn.query(query, [departmentId])) as any[];
  return result.length > 0
    ? (result[0] as Department & { customerName: string; stationName: string, entityId: number; noteThreadId: number })
    : null;
}

/**
 * Get all departments for a station
 */
export async function getDepartmentsByStation(
  conn: Connection,
  stationId: number
): Promise<(Department & { stationName: string; customerName: string })[]> {
  const query = `
    SELECT d.*, 
           s."stationName", 
           c."customerName"
    FROM ${SCHEMA}."Department" d
    JOIN ${SCHEMA}."Station" s 
      ON d."stationId" = s."stationId"
    JOIN ${SCHEMA}."Customer" c 
      ON s."customerId" = c."customerId"
    WHERE d."stationId" = ?
    ORDER BY d."departmentName" ASC
  `;

  const result = (await conn.query(query, [stationId])) as any[];
  return result as (Department & { stationName: string; customerName: string })[];
}

/**
 * Update department fields
 */
export async function updateDepartment(conn: Connection, departmentId: number, updates: Partial<Department>): Promise<void> {
  const fields = Object.keys(updates).filter(f => updates[f as keyof Department] !== undefined);
  if (fields.length === 0) return;

  const setClause = fields.map(f => `"${f}" = ?`).join(', ');
  const params = fields.map(f => (updates as any)[f]);

  const query = `
    UPDATE ${SCHEMA}."Department"
    SET ${setClause}, "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
    WHERE "departmentId" = ?
  `;
  await conn.query(query, [...params, departmentId]);
}

/**
 * Soft delete department (set updatedAt only, no activeStatus column here)
 * If you want to add activeStatus later, adjust schema accordingly.
 */
export async function deleteDepartment(conn: Connection, departmentId: number, userId: number): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Department"
    SET "activeStatus" = 'N',
        "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE),
        "updatedBy" = ?
    WHERE "departmentId" = ?
  `;
  await conn.query(query, [userId, departmentId]);
}

