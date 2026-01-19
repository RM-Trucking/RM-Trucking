import { Connection } from 'odbc';
import { Station } from '../../entities/maintenance';
import { SCHEMA } from '../../config/db2';

/**
 * Create a new station and return its ID
 */
export async function createStation(conn: Connection, station: Partial<Station>): Promise<number> {
  const insertQuery = `
    SELECT "stationId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Station"
      ("customerId","entityId","stationName","rmAccountNumber","airportCode","phoneNumber","faxNumber",
       "openTime","closeTime","hours","warehouse","warehouseDetail","activeStatus","createdAt","createdBy","noteThreadId")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, ?)
    )
  `;

  const params = [
    station.customerId,
    station.entityId,
    station.stationName,
    station.rmAccountNumber,
    station.airportCode,
    station.phoneNumber,
    station.faxNumber,
    station.openTime,
    station.closeTime,
    station.hours,
    station.warehouse,
    station.warehouseDetail,
    station.createdBy,
    station.noteThreadId
  ].map(v => v === undefined || v === null ? '' : v); // convert null/undefined to empty string

  const result = (await conn.query(insertQuery, params)) as any[];

  return result[0]?.stationId;
}


/**
 * Get station by ID
 */
export async function getStationById(
  conn: Connection,
  stationId: number
): Promise<(Station & { customerName: string }) | null> {
  const query = `
    SELECT s.*, c."customerName"
    FROM ${SCHEMA}."Station" s
    JOIN ${SCHEMA}."Customer" c
      ON s."customerId" = c."customerId"
    WHERE s."stationId" = ?
  `;
  const result = (await conn.query(query, [stationId])) as any[];
  return result.length > 0 ? (result[0] as Station & { customerName: string }) : null;
}


/**
 * Get all active stations for a customer
 */
export async function getStationsByCustomer(
  conn: Connection,
  customerId: number,
  page: number,
  pageSize: number,
  searchTerm?: string | null
): Promise<(Station & { customerName: string })[]> {
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT s.*, c."customerName"
    FROM ${SCHEMA}."Station" s
    JOIN ${SCHEMA}."Customer" c
      ON s."customerId" = c."customerId"
    WHERE s."customerId" = ? AND s."activeStatus" = 'Y'
  `;
  const params: any[] = [customerId];

  if (searchTerm && searchTerm.trim() !== '') {
    query += ` AND LOWER(s."stationName") LIKE ?`;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  query += ` ORDER BY s."stationName" ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
  params.push(offset, pageSize);

  const result = (await conn.query(query, params)) as any[];
  return result as (Station & { customerName: string })[];
}


export async function countStationsByCustomer(
  conn: Connection,
  customerId: number,
  searchTerm?: string | null
): Promise<number> {
  let query = `
    SELECT COUNT(*) AS "total"
    FROM ${SCHEMA}."Station"
    WHERE "customerId" = ? AND "activeStatus" = 'Y'
  `;
  const params: any[] = [customerId];

  if (searchTerm && searchTerm.trim() !== '') {
    query += ` AND LOWER("stationName") LIKE ?`;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  const result = (await conn.query(query, params)) as any[];

  return result[0]?.total || 0;
}




/**
 * Update station fields
 */
export async function updateStation(conn: Connection, stationId: number, updates: Partial<Station>): Promise<void> {
  const fields = Object.keys(updates).filter(f => updates[f as keyof Station] !== undefined);
  if (fields.length === 0) return;

  const setClause = fields.map(f => `"${f}" = ?`).join(', ');
  const params = fields.map(f => (updates as any)[f]);

  const query = `
    UPDATE ${SCHEMA}."Station"
    SET ${setClause}, "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
    WHERE "stationId" = ?
  `;
  await conn.query(query, [...params, stationId]);
}

/**
 * Soft delete station (set activeStatus = 'N')
 */
export async function softDeleteStation(conn: Connection, stationId: number): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Station"
    SET "activeStatus" = 'N', "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
    WHERE "stationId" = ?
  `;
  await conn.query(query, [stationId]);
}

/**
 * Check if RM account number already exists (unique constraint helper)
 */
export async function getStationByRmAccountNumber(conn: Connection, rmAccountNumber: string): Promise<Station | null> {
  const query = `
    SELECT * FROM ${SCHEMA}."Station"
    WHERE "rmAccountNumber" = ? AND "activeStatus" = 'Y'
    FETCH FIRST 1 ROWS ONLY
  `;
  const result = (await conn.query(query, [rmAccountNumber])) as any[];
  return result.length > 0 ? (result[0] as Station) : null;
}
