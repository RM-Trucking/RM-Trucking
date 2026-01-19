import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as entityAccessorialMapService from '../../services/maintenance/entityAccessorialMap';

/**
 * Create a new entity-accessorial mapping
 */
export async function createEntityAccessorialMap(req: Request, res: Response, conn: Connection): Promise<void> {
    try {

        const userId = (req as any).user?.userId || 1;
        const map = await entityAccessorialMapService.createEntityAccessorialMapService(conn, req.body, userId);
        res.status(201).json({ success: true, data: map });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to create entity-accessorial mapping',
            message: (error as Error).message
        });
    }
}

/**
 * Get all accessorial mappings for a given entity
 */
export async function getAccessorialsForEntity(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { entityId } = req.params;
        const maps = await entityAccessorialMapService.getAccessorialsForEntityService(conn, parseInt(entityId, 10));
        res.status(200).json({ success: true, data: maps });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch entity accessorials',
            message: (error as Error).message
        });
    }
}

/**
 * Update an entity-accessorial mapping
 */
export async function updateEntityAccessorialMap(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { entityAccessorialId } = req.params;
        const userId = (req as any).user?.userId || 1;

        const updated = await entityAccessorialMapService.updateEntityAccessorialMapService(
            conn,
            parseInt(entityAccessorialId, 10),
            req.body,
            userId
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update entity-accessorial mapping',
            message: (error as Error).message
        });
    }
}


/**
 * Delete an entity-accessorial mapping
 */
export async function deleteEntityAccessorialMap(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { entityAccessorialId } = req.params;
        await entityAccessorialMapService.deleteEntityAccessorialMapService(conn, parseInt(entityAccessorialId, 10));
        res.status(200).json({ success: true, message: 'Entity-accessorial mapping deleted successfully' });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete entity-accessorial mapping',
            message: (error as Error).message
        });
    }
}
