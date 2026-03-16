import { Connection } from 'odbc';
import {
    CreateGeneralFuelSurchargeRequest,
    UpdateGeneralFuelSurchargeRequest,
    GeneralFuelSurchargeResponse,
    GeneralFuelSurcharge
} from '../../entities/maintenance/GeneralFuelSurcharge';
import { SCHEMA } from '../../config/db2';



// ✅ Insert General Fuel Surcharge and return full DB row
export async function insertGeneralFuelSurcharge(
    conn: Connection,
    body: Partial<GeneralFuelSurcharge>,
    createdBy: number
): Promise<GeneralFuelSurchargeResponse> {
    const query = `
    SELECT *
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Fuel_Surcharge_General"
      ("fuelPercentage","effectiveDate","effectiveTime","expireDate","expireTime","createdBy","createdAt")
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    )
  `;

    const result = await conn.query(query, [
        body.fuelPercentage,
        body.effectiveDate,
        body.effectiveTime,
        body.expireDate || null,
        body.expireTime || null,
        createdBy
    ] as any[]);

    if (!result || result.length === 0) {
        throw new Error('Insert failed, no row returned');
    }

    // Cast the first row to our response interface
    const row = result[0] as GeneralFuelSurchargeResponse;
    return row;
}

// ✅ Select All General Fuel Surcharges (with pagination)
export async function selectAllGeneralFuelSurcharges(
    conn: Connection,
    page: number,
    pageSize: number
): Promise<{ surcharges: GeneralFuelSurchargeResponse[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const query = `
    SELECT *
    FROM ${SCHEMA}."Fuel_Surcharge_General"
    ORDER BY "effectiveDate" DESC
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
  `;

    const totalQuery = `SELECT COUNT(*) AS total FROM ${SCHEMA}."Fuel_Surcharge_General"`;

    const surcharges = await conn.query(query, [offset, pageSize]) as GeneralFuelSurchargeResponse[];
    const totalResult = await conn.query(totalQuery) as any[];
    const total = totalResult[0].total;

    return { surcharges, total };
}

// ✅ Select General Fuel Surcharge by ID
export async function selectGeneralFuelSurchargeById(
    conn: Connection,
    id: number
): Promise<GeneralFuelSurchargeResponse | null> {
    const query = `SELECT * FROM ${SCHEMA}."Fuel_Surcharge_General" WHERE "fuelSurchargeId" = ?`;
    const result = await conn.query(query, [id]) as GeneralFuelSurchargeResponse[];
    return result.length ? result[0] : null;
}

// ✅ Update General Fuel Surcharge
export async function updateGeneralFuelSurcharge(
    conn: Connection,
    id: number,
    body: Partial<GeneralFuelSurcharge>,
    updatedBy: number
): Promise<void> {
    const query = `
    UPDATE ${SCHEMA}."Fuel_Surcharge_General"
    SET "fuelPercentage" = COALESCE(?, "fuelPercentage"),
        "effectiveDate" = COALESCE(?, "effectiveDate"),
        "effectiveTime" = COALESCE(?, "effectiveTime"),
        "expireDate" = COALESCE(?, "expireDate"),
        "expireTime" = COALESCE(?, "expireTime"),
        "updatedBy" = ?,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "fuelSurchargeId" = ?
  `;

    await conn.query(query, [
        body.fuelPercentage || null,
        body.effectiveDate || null,
        body.effectiveTime || null,
        body.expireDate || null,
        body.expireTime || null,
        updatedBy,
        id
    ] as any[]);
}

// ✅ Delete General Fuel Surcharge
export async function deleteGeneralFuelSurcharge(conn: Connection, id: number): Promise<void> {
    const query = `DELETE FROM ${SCHEMA}."Fuel_Surcharge_General" WHERE "fuelSurchargeId" = ?`;
    await conn.query(query, [id]);
}
