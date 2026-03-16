import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';
import { CarrierPersonnel } from '../../entities/maintenance';

export async function createCarrierPersonnel(
    conn: Connection,
    personnel: Partial<CarrierPersonnel>
): Promise<number> {
    const query = `
    SELECT "personnelId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Carrier_Personnel"
      ("terminalId","name","personType","email","officePhoneNumber","cellPhoneNumber",
       "createdAt","createdBy","activeStatus", "noteThreadId", "entityId")
      VALUES (?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, 'Y', ?, ?)
    )
  `;

    const params = [
        personnel.terminalId,
        personnel.name,
        personnel.personType,
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

export async function checkCarrierPersonnelEmailExists(conn: Connection, email: string): Promise<boolean> {
    const query = `SELECT 1 FROM ${SCHEMA}."Carrier_Personnel" WHERE "email" = ?`;
    const result = await conn.query(query, [email]) as any[];
    return result.length > 0;
}


/**
 * Get personnel by ID
 */
export async function getCarrierPersonnelById(
    conn: Connection,
    personnelId: number
): Promise<(CarrierPersonnel & { terminalName: string }) | null> {
    const query = `
    SELECT p.*, 
           t."terminalName", 
    FROM ${SCHEMA}."Carrier_Personnel" p
    LEFT JOIN ${SCHEMA}."Terminal" t 
      ON p."terminalId" = t."terminalId"
    WHERE p."personnelId" = ?
  `;

    const result = (await conn.query(query, [personnelId])) as any[];
    return result.length > 0
        ? (result[0] as CarrierPersonnel & { terminalName: string })
        : null;
}

/**
 * Get personnel for a terminal with optional search + pagination
 */
export async function getPersonnelByTerminal(
    conn: Connection,
    terminalId: number,
    searchTerm: string | null,
    page: number = 1,
    pageSize: number = 10
): Promise<(CarrierPersonnel & { terminalName: string })[]> {
    const offset = (page - 1) * pageSize;

    let query = `
    SELECT p.*, 
           t."terminalName", 
    FROM ${SCHEMA}."Carrier_Personnel" p
    LEFT JOIN ${SCHEMA}."Terminal" t ON p."terminalId" = t."terminalId"
    WHERE p."terminalId" = ? AND p."activeStatus" = 'Y'
  `;
    const params: any[] = [terminalId];

    if (searchTerm && searchTerm.trim() !== '') {
        query += ` AND LOWER(p."name") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    query += ` ORDER BY p."name" ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
    params.push(offset, pageSize);

    const result = (await conn.query(query, params)) as any[];
    return result as (CarrierPersonnel & { terminalName: string })[];
}

/**
 * Count personnel for a terminal (for pagination metadata)
 */
export async function countPersonnelByTerminal(
    conn: Connection,
    terminalId: number,
    searchTerm: string | null
): Promise<number> {
    let query = `
    SELECT COUNT(*) AS total
    FROM ${SCHEMA}."Carrier_Personnel" p
    WHERE p."terminalId" = ? AND p."activeStatus" = 'Y'
  `;
    const params: any[] = [terminalId];

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
export async function updateCarrierPersonnel(
    conn: Connection,
    personnelId: number,
    updates: Partial<CarrierPersonnel>,
    userId: number
): Promise<void> {
    const setParts: string[] = [];
    const params: any[] = [];

    if (updates.terminalId !== undefined) { setParts.push(`"terminalId" = ?`); params.push(updates.terminalId); }
    if (updates.name !== undefined) { setParts.push(`"name" = ?`); params.push(updates.name); }
    if (updates.personType !== undefined) { setParts.push(`"personType" = ?`); params.push(updates.personType); }
    if (updates.email !== undefined) { setParts.push(`"email" = ?`); params.push(updates.email); }
    if (updates.officePhoneNumber !== undefined) { setParts.push(`"officePhoneNumber" = ?`); params.push(updates.officePhoneNumber); }
    if (updates.cellPhoneNumber !== undefined) { setParts.push(`"cellPhoneNumber" = ?`); params.push(updates.cellPhoneNumber); }

    // Always update audit fields
    setParts.push(`"updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)`);
    setParts.push(`"updatedBy" = ?`);
    params.push(userId);

    const query = `
    UPDATE ${SCHEMA}."Carrier_Personnel"
    SET ${setParts.join(', ')}
    WHERE "personnelId" = ?
  `;
    params.push(personnelId);

    await conn.query(query, params);
}

/**
 * Soft delete personnel
 */
export async function softDeleteCarrierPersonnel(
    conn: Connection,
    personnelId: number,
    userId: number
): Promise<void> {
    const query = `
    UPDATE ${SCHEMA}."Carrier_Personnel"
    SET "activeStatus" = 'N',
        "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE),
        "updatedBy" = ?
    WHERE "personnelId" = ?
  `;
    await conn.query(query, [userId, personnelId]);
}
