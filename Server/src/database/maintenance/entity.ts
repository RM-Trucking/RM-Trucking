import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';

export interface Entity {
    entityId: number;
    entityType: string;
    entityName: string;
}

/**
 * Create a new entity
 */
export async function createEntity(
    conn: Connection,
    entityType: 'CUSTOMER' | 'CARRIER' | 'STATION' | 'TERMINAL' | 'DEPARTMENT' | 'CUSTOMER_PERSONNEL' | 'ACCESSORIAL',
    entityName: string
): Promise<number> {
    const query = `
        INSERT INTO ${SCHEMA}."Entity"
        ("entityType", "entityName")
        VALUES (?, ?)
    `;
    await conn.query(query, [entityType, entityName]);

    const resultQuery = `
        SELECT "entityId"
        FROM ${SCHEMA}."Entity"
        WHERE "entityType" = ? AND "entityName" = ?
        ORDER BY "entityId" DESC
        FETCH FIRST 1 ROWS ONLY
    `;
    const result = (await conn.query(resultQuery, [entityType, entityName])) as any[];
    return result[0]?.entityId || 0;
}
