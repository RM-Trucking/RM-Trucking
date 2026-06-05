import { Connection } from "odbc";
import { CreateCargoAPIRequest, UpdateCargoAPIRequest, CargoAPI } from "../../entities/maintenance/CargoAPI";
import { SCHEMA } from "../../config/db2";

export async function createCargoAPI(conn: Connection, api: CreateCargoAPIRequest): Promise<number> {
    const query = `SELECT "apiId" FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Cargo_API"
        ("apiName", "apiEndPoint", "apiKey", "activeStatus")
        VALUES (?, ?, ?, ?)
    )`;
    const result = (await conn.query(query, [api.apiName, api.apiEndPoint, api.apiKey, api.activeStatus])) as any[];
    return result[0]?.apiId || 0;
}

export async function getCargoAPIById(conn: Connection, apiId: number): Promise<CargoAPI | null> {
    const query = `SELECT "apiId", "apiName", "apiEndPoint", "apiKey", "activeStatus" FROM ${SCHEMA}."Cargo_API" WHERE "apiId" = ?`;
    const result = (await conn.query(query, [apiId])) as any[];
    if (result.length === 0) {
        return null;
    }
    const row = result[0];
    return {
        apiId: row.apiId,
        apiName: row.apiName,
        apiEndPoint: row.apiEndPoint,
        apiKey: row.apiKey,
        activeStatus: row.activeStatus,
    };
}

export async function listCargoAPIs(
    conn: Connection,
    limit: number,
    offset: number,
    searchTerm?: string,
    status?: string
): Promise<CargoAPI[]> {
    let query = `SELECT "apiId", "apiName", "apiEndPoint", "apiKey", "activeStatus" FROM ${SCHEMA}."Cargo_API" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("apiName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    if (status) {
        query += ` AND UPPER("activeStatus") = UPPER(?)`;
        params.push(status);
    }

    query += ` ORDER BY "apiId" DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = (await conn.query(query, params)) as any[];
    return result.map((row) => ({
        apiId: row.apiId,
        apiName: row.apiName,
        apiEndPoint: row.apiEndPoint,
        apiKey: row.apiKey,
        activeStatus: row.activeStatus,
    }));
}

export async function countCargoAPIs(
    conn: Connection,
    searchTerm?: string,
    status?: string
): Promise<number> {
    let query = `SELECT COUNT(*) AS TOTAL FROM ${SCHEMA}."Cargo_API" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("apiName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    if (status) {
        query += ` AND UPPER("activeStatus") = UPPER(?)`;
        params.push(status);
    }

    const result = (await conn.query(query, params)) as any[];
    return result[0]?.TOTAL || 0;
}

export async function updateCargoAPI(
    conn: Connection,
    apiId: number,
    api: UpdateCargoAPIRequest
): Promise<void> {
    const fields = [];
    const values = [];
    if (api.apiName !== undefined) {
        fields.push('"apiName" = ?');
        values.push(api.apiName);
    }
    if (api.apiEndPoint !== undefined) {
        fields.push('"apiEndPoint" = ?');
        values.push(api.apiEndPoint);
    }
    if (api.apiKey !== undefined) {
        fields.push('"apiKey" = ?');
        values.push(api.apiKey);
    }
    if (api.activeStatus !== undefined) {
        fields.push('"activeStatus" = ?');
        values.push(api.activeStatus);
    }
    if (fields.length === 0) {
        return;
    }
    const query = `UPDATE ${SCHEMA}."Cargo_API" SET ${fields.join(', ')} WHERE "apiId" = ?`;
    await conn.query(query, [...values, apiId]);
}

export async function toggleCargoAPIStatus(conn: Connection, apiId: number, status: 'Y' | 'N'): Promise<void> {
    const query = `UPDATE ${SCHEMA}."Cargo_API" SET "activeStatus" = ? WHERE "apiId" = ?`;
    await conn.query(query, [status, apiId]);
}

