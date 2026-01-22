import { Connection } from 'odbc';
import { NoteMessage } from '../../entities/maintenance';
import { SCHEMA } from '../../config/db2';

/**
 * Create a new note thread
 */
export async function createNoteThread(
    conn: Connection,
    entityId: number,
    createdBy: number
): Promise<number> {
    const query = `
        INSERT INTO ${SCHEMA}."Note_Thread"
        ("entityId", "createdBy", "createdAt")
        VALUES (?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE))
    `;
    await conn.query(query, [entityId, createdBy]);

    const resultQuery = `
        SELECT "noteThreadId"
        FROM ${SCHEMA}."Note_Thread"
        WHERE "entityId" = ?
        ORDER BY "noteThreadId" DESC
        FETCH FIRST 1 ROWS ONLY
    `;
    const result = (await conn.query(resultQuery, [entityId])) as any[];
    return result[0]?.noteThreadId || 0;
}

/**
 * Create a new note message
 */
export async function createNoteMessage(
    conn: Connection,
    noteThreadId: number,
    messageText: string,
    createdBy: number
): Promise<number> {
    const query = `
        INSERT INTO ${SCHEMA}."Note_Message"
        ("noteThreadId", "messageText", "createdBy", "createdAt")
        VALUES (?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE))
    `;
    await conn.query(query, [noteThreadId, messageText, createdBy]);

    const resultQuery = `
        SELECT "noteMessageId"
        FROM ${SCHEMA}."Note_Message"
        WHERE "noteThreadId" = ?
        ORDER BY "noteMessageId" DESC
        FETCH FIRST 1 ROWS ONLY
    `;
    const result = (await conn.query(resultQuery, [noteThreadId])) as any[];
    return result[0]?.noteMessageId || 0;
}

/**
 * Get all messages for a thread
 */
export async function getMessagesByThread(
    conn: Connection,
    noteThreadId: number
): Promise<(NoteMessage & { createdByName: string })[]> {
    const query = `
    SELECT nm."noteMessageId",
           nm."noteThreadId",
           nm."messageText",
           nm."createdAt",
           nm."createdBy",
           u."userName" AS "createdByName"
    FROM ${SCHEMA}."Note_Message" nm
    LEFT JOIN ${SCHEMA}."User" u
      ON nm."createdBy" = u."userId"
    WHERE nm."noteThreadId" = ?
    ORDER BY nm."createdAt" DESC
  `;

    const result = (await conn.query(query, [noteThreadId])) as any[];
    return result as (NoteMessage & { createdByName: string })[];
}

