import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';
import { Customer } from '../../entities/maintenance';


/**
 * Create a new customer (supports noteThreadId at insert)
 */
export async function createCustomer(conn: Connection, customer: Partial<Customer>): Promise<number> {
    const insertQuery = `
    SELECT "customerId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Customer"
      ("customerName","rmAccountNumber","phoneNumber","website","corporateBillingSame",
       "activeStatus","createdAt","createdBy","entityId","noteThreadId")
      VALUES (?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, ?, ?)
    )
  `;

    const params = [
        customer.customerName,
        customer.rmAccountNumber,
        customer.phoneNumber,
        customer.website,
        customer.corporateBillingSame,
        customer.activeStatus ?? 'Y',
        customer.createdBy,
        customer.entityId,
        customer.noteThreadId
    ].map(v => v === undefined || v === null ? '' : v); // normalize null/undefined

    const result = (await conn.query(insertQuery, params)) as any[];
    return result[0]?.customerId;
}


/**
 * Update customer
 */
export async function updateCustomer(
    conn: Connection,
    customerId: number,
    updates: Partial<Customer>
): Promise<void> {
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `"${f}" = ?`).join(', ');
    const params = fields.map(f => (updates as any)[f]);

    const query = `
        UPDATE ${SCHEMA}."Customer"
        SET ${setClause}, "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
        WHERE "customerId" = ?
    `;
    await conn.query(query, [...params, customerId]);
}

/**
 * Soft delete customer (set activeStatus = 'N')
 */
export async function softDeleteCustomer(conn: Connection, customerId: number): Promise<void> {
    const query = `
        UPDATE ${SCHEMA}."Customer"
        SET "activeStatus" = 'N', "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
        WHERE "customerId" = ?
    `;
    await conn.query(query, [customerId]);
}

/**
 * Get customer by ID
 */
export async function getCustomerById(conn: Connection, customerId: number): Promise<Customer | null> {
    const query = `
        SELECT "customerId", "customerName", "rmAccountNumber", "phoneNumber", "website","activeStatusReason", "corporateBillingSame",
               "activeStatus", "createdAt", "createdBy", "updatedAt", "updatedBy",
               "noteThreadId", "entityId"
        FROM ${SCHEMA}."Customer"
        WHERE "customerId" = ?
    `;
    const result = (await conn.query(query, [customerId])) as any[];
    return result.length > 0 ? (result[0] as Customer) : null;
}


/**
 * Get customer by RM account number
 */
export async function getCustomerByRmAccountNumber(
    conn: Connection,
    rmAccountNumber: string
): Promise<Customer | null> {
    const query = `
        SELECT "customerId", "customerName", "rmAccountNumber", "phoneNumber", "website","activeStatusReason", "corporateBillingSame",
               "activeStatus", "createdAt", "createdBy", "updatedAt", "updatedBy",
               "noteThreadId", "entityId"
        FROM ${SCHEMA}."Customer"
        WHERE "rmAccountNumber" = ?
        FETCH FIRST 1 ROWS ONLY
    `;
    const result = (await conn.query(query, [rmAccountNumber])) as any[];
    return result.length > 0 ? (result[0] as Customer) : null;
}

/**
 * Get all customers with optional search + pagination
 */
export async function getAllCustomers(
    conn: Connection,
    searchTerm: string | null,
    page: number = 1,
    pageSize: number = 10
): Promise<Customer[]> {
    const offset = (page - 1) * pageSize;

    let query = `
        SELECT "customerId", "customerName", "rmAccountNumber", "phoneNumber", "website","activeStatusReason", "corporateBillingSame",
               "activeStatus", "createdAt", "createdBy", "updatedAt", "updatedBy",
               "noteThreadId", "entityId"
        FROM ${SCHEMA}."Customer"
    `;
    const params: any[] = [];

    if (searchTerm) {
        query += ` WHERE LOWER("customerName") LIKE ? `;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    query += ` ORDER BY "customerName" ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY `;
    params.push(offset, pageSize);

    const result = (await conn.query(query, params)) as any[];
    return result as Customer[];
}

/**
 * Count customers (for pagination metadata)
 */
export async function countCustomers(conn: Connection, searchTerm: string | null): Promise<number> {
    let query = `SELECT COUNT(*) AS total FROM ${SCHEMA}."Customer"`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` WHERE LOWER("customerName") LIKE ? `;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    const result = (await conn.query(query, params)) as any[];
    return result[0]?.TOTAL || 0;
}

/**
 * Update noteThreadId for customer
 */
export async function updateCustomerNoteThread(
    conn: Connection,
    customerId: number,
    noteThreadId: number
): Promise<void> {
    const query = `
        UPDATE ${SCHEMA}."Customer"
        SET "noteThreadId" = ?, "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE)
        WHERE "customerId" = ?
    `;
    await conn.query(query, [noteThreadId, customerId]);
}