import { Connection } from "odbc";
import * as printerDB from "../../database/maintenance/printers";
import { CreatePrinterRequest, UpdatePrinterRequest, PrinterResponse } from "../../entities/maintenance/Printers";

export async function createPrinterService(
    conn: Connection,
    createReq: CreatePrinterRequest
): Promise<{ printer: PrinterResponse }> {
    try {
        const printerId = await printerDB.createPrinter(conn, createReq);
        if (!printerId) throw new Error("Failed to create printer");

        const printer = await printerDB.getPrinterById(conn, printerId);
        if (!printer) throw new Error("Failed to retrieve created printer");

        return { printer };
    } catch (error) {
        throw error;
    }
}

export async function listPrintersService(
    conn: Connection,
    page: number,
    pageSize: number,
    searchTerm?: string,
    status?: string
): Promise<{ data: PrinterResponse[]; total: number; page: number; pageSize: number }> {
    try {
        const offset = (page - 1) * pageSize;
        const printers = await printerDB.listPrinters(conn, pageSize, offset, searchTerm, status);
        const total = await printerDB.countPrinters(conn, searchTerm, status);

        return {
            data: printers || [],
            total,
            page,
            pageSize
        };
    } catch (error) {
        throw error;
    }
}

export async function getPrinterByIdService(conn: Connection, printerId: number): Promise<PrinterResponse | null> {
    try {
        const printer = await printerDB.getPrinterById(conn, printerId);
        return printer || null;
    } catch (error) {
        throw error;
    }
}

export async function updatePrinterService(
    conn: Connection,
    updateReq: UpdatePrinterRequest & { printerId: number }
): Promise<PrinterResponse> {
    try {
        const { printerId, ...updates } = updateReq;

        await printerDB.updatePrinter(conn, printerId, updates);

        const printer = await printerDB.getPrinterById(conn, printerId);
        if (!printer) throw new Error("Failed to retrieve updated printer");

        return printer;
    } catch (error) {
        throw error;
    }
}

export async function togglePrinterStatusService(
    conn: Connection,
    printerId: number,
    status: 'Y' | 'N'
): Promise<void> {
    try {
        await printerDB.togglePrinterStatus(conn, printerId, status);
    } catch (error) {
        throw error;
    }
}

export async function listPrinterDropdownService(conn: Connection): Promise<any[]> {
    try {
        const printers = await printerDB.listPrinters(conn, 999, 0, undefined, 'Y');
        return printers.map(p => ({
            printerId: p.printerId,
            printerName: p.printerName
        }));
    } catch (error) {
        throw error;
    }
}

