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

export async function getAllAccessorials(
  conn: Connection,
  searchTerm: string | null,
  page: number = 1,
  pageSize: number = 10
): Promise<Accessorial[]> {
  const offset = (page - 1) * pageSize;

  let query = `
        SELECT "accessorialId", "accessorialName", "activeStatus",
               "createdAt", "createdBy", "updatedAt", "updatedBy"
        FROM ${SCHEMA}."Accessorial"
    `;
  const params: any[] = [];

  if (searchTerm) {
    query += ` WHERE LOWER("accessorialName") LIKE ? `;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  query += ` ORDER BY "accessorialName" ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY `;
  params.push(offset, pageSize);

  console.log(query);


  const result = (await conn.query(query, params)) as any[];

  console.log(result);


  return result as Accessorial[];
}

export async function countAccessorials(
  conn: Connection,
  searchTerm: string | null
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM ${SCHEMA}."Accessorial"`;
  const params: any[] = [];

  if (searchTerm) {
    query += ` WHERE LOWER("accessorialName") LIKE ? `;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  const result = await conn.query(query, params) as any[];
  return parseInt(result[0].TOTAL, 10);
}


export async function getAccessorialDropdown(conn: Connection): Promise<{ id: number, name: string }[]> {
  const query = `SELECT "accessorialId", "accessorialName" FROM ${SCHEMA}."Accessorial" ORDER BY "accessorialName" ASC`;
  const result = await conn.query(query) as any[];
  return result;
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


export async function checkAccessorialUniqueFields(
  conn: Connection,
  { accessorialName }: { accessorialName?: string },
  accessorialId?: number // optional, so we can exclude current record on update
): Promise<string | null> {
  const queries: string[] = [];
  const params: (string | number)[] = [];

  if (accessorialName) {
    queries.push(`SELECT 'Accessorial Name' AS "conflictField" FROM "${SCHEMA}"."Accessorial" WHERE "accessorialName" = ? AND "accessorialId" <> ?`);
    params.push(accessorialName, accessorialId ?? -1);
  }

  if (queries.length === 0) return null;

  const query = queries.join(' UNION ALL ');
  const result = await conn.query(query, params) as { conflictField: string }[];
  return result.length ? result[0].conflictField : null;
}