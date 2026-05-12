import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";
import { CreatePrinterRequest, UpdatePrinterRequest, Printers } from "../../entities/maintenance/Printers";

export async function createPrinter(
    conn: Connection,
    printer: CreatePrinterRequest
): Promise<number> {
    const query = `SELECT "printerId" FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Printers"
        ("printerName", "printerIP", "printerPort", "activeStatus")
        VALUES (?, ?, ?, ?)
    )`;
    const result = (await conn.query(query, [printer.printerName, printer.printerIP, printer.printerPort, printer.activeStatus])) as any[];
    return result[0]?.printerId || 0;
}

export async function getPrinterById(conn: Connection, printerId: number): Promise<Printers | null> {
    const query = `SELECT "printerId", "printerName", "printerIP", "printerPort", "activeStatus" FROM ${SCHEMA}."Printers" WHERE "printerId" = ?`;
    const result = (await conn.query(query, [printerId])) as any[];
    if (result.length === 0) {
        return null;
    }
    const row = result[0];
    return {
        printerId: row.printerId,
        printerName: row.printerName,
        printerIP: row.printerIP,
        printerPort: row.printerPort,
        activeStatus: row.activeStatus,
    };
}

export async function listPrinters(
    conn: Connection,
    limit: number,
    offset: number,
    searchTerm?: string,
    status?: string
): Promise<Printers[]> {
    let query = `SELECT "printerId", "printerName", "printerIP", "printerPort", "activeStatus" FROM ${SCHEMA}."Printers" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("printerName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    if (status) {
        query += ` AND UPPER("activeStatus") = UPPER(?)`;
        params.push(status);
    }

    query += ` ORDER BY "printerId" DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = (await conn.query(query, params)) as any[];
    return result.map((row) => ({
        printerId: row.printerId,
        printerName: row.printerName,
        printerIP: row.printerIP,
        printerPort: row.printerPort,
        activeStatus: row.activeStatus,
    }));
}

export async function countPrinters(
    conn: Connection,
    searchTerm?: string,
    status?: string
): Promise<number> {
    let query = `SELECT COUNT(*) AS TOTAL FROM ${SCHEMA}."Printers" WHERE 1=1`;
    const params: any[] = [];

    if (searchTerm) {
        query += ` AND LOWER("printerName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }

    if (status) {
        query += ` AND UPPER("activeStatus") = UPPER(?)`;
        params.push(status);
    }

    const result = (await conn.query(query, params)) as any[];
    return result[0]?.TOTAL || 0;
}

export async function updatePrinter(
    conn: Connection,
    printerId: number,
    printer: UpdatePrinterRequest
) {
    const fields = [];
    const values = [];
    if (printer.printerName !== undefined) {
        fields.push('"printerName" = ?');
        values.push(printer.printerName);
    }
    if (printer.printerIP !== undefined) {
        fields.push('"printerIP" = ?');
        values.push(printer.printerIP);
    }
    if (printer.printerPort !== undefined) {
        fields.push('"printerPort" = ?');
        values.push(printer.printerPort);
    }
    if (printer.activeStatus !== undefined) {
        fields.push('"activeStatus" = ?');
        values.push(printer.activeStatus);
    }
    if (fields.length === 0) {
        return;
    }
    const query = `UPDATE ${SCHEMA}."Printers" SET ${fields.join(', ')} WHERE "printerId" = ?`;
    await conn.query(query, [...values, printerId]);
}

export async function togglePrinterStatus(conn: Connection, printerId: number, status: 'Y' | 'N'): Promise<void> {
    const query = `UPDATE ${SCHEMA}."Printers" SET "activeStatus" = ? WHERE "printerId" = ?`;
    await conn.query(query, [status, printerId]);
}

