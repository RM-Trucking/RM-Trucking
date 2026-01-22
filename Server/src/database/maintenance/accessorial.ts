import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";
import { Accessorial, CreateAccessorialRequest } from "../../entities/maintenance/Accessorial";

// accessorial.database.ts
export async function createAccessorial(conn: Connection, req: CreateAccessorialRequest, userId: number): Promise<number> {
  const query = `
    SELECT "accessorialId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Accessorial"
      ("accessorialName","createdAt","createdBy")
      VALUES (?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?)
    )
  `;
  const result = await conn.query(query, [req.accessorialName, userId]) as any[];
  return result[0]?.accessorialId;
}

export async function getAllAccessorials(conn: Connection): Promise<Accessorial[]> {
  const query = `SELECT * FROM ${SCHEMA}."Accessorial" ORDER BY "accessorialName" ASC`;
  const result = await conn.query(query) as any[];
  return result as Accessorial[];
}

export async function getAccessorialById(conn: Connection, accessorialId: number): Promise<Accessorial | null> {
  const query = `
    SELECT *
    FROM ${SCHEMA}."Accessorial"
    WHERE "accessorialId" = ?
  `;
  const result = await conn.query(query, [accessorialId]) as any[];
  return result.length > 0 ? (result[0] as Accessorial) : null;
}

/**
 * Update an accessorial
 */
export async function updateAccessorial(
  conn: Connection,
  accessorialId: number,
  accessorialName: string,
  userId: number
): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Accessorial"
    SET "accessorialName" = ?, 
        "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), 
        "updatedBy" = ?
    WHERE "accessorialId" = ?
  `;
  await conn.query(query, [accessorialName, userId, accessorialId]);
}

/**
 * Soft delete an accessorial (mark inactive)
 */
export async function softDeleteAccessorial(
  conn: Connection,
  accessorialId: number,
  userId: number
): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Accessorial"
    SET "activeStatus" = 'N',
        "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE),
        "updatedBy" = ?
    WHERE "accessorialId" = ?
  `;
  await conn.query(query, [userId, accessorialId]);
}
