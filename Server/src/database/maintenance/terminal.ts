import { Connection } from 'odbc'; // or your DB connection type
import { Terminal, UpdateTerminalRequest } from '../../entities/maintenance/Terminal';
import { SCHEMA } from '../../config/db2';

export async function createTerminal(conn: Connection, terminal: Partial<Terminal>): Promise<number> {
    const insertQuery = `
    SELECT "terminalId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Terminal"
      ("carrierId","entityId","terminalName","rmAccountNumber","airportCode",
       "email","phoneNumber","faxNumber","openTime","closeTime","hours",
       "noteThreadId","activeStatus","createdBy","createdAt")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE))
    )
  `;

    const params = [
        terminal.carrierId,
        terminal.entityId,
        terminal.terminalName,
        terminal.rmAccountNumber,
        terminal.airportCode,
        terminal.email,
        terminal.phoneNumber,
        terminal.faxNumber,
        terminal.openTime,
        terminal.closeTime,
        terminal.hours,
        terminal.noteThreadId,
        terminal.activeStatus ?? 'Y', // default to 'Y' if not provided
        terminal.createdBy
    ].map(v => v === undefined || v === null ? '' : v); // normalize null/undefined

    const result = (await conn.query(insertQuery, params)) as any[];
    return result[0]?.terminalId;
}


export async function getTerminalById(conn: Connection, terminalId: number): Promise<any | null> {
    const query = `
        SELECT t.*, c."carrierName"
        FROM ${SCHEMA}."Terminal" t
        JOIN ${SCHEMA}."Carrier" c ON t."carrierId" = c."carrierId"
        WHERE t."terminalId" = ? AND t."activeStatus" = 'Y'
    `;
    const result = await conn.query(query, [terminalId]) as any[];
    return result.length ? result[0] : null;
}

export async function getTerminalsForCarrier(conn: Connection, carrierId: number): Promise<any[]> {
    const query = `
        SELECT t.*, c."carrierName"
        FROM ${SCHEMA}."Terminal" t
        JOIN ${SCHEMA}."Carrier" c ON t."carrierId" = c."carrierId"
        WHERE t."carrierId" = ? AND t."activeStatus" = 'Y'
        ORDER BY t."terminalName" ASC
    `;
    const result = await conn.query(query, [carrierId]) as any[];
    return result;
}

export async function getTerminalByRmAccountNumber(conn: Connection, rmAccountNumber: string): Promise<any | null> {
    const query = `
        SELECT * FROM ${SCHEMA}."Terminal"
        WHERE "rmAccountNumber" = ? AND "activeStatus" = 'Y'
    `;
    const result = await conn.query(query, [rmAccountNumber]) as any[];
    return result.length ? result[0] : null;
}

export async function updateTerminal(
    conn: Connection,
    terminalId: number,
    updates: Partial<Terminal> & { updatedBy: number }
): Promise<void> {
    // Build dynamic SET clause based on provided fields
    const fields = Object.keys(updates).filter(f => updates[f as keyof Terminal] !== undefined);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `"${f}" = ?`).join(', ');
    const params = fields.map(f => (updates as any)[f]);

    const query = `
        UPDATE ${SCHEMA}."Terminal"
        SET ${setClause}, "updatedBy" = ?, "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
        WHERE "terminalId" = ?
    `;

    await conn.query(query, [...params, updates.updatedBy, terminalId]);
}



export async function softDeleteTerminal(conn: Connection, terminalId: number, userId: number): Promise<void> {
    const query = `
        UPDATE ${SCHEMA}."Terminal"
        SET "activeStatus" = 'N',
            "updatedBy" = ?,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "terminalId" = ?
    `;
    await conn.query(query, [userId, terminalId]);
}
