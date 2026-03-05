// carrierDB.ts

import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2"; // adjust import as needed
import { Carrier } from "../../entities/maintenance/Carrier";

export async function createCarrier(conn: Connection, carrier: Partial<Carrier>): Promise<number> {
    const insertQuery = `
    SELECT "carrierId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Carrier"
      ("carrierName","carrierType","carrierStatus","tsaCertified","ustDotNo","mcnNo",
       "insuranceExpiry","tariffRenewalDate","totalShipments","rmOnTimePercent","lateShipments",
       "salesRepName","salesRepPhone","salesRepEmail",
       "createdAt","createdBy","entityId","noteThreadId")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, ?, ?)
    )
  `;

    const params = [
        carrier.carrierName,
        carrier.carrierType,
        carrier.carrierStatus,
        carrier.tsaCertified ?? 'N',
        carrier.ustDotNo,
        carrier.mcnNo,
        carrier.insuranceExpiry instanceof Date ? carrier.insuranceExpiry.toISOString().slice(0, 10) : carrier.insuranceExpiry,
        carrier.tariffRenewalDate instanceof Date ? carrier.tariffRenewalDate.toISOString().slice(0, 10) : carrier.tariffRenewalDate,
        carrier.totalShipments ?? 0,
        carrier.rmOnTimePercent ?? 0,
        carrier.lateShipments ?? 0,
        carrier.salesRepName,
        carrier.salesRepPhone,
        carrier.salesRepEmail,
        carrier.createdBy,
        carrier.entityId,
        carrier.noteThreadId
    ].map(v => v === undefined || v === null ? '' : v);

    const result = await conn.query(insertQuery, params);
    return (result as any)?.[0]?.carrierId;
}

export async function getCarrierById(conn: Connection, carrierId: number): Promise<Carrier | null> {
    const query = `SELECT * FROM ${SCHEMA}."Carrier" WHERE "carrierId" = ?`;
    const result = await conn.query(query, [carrierId]) as any[];
    return result.length ? (result[0] as Carrier) : null;
}

export async function listCarriers(conn: Connection, limit: number, offset: number, searchTerm?: string): Promise<Carrier[]> {
    let query = `SELECT * FROM ${SCHEMA}."Carrier" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("carrierName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    query += ` ORDER BY "carrierId" DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await conn.query(query, params) as any[];
    return result as Carrier[];
}

export async function countCarriers(conn: Connection, searchTerm?: string): Promise<number> {
    let query = `SELECT COUNT(*) AS TOTAL FROM ${SCHEMA}."Carrier" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("carrierName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    const result = await conn.query(query, params) as any[];
    return result[0]?.TOTAL || 0;
}

export async function updateCarrier(conn: Connection, carrierId: number, updates: Partial<Carrier>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.carrierName !== undefined) { fields.push(`"carrierName" = ?`); params.push(updates.carrierName); }
    if (updates.carrierType !== undefined) { fields.push(`"carrierType" = ?`); params.push(updates.carrierType); }
    if (updates.carrierStatus !== undefined) { fields.push(`"carrierStatus" = ?`); params.push(updates.carrierStatus); }
    if (updates.tsaCertified !== undefined) { fields.push(`"tsaCertified" = ?`); params.push(updates.tsaCertified); }
    if (updates.ustDotNo !== undefined) { fields.push(`"ustDotNo" = ?`); params.push(updates.ustDotNo); }
    if (updates.mcnNo !== undefined) { fields.push(`"mcnNo" = ?`); params.push(updates.mcnNo); }
    if (updates.insuranceExpiry !== undefined) { fields.push(`"insuranceExpiry" = ?`); params.push(updates.insuranceExpiry); }
    if (updates.tariffRenewalDate !== undefined) { fields.push(`"tariffRenewalDate" = ?`); params.push(updates.tariffRenewalDate); }
    if (updates.totalShipments !== undefined) { fields.push(`"totalShipments" = ?`); params.push(updates.totalShipments); }
    if (updates.rmOnTimePercent !== undefined) { fields.push(`"rmOnTimePercent" = ?`); params.push(updates.rmOnTimePercent); }
    if (updates.lateShipments !== undefined) { fields.push(`"lateShipments" = ?`); params.push(updates.lateShipments); }
    if (updates.salesRepName !== undefined) { fields.push(`"salesRepName" = ?`); params.push(updates.salesRepName); }
    if (updates.salesRepPhone !== undefined) { fields.push(`"salesRepPhone" = ?`); params.push(updates.salesRepPhone); }
    if (updates.salesRepEmail !== undefined) { fields.push(`"salesRepEmail" = ?`); params.push(updates.salesRepEmail); }

    if (!fields.length) return;

    fields.push(`"updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)`);
    fields.push(`"updatedBy" = ?`);
    params.push(updates.updatedBy);

    const query = `UPDATE ${SCHEMA}."Carrier" SET ${fields.join(", ")} WHERE "carrierId" = ?`;
    params.push(carrierId);

    await conn.query(query, params);
}

export async function deleteCarrier(conn: Connection, carrierId: number): Promise<void> {
    const query = `DELETE FROM ${SCHEMA}."Carrier" WHERE "carrierId" = ?`;
    await conn.query(query, [carrierId]);
}

export async function getCarriersByRateId(conn: Connection, rateId: number): Promise<Carrier[]> {
    const query = `
    SELECT c."carrierId", c."carrierName", c."carrierType", c."carrierStatus", c."tsaCertified", c."ustDotNo", c."mcnNo", c."insuranceExpiry", c."tariffRenewalDate",
           c."totalShipments", c."rmOnTimePercent", c."lateShipments", c."salesRepName", c."salesRepPhone", c."salesRepEmail",
           c."createdAt", c."createdBy", c."updatedAt", c."updatedBy",
           c."noteThreadId", c."entityId"
    FROM ${SCHEMA}."Station_Rate_Map" srm
    JOIN ${SCHEMA}."Station" st ON srm."stationId" = st."stationId"
    JOIN ${SCHEMA}."Carrier" c ON st."carrierId" = c."carrierId"
    WHERE srm."rateId" = ?
  `;
    const result = await conn.query(query, [rateId]) as any[];
    return result as Carrier[];
}

export async function countCarriersByRateId(conn: Connection, rateId: number): Promise<number> {
    const query = `
    SELECT COUNT(DISTINCT c."carrierId") AS total
    FROM ${SCHEMA}."Station_Rate_Map" srm
    JOIN ${SCHEMA}."Station" st ON srm."stationId" = st."stationId"
    JOIN ${SCHEMA}."Carrier" c ON st."carrierId" = c."carrierId"
    WHERE srm."rateId" = ?
  `;
    const result = await conn.query(query, [rateId]) as any[];
    return result.length ? result[0].TOTAL : 0;
}