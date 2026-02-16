import { Request, Response } from "express";
import { Connection } from "odbc";
import {
    createZoneService,
    getZoneService,
    updateZoneService,
    deleteZoneService,
    listZonesService,
    listZonesDropdownService
} from "../../services/maintenance/zone";
import { CreateZoneRequest, UpdateZoneRequest } from "../../entities/maintenance/Zone";

// -------------------- Create Zone --------------------
export async function createZone(req: Request, res: Response, conn: Connection) {
    try {
        const userId = req.user?.userId || 0; // assuming JWT middleware attaches user info
        const zoneReq: CreateZoneRequest = req.body;

        const zone = await createZoneService(conn, zoneReq, userId);

        res.json({ success: true, data: zone });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

export async function listZonesDropdown(req: Request, res: Response, conn: Connection) {
    try {
        const zones = await listZonesDropdownService(conn);
        res.json({ success: true, data: zones });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}


export async function listZones(req: Request, res: Response, conn: Connection) {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
        const searchTerm = req.query.search as string | undefined;

        const result = await listZonesService(conn, page, pageSize, searchTerm);

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}



// -------------------- Get Zone By Id --------------------
export async function getZone(req: Request, res: Response, conn: Connection) {
    try {
        const zoneId = parseInt(req.params.zoneId, 10);
        const zone = await getZoneService(conn, zoneId);

        res.json({ success: true, data: zone });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
}

// -------------------- Update Zone --------------------
export async function updateZone(req: Request, res: Response, conn: Connection) {
    try {
        const zoneId = parseInt(req.params.zoneId, 10);
        const userId = req.user?.userId || 0;
        const zoneReq: UpdateZoneRequest & { zipCodes?: string[]; ranges?: string[]; note?: { messageText: string } } = req.body;

        const updatedZone = await updateZoneService(conn, zoneId, zoneReq, userId);

        res.json({
            success: true,
            message: "Zone updated successfully",
            data: updatedZone
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// -------------------- Delete Zone --------------------
export async function deleteZone(req: Request, res: Response, conn: Connection) {
    try {
        const zoneId = parseInt(req.params.zoneId, 10);

        await deleteZoneService(conn, zoneId);

        res.json({ success: true, message: "Zone deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}
