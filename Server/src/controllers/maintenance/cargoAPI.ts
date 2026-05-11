// cargoAPI.ts

import { Request, Response } from "express";
import { Connection } from "odbc";
import * as cargoAPIService from "../../services/maintenance/cargoAPI";

// CREATE
export async function createCargoAPI(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const createReq = req.body;

        const { cargoAPI } = await cargoAPIService.createCargoAPIService(conn, createReq);

        res.status(201).json({
            success: true,
            message: "Cargo API created successfully",
            data: { cargoAPI }
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

// UPDATE
export async function updateCargoAPI(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const updateReq = { ...req.body, apiId: Number(req.params.id) };

        const cargoAPI = await cargoAPIService.updateCargoAPIService(conn, updateReq);

        res.status(200).json({
            success: true,
            message: "Cargo API updated successfully",
            data: { cargoAPI }
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

// GET ALL
export async function listCargoAPIs(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
        const searchTerm = req.query.search as string;
        const status = req.query.status as 'Y' | 'N';

        const result = await cargoAPIService.listCargoAPIsService(conn, page, pageSize, searchTerm, status);

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
export async function getCargoAPIById(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const apiId = Number(req.params.id);
        const cargoAPI = await cargoAPIService.getCargoAPIByIdService(conn, apiId);

        if (!cargoAPI) {
            res.status(404).json({ success: false, message: "Cargo API not found" });
            return;
        }

        res.status(200).json({ success: true, data: cargoAPI });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// DROPDOWN
export async function listCargoAPIDropdown(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const cargoAPIs = await cargoAPIService.listCargoAPIDropdownService(conn);
        res.status(200).json({ success: true, data: cargoAPIs });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// TOGGLE STATUS
export async function toggleCargoAPIStatus(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const apiId = Number(req.params.id);
        const { status } = req.body; // 'Y' | 'N'
        const adminId = (req as any).user?.userId || 1;

        await cargoAPIService.toggleCargoAPIStatusService(conn, apiId, status);

        res.status(200).json({ success: true, message: `Cargo API status updated to ${status}` });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}
