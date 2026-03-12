import { Connection } from 'odbc';
import {
    CreateCustomerFuelSurchargeRequest,
    UpdateCustomerFuelSurchargeRequest,
    CustomerFuelSurchargeResponse,
    CustomerFuelSurchargeStation
} from '../../entities/maintenance/CustomerFuelSurcharge';
import { SCHEMA } from '../../config/db2';

// ✅ Insert Customer Fuel Surcharge and return full DB row + stations
export async function insertCustomerFuelSurcharge(
    conn: Connection,
    body: CreateCustomerFuelSurchargeRequest,
    createdBy: number
): Promise<CustomerFuelSurchargeResponse> {
    const query = `
    SELECT *
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Fuel_Surcharge_Customer"
      ("customerId","customerName","fuelPercentage","effectiveDate","effectiveTime",
       "expireDate","expireTime","createdBy","createdAt")
      VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, CURRENT_TIMESTAMP)
    )
  `;

    const result = await conn.query(query, [
        body.customerId,
        body.customerName,
        body.fuelPercentage,
        body.effectiveDate,
        body.effectiveTime,
        createdBy
    ] as any[]);

    if (!result || result?.length === 0) {
        throw new Error('Insert failed, no row returned');
    }

    const surchargeRow = result[0] as CustomerFuelSurchargeResponse;
    const customerFuelSurchargeId = surchargeRow.customerFuelSurchargeId;

    // Insert stations
    for (const station of body.stations) {
        await conn.query(
            `INSERT INTO ${SCHEMA}."Fuel_Surcharge_Customer_Station"
       ("customerFuelSurchargeId","stationId","stationName")
       VALUES (?, ?, ?)`,
            [customerFuelSurchargeId, station.stationId, station.stationName]
        );
    }

    // Fetch stations back from DB (with auto IDs)
    const stations = await conn.query(
        `SELECT * FROM ${SCHEMA}."Fuel_Surcharge_Customer_Station" WHERE "customerFuelSurchargeId" = ?`,
        [customerFuelSurchargeId]
    ) as CustomerFuelSurchargeStation[];

    return {
        ...surchargeRow,
        stations
    };
}

// ✅ Select latest surcharge for a customer
export async function selectLatestCustomerFuelSurcharge(
    conn: Connection,
    customerId: number
): Promise<CustomerFuelSurchargeResponse | null> {
    const query = `
    SELECT *
    FROM ${SCHEMA}."Fuel_Surcharge_Customer"
    WHERE "customerId" = ?
    ORDER BY "effectiveDate" DESC, "effectiveTime" DESC
    FETCH FIRST 1 ROWS ONLY
  `;
    const result = await conn.query(query, [customerId]) as CustomerFuelSurchargeResponse[];
    return result.length ? result[0] : null;
}

// ✅ Expire an existing surcharge
export async function expireCustomerFuelSurcharge(
    conn: Connection,
    surchargeId: number,
    expireDate: Date,
    expireTime: string
): Promise<void> {
    const query = `
    UPDATE ${SCHEMA}."Fuel_Surcharge_Customer"
    SET "expireDate" = ?, "expireTime" = ?
    WHERE "customerFuelSurchargeId" = ?
  `;
    await conn.query(query, [expireDate, expireTime, surchargeId] as any[]);
}



// ✅ Select All Customer Fuel Surcharges (with pagination)
export async function selectAllCustomerFuelSurcharges(
    conn: Connection,
    page: number,
    pageSize: number
): Promise<{ surcharges: CustomerFuelSurchargeResponse[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const query = `
    SELECT *
    FROM ${SCHEMA}."Fuel_Surcharge_Customer"
    ORDER BY "effectiveDate" DESC
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
  `;
    const totalQuery = `SELECT COUNT(*) AS total FROM ${SCHEMA}."Fuel_Surcharge_Customer"`;

    const surcharges = await conn.query(query, [offset, pageSize]) as CustomerFuelSurchargeResponse[];
    const totalResult = await conn.query(totalQuery) as any[];
    const total = totalResult[0].total;

    // Attach stations for each surcharge
    for (const surcharge of surcharges) {
        const stations = await conn.query(
            `SELECT * FROM ${SCHEMA}."Fuel_Surcharge_Customer_Station" WHERE "customerFuelSurchargeId" = ?`,
            [surcharge.customerFuelSurchargeId]
        ) as CustomerFuelSurchargeStation[];
        surcharge.stations = stations;
    }

    return { surcharges, total };
}

// ✅ Select Customer Fuel Surcharge by ID
export async function selectCustomerFuelSurchargeById(
    conn: Connection,
    id: number
): Promise<CustomerFuelSurchargeResponse | null> {
    const query = `SELECT * FROM ${SCHEMA}."Fuel_Surcharge_Customer" WHERE "customerFuelSurchargeId" = ?`;
    const result = await conn.query(query, [id]) as CustomerFuelSurchargeResponse[];

    if (!result.length) return null;

    const surcharge = result[0];
    const stations = await conn.query(
        `SELECT * FROM ${SCHEMA}."Fuel_Surcharge_Customer_Station" WHERE "customerFuelSurchargeId" = ?`,
        [id]
    ) as CustomerFuelSurchargeStation[];

    surcharge.stations = stations;
    return surcharge;
}

// ✅ Update Customer Fuel Surcharge + Stations
export async function updateCustomerFuelSurcharge(
    conn: Connection,
    id: number,
    body: UpdateCustomerFuelSurchargeRequest,
    updatedBy: number
): Promise<void> {
    const query = `
    UPDATE ${SCHEMA}."Fuel_Surcharge_Customer"
    SET "fuelPercentage" = COALESCE(?, "fuelPercentage"),
        "effectiveDate" = COALESCE(?, "effectiveDate"),
        "effectiveTime" = COALESCE(?, "effectiveTime"),
        "updatedBy" = ?,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "customerFuelSurchargeId" = ?
  `;

    await conn.query(query, [
        body.fuelPercentage || null,
        body.effectiveDate || null,
        body.effectiveTime || null,
        updatedBy,
        id
    ] as any[]);

    // If stations provided, replace them
    if (body.stations) {
        await conn.query(
            `DELETE FROM ${SCHEMA}."Fuel_Surcharge_Customer_Station" WHERE "customerFuelSurchargeId" = ?`,
            [id]
        );

        for (const station of body.stations) {
            await conn.query(
                `INSERT INTO ${SCHEMA}."Fuel_Surcharge_Customer_Station"
         ("customerFuelSurchargeId","stationId","stationName")
         VALUES (?, ?, ?)`,
                [id, station.stationId, station.stationName]
            );
        }
    }
}

// ✅ Delete Customer Fuel Surcharge + Stations
export async function deleteCustomerFuelSurcharge(conn: Connection, id: number): Promise<void> {
    await conn.query(
        `DELETE FROM ${SCHEMA}."Fuel_Surcharge_Customer_Station" WHERE "customerFuelSurchargeId" = ?`,
        [id]
    );
    await conn.query(
        `DELETE FROM ${SCHEMA}."Fuel_Surcharge_Customer" WHERE "customerFuelSurchargeId" = ?`,
        [id]
    );
}
