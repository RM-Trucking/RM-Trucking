import { Connection } from 'odbc';
import {
    CustomerRateWarehouse,
    CustomerRate,
    CustomerRateDetail,
    StationRateMap,
    CustomerTransportRateSearch,
} from '../../entities/maintenance';
import { SCHEMA } from '../../config/db2';

// -------------------- Warehouse Rate --------------------
export async function createCustomerWarehouseRate(conn: Connection, rate: Partial<CustomerRateWarehouse>): Promise<number> {
    const query = `
    SELECT "rateId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Customer_Rate_Warehouse"
      ("minRate","ratePerPound","maxRate","department","warehouse")
      VALUES (?, ?, ?, ?, ?)
    )
  `;
    const params: (string | number)[] = [
        rate.minRate ?? 0,
        rate.ratePerPound ?? 0,
        rate.maxRate ?? 0,
        rate.department ?? '',
        rate.warehouse ?? ''
    ];
    const result = await conn.query(query, params);
    return (result as any[])[0]?.rateId;
}

export async function getCustomerWarehouseRateById(conn: Connection, rateId: number): Promise<CustomerRateWarehouse | null> {
    const query = `SELECT * FROM ${SCHEMA}."Customer_Rate_Warehouse" WHERE "rateId" = ?`;
    const result = await conn.query(query, [rateId]) as any[];
    return result.length ? (result[0] as CustomerRateWarehouse) : null;
}

export async function updateCustomerWarehouseRate(conn: Connection, rateId: number, rate: Partial<CustomerRateWarehouse>): Promise<void> {
    const query = `
    UPDATE ${SCHEMA}."Customer_Rate_Warehouse"
    SET 
      "minRate" = COALESCE(?, "minRate"),
      "ratePerPound" = COALESCE(?, "ratePerPound"),
      "maxRate" = COALESCE(?, "maxRate"),
      "department" = COALESCE(?, "department"),
      "warehouse" = COALESCE(?, "warehouse")
    WHERE "rateId" = ?
  `;
    const params = [
        rate.minRate ?? 0,
        rate.ratePerPound ?? 0,
        rate.maxRate ?? 0,
        rate.department ?? '',
        rate.warehouse ?? '',
        rateId
    ];
    await conn.query(query, params);
}

export async function deleteCustomerWarehouseRate(conn: Connection, rateId: number): Promise<void> {
    const query = `DELETE FROM ${SCHEMA}."Customer_Rate_Warehouse" WHERE "rateId" = ?`;
    await conn.query(query, [rateId]);
}


// -------------------- Transport Rate --------------------
export async function createCustomerTransportRate(
    conn: Connection,
    originZoneId: number,
    destinationZoneId: number,
    userId: number
): Promise<number> {
    const query = `
    SELECT "rateId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Customer_Rate"
      ("originZoneId","destinationZoneId","createdAt","createdBy","updatedAt","updatedBy","activeStatus")
      VALUES (?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, 'Y')
    )
  `;
    const result = await conn.query(query, [originZoneId, destinationZoneId, userId, userId]) as any[];
    return result[0]?.rateId;
}


export async function createCustomerTransportRateDetail(conn: Connection, rateId: number, rateField: string, chargeValue: number, perUnitFlag: 'Y' | 'N'): Promise<number> {
    const query = `
    SELECT "rateDetailId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Customer_Rate_Detail"
      ("rateId","rateField","chargeValue","perUnitFlag")
      VALUES (?, ?, ?, ?)
    )
  `;
    const result = await conn.query(query, [rateId, rateField, chargeValue, perUnitFlag]) as any[];
    return result[0]?.rateDetailId;
}

export async function getCustomerTransportRateById(conn: Connection, rateId: number): Promise<CustomerRate | null> {
    const query = `SELECT * FROM ${SCHEMA}."Customer_Rate" WHERE "rateId" = ?`;
    const result = await conn.query(query, [rateId]) as any[];
    return result.length ? (result[0] as CustomerRate) : null;
}

export async function getCustomerTransportRateDetails(conn: Connection, rateId: number): Promise<CustomerRateDetail[]> {
    const query = `SELECT * FROM ${SCHEMA}."Customer_Rate_Detail" WHERE "rateId" = ?`;
    const result = await conn.query(query, [rateId]) as any[];
    return result as CustomerRateDetail[];
}

export async function updateCustomerRateEntityAndNoteThread(
    conn: Connection,
    customerRateId: number,
    entityId: number,
    noteThreadId: number
): Promise<void> {
    const query = `
        UPDATE ${SCHEMA}."Customer_Rate"
        SET "entityId" = ?, "noteThreadId" = ?
        WHERE "customerRateId" = ?
    `;
    await conn.query(query, [entityId, noteThreadId, customerRateId]);
}


export async function deleteCustomerTransportRate(conn: Connection, rateId: number): Promise<void> {
    await conn.query(`DELETE FROM ${SCHEMA}."Customer_Rate_Detail" WHERE "rateId" = ?`, [rateId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Customer_Rate" WHERE "rateId" = ?`, [rateId]);
}


// -------------------- Station Rate Map --------------------
export async function assignRateToStation(conn: Connection, stationId: number, rateId: number, rateType: 'WAREHOUSE' | 'TRANSPORT', assignedBy: string): Promise<number> {
    const query = `
    SELECT "stationRateId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Station_Rate_Map"
      ("stationId","rateId","rateType","assignedBy","assignedAt")
      VALUES (?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE))
    )
  `;
    const result = await conn.query(query, [stationId, rateId, rateType, assignedBy]) as any[];
    return result[0]?.stationRateId;
}

// export async function getStationRates(
//     conn: Connection,
//     stationId: number,
//     rateType?: 'WAREHOUSE' | 'TRANSPORT',
//     search?: CustomerTransportRateSearch
// ): Promise<any[]> {
//     let query = `
//     SELECT m."stationRateId",
//            m."stationId",
//            m."rateId",
//            m."rateType",
//            m."assignedBy",
//            m."assignedAt",
//            u."userName",
//            w."minRate", w."maxRate", w."ratePerPound", w."department", w."warehouse",
//            t."originZoneId", t."destinationZoneId",
//            oz."zoneName" AS "originZoneName",
//            dz."zoneName" AS "destinationZoneName"
//     FROM ${SCHEMA}."Station_Rate_Map" m
//     LEFT JOIN ${SCHEMA}."User" u ON m."assignedBy" = u."userId"
//     LEFT JOIN ${SCHEMA}."Customer_Rate_Warehouse" w 
//       ON m."rateType" = 'WAREHOUSE' AND m."rateId" = w."rateId"
//     LEFT JOIN ${SCHEMA}."Customer_Rate" t 
//       ON m."rateType" = 'TRANSPORT' AND m."rateId" = t."rateId"
//     LEFT JOIN ${SCHEMA}."Zone" oz ON t."originZoneId" = oz."zoneId"
//     LEFT JOIN ${SCHEMA}."Zone" dz ON t."destinationZoneId" = dz."zoneId"
//     WHERE m."stationId" = ?
//   `;
//     const params: (string | number)[] = [stationId];

//     if (rateType) {
//         query += ` AND m."rateType" = ?`;
//         params.push(rateType);
//     }

//     const result = await conn.query(query, params as any[]) as any[];
//     return result;
// }

export async function getStationRates(
    conn: Connection,
    stationId: number,
    rateType?: 'WAREHOUSE' | 'TRANSPORT',
    search?: CustomerTransportRateSearch
): Promise<any[]> {
    let query = `
    SELECT m."stationRateId",
           m."stationId",
           m."rateId",
           m."rateType",
           m."assignedBy",
           m."assignedAt",
           u."userName",
           w."minRate", w."maxRate", w."ratePerPound", w."department", w."warehouse",
           t."originZoneId", t."destinationZoneId",
           oz."zoneName" AS "originZoneName",
           dz."zoneName" AS "destinationZoneName"
    FROM ${SCHEMA}."Station_Rate_Map" m
    LEFT JOIN ${SCHEMA}."User" u ON m."assignedBy" = u."userId"
    LEFT JOIN ${SCHEMA}."Customer_Rate_Warehouse" w 
      ON m."rateType" = 'WAREHOUSE' AND m."rateId" = w."rateId"
    LEFT JOIN ${SCHEMA}."Customer_Rate" t 
      ON m."rateType" = 'TRANSPORT' AND m."rateId" = t."rateId"
    LEFT JOIN ${SCHEMA}."Zone" oz ON t."originZoneId" = oz."zoneId"
    LEFT JOIN ${SCHEMA}."Zone" dz ON t."destinationZoneId" = dz."zoneId"
    WHERE m."stationId" = ?
  `;

    const params: (string | number)[] = [Number(stationId)];

    if (rateType) {
        query += ` AND m."rateType" = ?`;
        params.push(rateType);
    }

    if (search?.originZoneId) {
        query += ` AND t."originZoneId" = ?`;
        params.push(Number(search.originZoneId));
    }
    if (search?.destinationZoneId) {
        query += ` AND t."destinationZoneId" = ?`;
        params.push(Number(search.destinationZoneId));
    }

    const buildZipConditions = (field: string, value?: string) => {
        if (!value) return null;
        const parts = value.split(',').map(p => p.trim()).filter(Boolean);
        if (!parts.length) return null;

        const subConditions: string[] = [];
        const subParams: (string | number)[] = [];

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(r => Number(r.trim()));
                subConditions.push(`EXISTS (
                    SELECT 1 FROM ${SCHEMA}."Zone_Zip" z
                    WHERE z."zoneId" = ${field}
                    AND z."rangeStart" = ? AND z."rangeEnd" = ?
                )`);
                subParams.push(start, end);
            } else {
                subConditions.push(`EXISTS (
                    SELECT 1 FROM ${SCHEMA}."Zone_Zip" z
                    WHERE z."zoneId" = ${field}
                    AND z."zipCode" = ?
                )`);
                subParams.push(part); // keep as string
            }
        }
        return { clause: `(${subConditions.join(' OR ')})`, params: subParams };
    };

    const originZipFilter = buildZipConditions('t."originZoneId"', search?.originZipOrRange);
    if (originZipFilter) {
        query += ` AND ${originZipFilter.clause}`;
        params.push(...originZipFilter.params);
    }

    const destZipFilter = buildZipConditions('t."destinationZoneId"', search?.destinationZipOrRange);
    if (destZipFilter) {
        query += ` AND ${destZipFilter.clause}`;
        params.push(...destZipFilter.params);
    }

    console.log('Query:', query);
    console.log('Params:', params.map(p => [p, typeof p]));

    const result = await conn.query(query, params) as any[];
    return result;
}




export async function deleteStationRateMap(conn: Connection, stationRateId: number): Promise<void> {
    const query = `DELETE FROM ${SCHEMA}."Station_Rate_Map" WHERE "stationRateId" = ?`;
    await conn.query(query, [stationRateId]);
}

// -------------------- Transport Rate Updates --------------------

// Update base transport rate (origin/destination zones)
export async function updateCustomerTransportRate(
    conn: Connection,
    rateId: number,
    originZoneId?: number,
    destinationZoneId?: number,
    userId?: number
): Promise<void> {
    const query = `
    UPDATE ${SCHEMA}."Customer_Rate"
    SET 
      "originZoneId" = COALESCE(?, "originZoneId"),
      "destinationZoneId" = COALESCE(?, "destinationZoneId"),
      "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE),
      "updatedBy" = COALESCE(?, "updatedBy")
    WHERE "rateId" = ?
  `;
    const params = [originZoneId ?? null, destinationZoneId ?? null, userId ?? null, rateId] as any[];
    await conn.query(query, params);
}

// Delete all transport rate details for a given rate
export async function deleteCustomerTransportRateDetails(
    conn: Connection,
    rateId: number
): Promise<void> {
    const query = `DELETE FROM ${SCHEMA}."Customer_Rate_Detail" WHERE "rateId" = ?`;
    await conn.query(query, [rateId]);
}


// Warehouse Rate List with search + pagination + total
export async function listCustomerWarehouseRates(
    conn: Connection,
    search?: string,
    page: number = 1,
    pageSize: number = 10
): Promise<{ data: CustomerRateWarehouse[]; total: number }> {
    const offset = (page - 1) * pageSize;
    let baseQuery = `FROM ${SCHEMA}."Customer_Rate_Warehouse" WHERE 1=1`;
    const params: (string | number)[] = [];

    if (search) {
        baseQuery += ` AND (LOWER("department") LIKE ? OR LOWER("warehouse") LIKE ?)`;
        params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    const listQuery = `SELECT * ${baseQuery} ORDER BY "rateId" DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
    const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;

    const list = await conn.query(listQuery, [...params, offset, pageSize] as any[]) as any[];
    const count = await conn.query(countQuery, params as any[]) as any[];

    return { data: list as CustomerRateWarehouse[], total: count[0].TOTAL };
}


// Transport Rate List with search + pagination + total
export async function listCustomerTransportRates(
    conn: Connection,
    search: CustomerTransportRateSearch,
    page: number,
    pageSize: number
): Promise<{ data: CustomerRate[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (search.originZoneId) {
        conditions.push(`"originZoneId" = ?`);
        params.push(Number(search.originZoneId));
    }
    if (search.destinationZoneId) {
        conditions.push(`"destinationZoneId" = ?`);
        params.push(Number(search.destinationZoneId));
    }

    const buildZipConditions = (zoneField: string, value?: string) => {
        if (!value) return null;
        const parts = value.split(',').map(p => p.trim()).filter(Boolean);
        if (!parts.length) return null;

        const subConditions: string[] = [];
        const subParams: (string | number)[] = [];

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(r => Number(r.trim()));
                // Use BETWEEN to check if any zip in the range falls inside Zone_Zip ranges
                subConditions.push(`EXISTS (
                    SELECT 1 FROM ${SCHEMA}."Zone_Zip" z
                    WHERE z."zoneId" = ${zoneField}
                    AND z."zipCode" BETWEEN ? AND ?
                )`);
                subParams.push(start, end);
            } else {
                subConditions.push(`EXISTS (
                    SELECT 1 FROM ${SCHEMA}."Zone_Zip" z
                    WHERE z."zoneId" = ${zoneField}
                    AND z."zipCode" = ?
                )`);
                subParams.push(part);
            }
        }
        return { clause: `(${subConditions.join(' OR ')})`, params: subParams };
    };

    const originZipFilter = buildZipConditions('"originZoneId"', search.originZipOrRange);
    if (originZipFilter) {
        conditions.push(originZipFilter.clause);
        params.push(...originZipFilter.params);
    }

    const destZipFilter = buildZipConditions('"destinationZoneId"', search.destinationZipOrRange);
    if (destZipFilter) {
        conditions.push(destZipFilter.clause);
        params.push(...destZipFilter.params);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
        SELECT * FROM ${SCHEMA}."Customer_Rate"
        ${whereClause}
        ORDER BY "rateId"
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    `;
    params.push((page - 1) * pageSize, pageSize);

    console.log('Query:', query);
    console.log('Params:', params);

    const result = await conn.query(query, params) as any[];
    const totalResult = await conn.query(
        `SELECT COUNT(*) as total FROM ${SCHEMA}."Customer_Rate" ${whereClause}`,
        params.slice(0, -2)
    ) as any[];

    return { data: result as CustomerRate[], total: totalResult[0].TOTAL };
}


export async function countCustomerRatesForZone(conn: Connection, zoneId: number): Promise<number> {
    const query = `
    SELECT COUNT(*) AS total
    FROM ${SCHEMA}."Customer_Rate"
    WHERE "activeStatus" = 'Y'
      AND ("originZoneId" = ? OR "destinationZoneId" = ?)
  `;
    const result = await conn.query(query, [zoneId, zoneId]) as any[];
    return result[0]?.TOTAL || 0;
}

export async function listCustomerTransportRatesByZone(
    conn: Connection,
    zoneId: number,
    limit: number,
    offset: number
): Promise<{ data: CustomerRate[]; total: number }> {
    const query = `
    SELECT * FROM ${SCHEMA}."Customer_Rate"
    WHERE "activeStatus" = 'Y'
      AND ("originZoneId" = ? OR "destinationZoneId" = ?)
    ORDER BY "rateId" DESC
    LIMIT ? OFFSET ?
  `;
    const data = await conn.query(query, [zoneId, zoneId, limit, offset]) as any[];

    const totalQuery = `
    SELECT COUNT(*) AS total
    FROM ${SCHEMA}."Customer_Rate"
    WHERE "activeStatus" = 'Y'
      AND ("originZoneId" = ? OR "destinationZoneId" = ?)
  `;
    const totalResult = await conn.query(totalQuery, [zoneId, zoneId]) as any[];

    return { data: data as CustomerRate[], total: totalResult[0]?.TOTAL || 0 };
}