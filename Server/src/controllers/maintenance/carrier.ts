// carrierController.ts

import { Request, Response } from "express";
import { Connection } from "odbc";
import * as carrierService from "../../services/maintenance/carrier";

// CREATE
export async function createCarrier(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const createReq = req.body;
        const adminId = (req as any).user?.userId || 1;

        const { carrier } = await carrierService.createNewCarrier(conn, createReq, adminId);

        res.status(201).json({
            success: true,
            message: "Carrier created successfully",
            data: { carrier }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// UPDATE
export async function updateCarrier(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const updateReq = { ...req.body, carrierId: Number(req.params.id) };
        const adminId = (req as any).user?.userId || 1;

        const carrier = await carrierService.updateCarrierService(conn, updateReq, adminId);

        res.status(200).json({
            success: true,
            message: "Carrier updated successfully",
            data: { carrier }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// GET ALL
export async function listCarriers(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
        const searchTerm = req.query.search as string;
        const status = req.query.status as 'Active' | 'Inactive' | 'Incomplete';

        const result = await carrierService.listCarriersService(conn, page, pageSize, searchTerm, status);

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
export async function getCarrierById(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const carrierId = Number(req.params.id);
        const carrier = await carrierService.getCarrierByIdService(conn, carrierId);

        if (!carrier) {
            res.status(404).json({ success: false, message: "Carrier not found" });
            return;
        }

        res.status(200).json({ success: true, data: carrier });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// DROPDOWN
export async function listCarrierDropdown(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const carriers = await carrierService.listCarrierDropdownService(conn);
        res.status(200).json({ success: true, data: carriers });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// TOGGLE STATUS
export async function toggleCarrierStatus(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const carrierId = Number(req.params.id);
        const { status } = req.body; // 'Active' | 'Inactive' | 'Incomplete'
        const adminId = (req as any).user?.userId || 1;

        await carrierService.toggleCarrierStatusService(conn, carrierId, status, adminId);

        res.status(200).json({ success: true, message: `Carrier status updated to ${status}` });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

export async function getCarriersByRateId(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rateId = parseInt(req.params.rateId, 10);
        const customers = await carrierService.getCarriersByRateIdService(conn, rateId);

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {

        console.log(error);


        res.status(400).json({
            success: false,
            message: (error as Error).message
        });
    }
}
