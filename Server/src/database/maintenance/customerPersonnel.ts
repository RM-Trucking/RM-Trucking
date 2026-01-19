import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';
import { CustomerPersonnel } from '../../entities/maintenance';

/**
 * Create a new personnel record
 */
export async function createCustomerPersonnel(
  conn: Connection,
  personnel: Partial<CustomerPersonnel>
): Promise<number> {
  const query = `
    SELECT "personnelId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Customer_Personnel"
      ("stationId","departmentId","name","email","officePhoneNumber","cellPhoneNumber",
       "createdAt","createdBy","activeStatus", "noteThreadId", "entityId")
      VALUES (?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, 'Y', ?, ?)
    )
  `;

  const params = [
    personnel.stationId,
    personnel.departmentId,
    personnel.name,
    personnel.email,
    personnel.officePhoneNumber,
    personnel.cellPhoneNumber,
    personnel.createdBy,
    personnel.noteThreadId,
    personnel.entityId
  ].map(v => v === undefined || v === null ? '' : v);

  const result = (await conn.query(query, params)) as any[];
  return result[0]?.personnelId;
}

/**
 * Get personnel by ID
 */
export async function getCustomerPersonnelById(
  conn: Connection,
  personnelId: number
): Promise<(CustomerPersonnel & { stationName: string; departmentName: string }) | null> {
  const query = `
    SELECT p.*, 
           s."stationName", 
           d."departmentName"
    FROM ${SCHEMA}."Customer_Personnel" p
    LEFT JOIN ${SCHEMA}."Station" s 
      ON p."stationId" = s."stationId"
    LEFT JOIN ${SCHEMA}."Department" d 
      ON p."departmentId" = d."departmentId"
    WHERE p."personnelId" = ?
  `;

  const result = (await conn.query(query, [personnelId])) as any[];
  return result.length > 0
    ? (result[0] as CustomerPersonnel & { stationName: string; departmentName: string })
    : null;
}

/**
 * Get personnel for a station with optional search + pagination
 */
export async function getPersonnelByStation(
  conn: Connection,
  stationId: number,
  searchTerm: string | null,
  page: number = 1,
  pageSize: number = 10
): Promise<(CustomerPersonnel & { stationName: string; departmentName: string })[]> {
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT p.*, 
           s."stationName", 
           d."departmentName"
    FROM ${SCHEMA}."Customer_Personnel" p
    LEFT JOIN ${SCHEMA}."Station" s ON p."stationId" = s."stationId"
    LEFT JOIN ${SCHEMA}."Department" d ON p."departmentId" = d."departmentId"
    WHERE p."stationId" = ? AND p."activeStatus" = 'Y'
  `;
  const params: any[] = [stationId];

  if (searchTerm && searchTerm.trim() !== '') {
    query += ` AND LOWER(p."name") LIKE ?`;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  query += ` ORDER BY p."name" ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
  params.push(offset, pageSize);

  const result = (await conn.query(query, params)) as any[];
  return result as (CustomerPersonnel & { stationName: string; departmentName: string })[];
}

/**
 * Count personnel for a station (for pagination metadata)
 */
export async function countPersonnelByStation(
  conn: Connection,
  stationId: number,
  searchTerm: string | null
): Promise<number> {
  let query = `
    SELECT COUNT(*) AS total
    FROM ${SCHEMA}."Customer_Personnel" p
    WHERE p."stationId" = ? AND p."activeStatus" = 'Y'
  `;
  const params: any[] = [stationId];

  if (searchTerm && searchTerm.trim() !== '') {
    query += ` AND LOWER(p."name") LIKE ?`;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  const result = (await conn.query(query, params)) as any[];
  return result[0]?.TOTAL || 0;
}


/**
 * Update personnel (partial update)
 */
export async function updateCustomerPersonnel(
  conn: Connection,
  personnelId: number,
  updates: Partial<CustomerPersonnel>,
  userId: number
): Promise<void> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.stationId !== undefined) { setParts.push(`"stationId" = ?`); params.push(updates.stationId); }
  if (updates.departmentId !== undefined) { setParts.push(`"departmentId" = ?`); params.push(updates.departmentId); }
  if (updates.name !== undefined) { setParts.push(`"name" = ?`); params.push(updates.name); }
  if (updates.email !== undefined) { setParts.push(`"email" = ?`); params.push(updates.email); }
  if (updates.officePhoneNumber !== undefined) { setParts.push(`"officePhoneNumber" = ?`); params.push(updates.officePhoneNumber); }
  if (updates.cellPhoneNumber !== undefined) { setParts.push(`"cellPhoneNumber" = ?`); params.push(updates.cellPhoneNumber); }

  // Always update audit fields
  setParts.push(`"updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)`);
  setParts.push(`"updatedBy" = ?`);
  params.push(userId);

  const query = `
    UPDATE ${SCHEMA}."Customer_Personnel"
    SET ${setParts.join(', ')}
    WHERE "personnelId" = ?
  `;
  params.push(personnelId);

  await conn.query(query, params);
}

/**
 * Soft delete personnel
 */
export async function softDeletePersonnel(
  conn: Connection,
  personnelId: number,
  userId: number
): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Customer_Personnel"
    SET "activeStatus" = 'N',
        "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE),
        "updatedBy" = ?
    WHERE "personnelId" = ?
  `;
  await conn.query(query, [userId, personnelId]);
}
