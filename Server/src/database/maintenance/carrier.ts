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
       "createdAt","createdBy","entityId","noteThreadId", "corporateBillingSame", "corporatePhoneNumber", "isParcelCarrier", "isLTLCarrier", "isAirportCarrier")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, ?, ?, ?, ?, ?, ?, ?)
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
        carrier.noteThreadId,
        carrier.corporateBillingSame ?? 'N',
        carrier.corporatePhoneNumber,
        carrier.isParcelCarrier ?? 'N',
        carrier.isLTLCarrier ?? 'N',
        carrier.isAirportCarrier ?? 'N'
    ].map(v => v === undefined ? '' : v);

    const result = await conn.query(insertQuery, params as any[]) as any[];
    return (result as any)?.[0]?.carrierId;
}

export async function getCarrierById(conn: Connection, carrierId: number): Promise<Carrier | null> {
    const query = `SELECT * FROM ${SCHEMA}."Carrier" WHERE "carrierId" = ?`;
    const result = await conn.query(query, [carrierId]) as any[];
    return result.length ? (result[0] as Carrier) : null;
}

export async function listCarriers(
    conn: Connection,
    limit: number,
    offset: number,
    searchTerm?: string,
    status?: string
): Promise<Carrier[]> {
    let query = `SELECT * FROM ${SCHEMA}."Carrier" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("carrierName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    if (status) {
        query += ` AND UPPER("carrierStatus") = UPPER(?)`;
        params.push(status);
    }


    query += ` ORDER BY "carrierId" DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await conn.query(query, params) as any[];
    return result as Carrier[];
}

export async function countCarriers(
    conn: Connection,
    searchTerm?: string,
    status?: string
): Promise<number> {
    let query = `SELECT COUNT(*) AS TOTAL FROM ${SCHEMA}."Carrier" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("carrierName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    if (status) {
        query += ` AND UPPER("carrierStatus") = UPPER(?)`;
        params.push(status);
    }

    const result = await conn.query(query, params) as any[];
    return result[0]?.TOTAL || 0;
}


export async function updateCarrier(conn: Connection, carrierId: number, updates: Partial<Carrier>): Promise<void> {

    console.log(updates);


    const fields: string[] = [];
    const params: any[] = [];

    if (updates.carrierName !== undefined) { fields.push(`"carrierName" = ?`); params.push(updates.carrierName); }
    if (updates.carrierType !== undefined) { fields.push(`"carrierType" = ?`); params.push(updates.carrierType); }
    if (updates.carrierStatus !== undefined) { fields.push(`"carrierStatus" = ?`); params.push(updates.carrierStatus); }
    if (updates.tsaCertified !== undefined) { fields.push(`"tsaCertified" = ?`); params.push(updates.tsaCertified); }
    if (updates.ustDotNo !== undefined) { fields.push(`"ustDotNo" = ?`); params.push(updates.ustDotNo); }
    if (updates.mcnNo !== undefined) { fields.push(`"mcnNo" = ?`); params.push(updates.mcnNo); }
    if (updates.insuranceExpiry !== undefined) {
        fields.push(`"insuranceExpiry" = ?`);
        params.push(
            updates.insuranceExpiry instanceof Date
                ? updates.insuranceExpiry.toISOString().slice(0, 10)
                : updates.insuranceExpiry
        );
    }
    if (updates.tariffRenewalDate !== undefined) {
        fields.push(`"tariffRenewalDate" = ?`);
        params.push(
            updates.tariffRenewalDate instanceof Date
                ? updates.tariffRenewalDate.toISOString().slice(0, 10)
                : updates.tariffRenewalDate
        );
    }
    if (updates.totalShipments !== undefined) { fields.push(`"totalShipments" = ?`); params.push(updates.totalShipments); }
    if (updates.rmOnTimePercent !== undefined) { fields.push(`"rmOnTimePercent" = ?`); params.push(updates.rmOnTimePercent); }
    if (updates.lateShipments !== undefined) { fields.push(`"lateShipments" = ?`); params.push(updates.lateShipments); }
    if (updates.salesRepName !== undefined) { fields.push(`"salesRepName" = ?`); params.push(updates.salesRepName); }
    if (updates.salesRepPhone !== undefined) { fields.push(`"salesRepPhone" = ?`); params.push(updates.salesRepPhone); }
    if (updates.salesRepEmail !== undefined) { fields.push(`"salesRepEmail" = ?`); params.push(updates.salesRepEmail); }
    if (updates.corporateBillingSame !== undefined) { fields.push(`"corporateBillingSame" = ?`); params.push(updates.corporateBillingSame); }
    if (updates.corporatePhoneNumber !== undefined) { fields.push(`"corporatePhoneNumber" = ?`); params.push(updates.corporatePhoneNumber); }
    if (updates.isParcelCarrier !== undefined) { fields.push(`"isParcelCarrier" = ?`); params.push(updates.isParcelCarrier); }
    if (updates.isLTLCarrier !== undefined) { fields.push(`"isLTLCarrier" = ?`); params.push(updates.isLTLCarrier); }
    if (updates.isAirportCarrier !== undefined) { fields.push(`"isAirportCarrier" = ?`); params.push(updates.isAirportCarrier); }
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
           c."totalShipments", c."rmOnTimePercent", c."lateShipments", c."salesRepName", c."salesRepPhone", c."salesRepEmail", c."corporateBillingSame",
           c."createdAt", c."createdBy", c."updatedAt", c."updatedBy",
           c."noteThreadId", c."entityId", c."corporatePhoneNumber", c."isParcelCarrier"
    FROM ${SCHEMA}."Terminal_Rate_Map" srm
    JOIN ${SCHEMA}."Terminal" st ON srm."terminalId" = st."terminalId"
    JOIN ${SCHEMA}."Carrier" c ON st."carrierId" = c."carrierId"
    WHERE srm."rateId" = ?
  `;
    const result = await conn.query(query, [rateId]) as any[];
    return result as Carrier[];
}

export async function countCarriersByRateId(conn: Connection, rateId: number): Promise<number> {
    const query = `
    SELECT COUNT(st."terminalId") AS total
    FROM ${SCHEMA}."Terminal_Rate_Map" srm
    JOIN ${SCHEMA}."Terminal" st ON srm."terminalId" = st."terminalId"
    JOIN ${SCHEMA}."Carrier" c ON st."carrierId" = c."carrierId"
    WHERE srm."rateId" = ?
  `;
    const result = await conn.query(query, [rateId]) as any[];
    return result.length ? result[0].TOTAL : 0;
}

export async function checkCarrierUniqueFields(
    conn: Connection,
    { carrierName }:
        { carrierName?: string },
    terminalId?: number // optional, so we can exclude current record on update
): Promise<string | null> {
    const queries: string[] = [];
    const params: (string | number)[] = [];

    if (carrierName) {
        queries.push(`SELECT 'carrierName' AS "conflictField" FROM "${SCHEMA}"."Carrier" WHERE "carrierName" = ? AND "carrierId" <> ?`);
        params.push(carrierName, terminalId ?? -1);
    }

    if (queries.length === 0) return null;

    const query = queries.join(' UNION ALL ');

    const result = await conn.query(query, params) as { conflictField: string }[];
    return result.length ? result[0].conflictField : null;
}

export async function getCarrierTerminalDropdown(
    conn: Connection,
    search: string
): Promise<{ terminalId: number; terminalName: string; carrierId: number; carrierName: string, terminalEntityId: number, terminalEmail: string | null }[]> {
    let query = `
    SELECT t."terminalId", t."terminalName", c."carrierId", c."carrierName", t."entityId" as "terminalEntityId", t."email" AS "terminalEmail"
    FROM ${SCHEMA}."Terminal" t
    JOIN ${SCHEMA}."Carrier" c ON t."carrierId" = c."carrierId"
    WHERE c."carrierStatus" = 'Active' OR c."carrierStatus" = 'Incomplete' AND t."activeStatus" = 'Y'
  `;
    const params: any[] = [];

    if (search && search.trim().length > 0) {
        query += ` AND LOWER(c."carrierName") LIKE ?`;
        params.push(`%${search.toLowerCase()}%`);
    }

    query += ` ORDER BY c."carrierName" ASC`;

    const result = await conn.query(query, params) as any[];
    return result;
}

export async function getTerminalAddressByTerminalId(
    conn: Connection,
    terminalId: number): Promise<{ addressLine1: string; addressLine2: string | null; city: string; state: string; zipCode: string } | null> {
    const query = `
    SELECT "line1" as "addressLine1", "line2" as "addressLine2", "city", "state", "zipCode"
    FROM ${SCHEMA}."Address"
    LEFT JOIN ${SCHEMA}."Entity_Address_Map" eam ON "Address"."addressId" = eam."addressId"
    LEFT JOIN ${SCHEMA}."Terminal" t ON eam."entityId" = t."entityId"
    WHERE eam."addressRole" = 'Primary'
      AND t."terminalId" = ?
  `;
    const result = await conn.query(query, [terminalId]) as any[];
    return result.length ? result[0] : null;
}


export async function getPersonnelEmail(
    conn: Connection,
    terminalId: number
): Promise<{
    personnelId: number;
    email: string;
}[]> {
    let query = `
    SELECT DISTINCT p."personnelId",
           p."email" 
    FROM ${SCHEMA}."Carrier_Personnel" p
    JOIN ${SCHEMA}."Terminal" t ON p."terminalId" = t."terminalId"
    WHERE t."terminalId" = ?
      AND t."activeStatus" = 'Y'
      AND t."email" IS NOT NULL

    ORDER BY "personnelId", "email"
    `;

    const params: any[] = [terminalId];

    const result = await conn.query(query, params) as any[];
    return result;
}
