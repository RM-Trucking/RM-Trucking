import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";
import { Zone, ZoneZip } from "../../entities/maintenance/Zone";

// -------------------- Create Zone --------------------
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

// -------------------- Create Zone Zip --------------------
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
  // Replace nulls with empty strings to satisfy (string | number)[]
  const params: (string | number)[] = [
    zoneId,
    zipCode !== null ? zipCode : "",
    rangeStart !== null ? rangeStart : "",
    rangeEnd !== null ? rangeEnd : ""
  ];
  const result = await conn.query(query, params) as any;
  return result[0]?.zoneZipId;
}

export async function getAllZonesBasic(conn: Connection): Promise<Zone[]> {
  const query = `SELECT "zoneId","zoneName" FROM ${SCHEMA}."Zone" WHERE "activeStatus" = 'Y' ORDER BY "zoneName" ASC`;
  const result = await conn.query(query) as any[];
  return result as Zone[];
}


export async function getZones(
  conn: Connection,
  limit: number,
  offset: number,
  searchTerm?: string
): Promise<Zone[]> {
  let query = `SELECT * FROM ${SCHEMA}."Zone" WHERE "activeStatus" = 'Y'`;
  const params: any[] = [];

  if (searchTerm) {
    query += ` AND LOWER("zoneName") LIKE ?`;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  query += ` ORDER BY "zoneId" DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await conn.query(query, params) as any[];
  return result as Zone[];
}

export async function countZones(conn: Connection, searchTerm?: string): Promise<number> {
  let query = `SELECT COUNT(*) AS TOTAL FROM ${SCHEMA}."Zone" WHERE "activeStatus" = 'Y'`;
  const params: any[] = [];

  if (searchTerm) {
    query += ` AND LOWER("zoneName") LIKE ?`;
    params.push(`%${searchTerm.toLowerCase()}%`);
  }

  const result = await conn.query(query, params) as any[];

  return result[0]?.TOTAL || 0;
}



// -------------------- Get Zone By Id --------------------
export async function getZoneById(conn: Connection, zoneId: number): Promise<Zone | null> {
  const query = `SELECT * FROM ${SCHEMA}."Zone" WHERE "zoneId" = ?`;
  const result = await conn.query(query, [zoneId]) as any[];
  return result.length ? (result[0] as Zone) : null;
}

export async function getZoneByName(conn: Connection, zoneName: string): Promise<Zone | null> {
  const normalizedName = zoneName.trim().toUpperCase();
  const query = `SELECT * FROM ${SCHEMA}."Zone" WHERE UPPER(TRIM("zoneName")) = ?`;
  const result = await conn.query(query, [normalizedName]) as any[];
  return result.length ? (result[0] as Zone) : null;
}


// -------------------- Get Zone Zips --------------------
export async function getZoneZips(conn: Connection, zoneId: number): Promise<ZoneZip[]> {
  const query = `SELECT * FROM ${SCHEMA}."Zone_Zip" WHERE "zoneId" = ?`;
  const result = await conn.query(query, [zoneId]) as any[];
  return result as ZoneZip[];
}

// -------------------- Update Zone --------------------
export async function updateZone(
  conn: Connection,
  zoneId: number,
  zoneName?: string,
  activeStatus?: 'Y' | 'N',
  userId?: number
): Promise<void> {
  const fields: string[] = [];
  const params: any[] = [];

  if (zoneName) { fields.push(`"zoneName" = ?`); params.push(zoneName); }
  if (activeStatus) { fields.push(`"activeStatus" = ?`); params.push(activeStatus); }

  fields.push(`"updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)`);
  fields.push(`"updatedBy" = ?`);
  params.push(userId, zoneId);

  const query = `
    UPDATE ${SCHEMA}."Zone"
    SET ${fields.join(", ")}
    WHERE "zoneId" = ?
  `;
  await conn.query(query, params);
}

// -------------------- Soft Delete Zone --------------------
export async function softDeleteZone(conn: Connection, zoneId: number): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Zone"
    SET "activeStatus" = 'N', "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
    WHERE "zoneId" = ?
  `;
  await conn.query(query, [zoneId]);
}

export async function deleteZoneZips(conn: Connection, zoneId: number): Promise<void> {
  const query = `DELETE FROM ${SCHEMA}."Zone_Zip" WHERE "zoneId" = ?`;
  await conn.query(query, [zoneId]);
}


export async function findZonesByZip(conn: Connection, zipCode: string): Promise<{ zoneId: number, zoneName: string }[]> {
  const query = `
    SELECT z."zoneId", z."zoneName"
    FROM ${SCHEMA}."Zone_Zip" zz
    JOIN ${SCHEMA}."Zone" z ON zz."zoneId" = z."zoneId"
    WHERE zz."zipCode" = ?
       OR (zz."rangeStart" IS NOT NULL AND zz."rangeEnd" IS NOT NULL 
           AND ? BETWEEN zz."rangeStart" AND zz."rangeEnd")
  `;
  const result = await conn.query(query, [zipCode, zipCode]) as any[];
  return result.map(r => ({ zoneId: r.zoneId, zoneName: r.zoneName }));
}


// DB function: find zones by zips and ranges
export async function findZonesByZipsAndRanges(
  conn: Connection,
  input: string
): Promise<any[]> {
  // Split input into parts (zips and ranges)
  const parts = input.split(',').map(p => p.trim()).filter(Boolean);

  if (!parts.length) {
    return [];
  }

  const subConditions: string[] = [];
  const subParams: (string | number)[] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(r => Number(r.trim()));
      // Check if any zip in the range exists in Zone_Zip
      subConditions.push(`EXISTS (
          SELECT 1 FROM ${SCHEMA}."Zone_Zip" z
          WHERE z."zoneId" = main."zoneId"
          AND z."zipCode" BETWEEN ? AND ?
      )`);
      subParams.push(start, end);
    } else {
      // Check if the exact zip exists in Zone_Zip
      subConditions.push(`EXISTS (
          SELECT 1 FROM ${SCHEMA}."Zone_Zip" z
          WHERE z."zoneId" = main."zoneId"
          AND z."zipCode" = ?
      )`);
      subParams.push(part);
    }
  }

  // Build final query
  const query = `
    SELECT 
      main."zoneId", 
      main."zoneName", 
      zz."zipCode", 
      zz."rangeStart", 
      zz."rangeEnd"
    FROM ${SCHEMA}."Zone" main
    JOIN ${SCHEMA}."Zone_Zip" zz ON main."zoneId" = zz."zoneId"
    WHERE ${subConditions.join(' OR ')}
  `;

  return await conn.query(query, subParams) as any[];
}





// DB function: get all active zones with zips and ranges
export async function getAllZonesWithZips(conn: Connection): Promise<any[]> {
  const query = `
    SELECT z."zoneId", z."zoneName", zz."zipCode", zz."rangeStart", zz."rangeEnd"
    FROM ${SCHEMA}."Zone" z
    LEFT JOIN ${SCHEMA}."Zone_Zip" zz ON z."zoneId" = zz."zoneId"
    WHERE z."activeStatus" = 'Y'
  `;
  return await conn.query(query) as any[];
}

