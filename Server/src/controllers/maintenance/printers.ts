// printers.ts

import { Request, Response } from "express";
import { Connection } from "odbc";
import * as printerService from "../../services/maintenance/printers";

// CREATE
export async function createPrinter(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const createReq = req.body;

        const { printer } = await printerService.createPrinterService(conn, createReq);

        res.status(201).json({
            success: true,
            message: "Printer created successfully",
            data: { printer }
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

// UPDATE
export async function updatePrinter(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const updateReq = { ...req.body, printerId: Number(req.params.id) };

        const printer = await printerService.updatePrinterService(conn, updateReq);

        res.status(200).json({
            success: true,
            message: "Printer updated successfully",
            data: { printer }
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

// GET ALL
export async function listPrinters(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
        const searchTerm = req.query.search as string;
        const status = req.query.status as 'Y' | 'N';

        const result = await printerService.listPrintersService(conn, page, pageSize, searchTerm, status);

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                total: result.total || 0,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

// GET BY ID
export async function getPrinterById(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const printerId = Number(req.params.id);
        const printer = await printerService.getPrinterByIdService(conn, printerId);

        if (!printer) {
            res.status(404).json({ success: false, message: "Printer not found" });
            return;
        }

        res.status(200).json({ success: true, data: printer });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// DROPDOWN
export async function listPrinterDropdown(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const printers = await printerService.listPrinterDropdownService(conn);
        res.status(200).json({ success: true, data: printers });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// TOGGLE STATUS
export async function togglePrinterStatus(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const printerId = Number(req.params.id);
        const { status } = req.body; // 'Y' | 'N'
        const adminId = (req as any).user?.userId || 1;

        await printerService.togglePrinterStatusService(conn, printerId, status);

        res.status(200).json({ success: true, message: `Printer status updated to ${status}` });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}
