import { Connection } from "odbc";
import { Request, Response } from "express";
import * as zoneService from "../../services/maintenance/zone";

export async function createZone(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 1;
        const zone = await zoneService.createZoneService(conn, req.body, userId);
        res.status(201).json({ success: true, data: zone });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create zone', message: (error as Error).message });
    }
}

export async function getZone(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { zoneId } = req.params;
        const zone = await zoneService.getZoneService(conn, parseInt(zoneId, 10));
        res.status(200).json({ success: true, data: zone });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch zone', message: (error as Error).message });
    }
}

export async function updateZone(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { zoneId } = req.params;
        const userId = (req as any).user?.userId || 1;
        await zoneService.updateZoneService(conn, parseInt(zoneId, 10), req.body, userId);
        res.status(200).json({ success: true, message: 'Zone updated successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update zone', message: (error as Error).message });
    }
}

export async function deleteZone(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { zoneId } = req.params;
        await zoneService.deleteZoneService(conn, parseInt(zoneId, 10));
        res.status(200).json({ success: true, message: 'Zone deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete zone', message: (error as Error).message });
    }
}
