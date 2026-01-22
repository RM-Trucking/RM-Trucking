import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";
import { Zone, ZoneZip } from "../../entities/maintenance/Zone";

export async function createZone(
  conn: Connection,
  zoneName: string,
  entityId: number,
  noteThreadId: number,
  userId: number
): Promise<number> {
  const query = `
    SELECT "zoneId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Zone"
      ("zoneName","entityId","noteThreadId","createdAt","createdBy","activeStatus")
      VALUES (?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, 'Y')
    )
  `;
  const result = await conn.query(query, [zoneName, entityId, noteThreadId, userId]) as any[];
  return result[0]?.zoneId;
}

export async function createZoneZip(
  conn: Connection,
  zoneId: number,
  zipCode: string | null,
  rangeStart: string | null,
  rangeEnd: string | null
): Promise<number> {
  const query = `
    SELECT "zoneZipId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Zone_Zip"
      ("zoneId","zipCode","rangeStart","rangeEnd")
      VALUES (?, ?, ?, ?)
    )
  `;

  const params = [zoneId, zipCode || '', rangeStart || '', rangeEnd || ''];

  const result = await conn.query(query, params) as any[];
  return result[0]?.zoneZipId;
}

export async function getZoneById(conn: Connection, zoneId: number): Promise<Zone | null> {
  const query = `SELECT * FROM ${SCHEMA}."Zone" WHERE "zoneId" = ?`;
  const result = await conn.query(query, [zoneId]) as any[];
  return result.length ? (result[0] as Zone) : null;
}

export async function getZoneZips(conn: Connection, zoneId: number): Promise<ZoneZip[]> {
  const query = `SELECT * FROM ${SCHEMA}."Zone_Zip" WHERE "zoneId" = ?`;
  const result = await conn.query(query, [zoneId]) as any[];
  return result as ZoneZip[];
}

export async function updateZone(
  conn: Connection,
  zoneId: number,
  zoneName: string | undefined,
  activeStatus: 'Y' | 'N' | undefined,
  userId: number
): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Zone"
    SET 
      ${zoneName ? `"zoneName" = ?,` : ''}
      ${activeStatus ? `"activeStatus" = ?,` : ''}
      "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE),
      "updatedBy" = ?
    WHERE "zoneId" = ?
  `;
  const params: any[] = [];
  if (zoneName) params.push(zoneName);
  if (activeStatus) params.push(activeStatus);
  params.push(userId, zoneId);
  await conn.query(query, params);
}

export async function softDeleteZone(conn: Connection, zoneId: number): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Zone"
    SET "activeStatus" = 'N', "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
    WHERE "zoneId" = ?
  `;
  await conn.query(query, [zoneId]);
}
