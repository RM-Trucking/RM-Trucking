import { Connection } from 'odbc';
import { Zone, ZoneZip } from '../../entities/maintenance/Zone';

// Zone queries
export async function createZone(conn: Connection, zoneName: string): Promise<number> {
  const query = `
    INSERT INTO RANDM_TST.ZONE (zone_name)
    VALUES (?)
  `;
  await conn.query(query, [zoneName]);
  const resultQuery = `SELECT zone_id FROM RANDM_TST.ZONE WHERE zone_name = ? ORDER BY zone_id DESC FETCH FIRST 1 ROWS ONLY`;
  const result = (await conn.query(resultQuery, [zoneName])) as any[];
  return result[0]?.zone_id || 0;
}

export async function getAllZones(conn: Connection): Promise<Zone[]> {
  const query = `
    SELECT zone_id AS zoneId, zone_name AS zoneName
    FROM RANDM_TST.ZONE
    ORDER BY zone_id ASC
  `;
  const result = (await conn.query(query)) as Zone[];
  return result;
}

export async function getZoneById(conn: Connection, zoneId: number): Promise<Zone | null> {
  const query = `
    SELECT zone_id AS zoneId, zone_name AS zoneName
    FROM RANDM_TST.ZONE
    WHERE zone_id = ?
  `;
  const result = (await conn.query(query, [zoneId])) as Zone[];
  return result.length > 0 ? result[0] : null;
}

// ZoneZip queries
export async function addZoneZip(
  conn: Connection,
  zoneId: number,
  zipCode?: string,
  rangeStart?: string,
  rangeEnd?: string
): Promise<number> {
  const query = `
    INSERT INTO RANDM_TST.ZONE_ZIP (zone_id, zip_code, range_start, range_end)
    VALUES (?, ?, ?, ?)
  `;
  // @ts-ignore: ODBC query parameter typing
  await conn.query(query, [zoneId, zipCode ?? null, rangeStart ?? null, rangeEnd ?? null]);
  const resultQuery = `SELECT zone_zip_id FROM RANDM_TST.ZONE_ZIP WHERE zone_id = ? ORDER BY zone_zip_id DESC FETCH FIRST 1 ROWS ONLY`;
  // @ts-ignore: ODBC query parameter typing
  const result = (await conn.query(resultQuery, [zoneId])) as any[];
  return result[0]?.zone_zip_id || 0;
}

export async function getZoneZipsByZone(conn: Connection, zoneId: number): Promise<ZoneZip[]> {
  const query = `
    SELECT zone_zip_id AS zoneZipId, zone_id AS zoneId, zip_code AS zipCode, range_start AS rangeStart, range_end AS rangeEnd
    FROM RANDM_TST.ZONE_ZIP
    WHERE zone_id = ?
    ORDER BY zone_zip_id ASC
  `;
  const result = (await conn.query(query, [zoneId])) as ZoneZip[];
  return result;
}

export async function getAllZoneZips(conn: Connection): Promise<ZoneZip[]> {
  const query = `
    SELECT zone_zip_id AS zoneZipId, zone_id AS zoneId, zip_code AS zipCode, range_start AS rangeStart, range_end AS rangeEnd
    FROM RANDM_TST.ZONE_ZIP
    ORDER BY zone_zip_id ASC
  `;
  const result = (await conn.query(query)) as ZoneZip[];
  return result;
}
