import { Connection } from 'odbc';
import { Address } from '../../entities/maintenance';
import { SCHEMA } from '../../config/db2';

/**
 * Create a new address
 */
export async function createAddress(
    conn: Connection,
    line1: string,
    line2: string | null,
    city: string,
    state: string,
    zipCode: string,
    createdBy: number
): Promise<number> {
    const insertQuery = `
    SELECT "addressId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Address"
      ("line1","line2","city","state","zipCode","createdAt","createdBy")
      VALUES (?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?)
    )
  `;

    const params = [
        line1,
        line2 === null ? '' : line2,
        city,
        state,
        zipCode,
        createdBy
    ];

    const result = (await conn.query(insertQuery, params)) as any[];
    return result[0]?.addressId;
}


/**
 * Map entity to address
 */
export async function createEntityAddressMap(
    conn: Connection,
    entityId: number,
    addressId: number,
    addressRole: 'Corporate' | 'Billing' | 'Primary'
): Promise<void> {
    const query = `
        INSERT INTO ${SCHEMA}."Entity_Address_Map"
        ( "entityId", "addressId", "addressRole")
        VALUES (?, ?, ?)
    `;
    await conn.query(query, [entityId, addressId, addressRole]);
}

/**
 * Get addresses for an entity
 */
export async function getAddressesForEntity(
    conn: Connection,
    entityId: number
): Promise<Address[]> {
    const query = `
        SELECT a.*, m."addressRole"
        FROM ${SCHEMA}."Entity_Address_Map" m
        JOIN ${SCHEMA}."Address" a ON m."addressId" = a."addressId"
        WHERE m."entityId" = ?
    `;
    const result = (await conn.query(query, [entityId])) as any[];
    return result as Address[];
}


/**
 * Update address and mapping role
 */
export async function updateAddress(
    conn: Connection,
    addressId: number,
    line1: string,
    line2: string | null,
    city: string,
    state: string,
    zipCode: string,
    updatedBy: number,
    addressRole: string
): Promise<void> {
    const query = `
        UPDATE ${SCHEMA}."Address"
        SET "line1" = ?, "line2" = ?, "city" = ?, "state" = ?, "zipCode" = ?,
            "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), "updatedBy" = ?
        WHERE "addressId" = ?
    `;
    await conn.query(query, [
        line1,
        line2 === null ? '' : line2,
        city,
        state,
        zipCode,
        updatedBy,
        addressId
    ]);

    const mapQuery = `
        UPDATE ${SCHEMA}."Entity_Address_Map"
        SET "addressRole" = ?
        WHERE "addressId" = ?
    `;
    await conn.query(mapQuery, [addressRole, addressId]);
}
