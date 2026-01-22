import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as accessorialService from '../../services/maintenance/accessorial';

/**
 * Create a new accessorial
 */
export async function createAccessorial(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 1; // fallback if auth not provided
        const accessorial = await accessorialService.createAccessorialService(conn, req.body, userId);
        res.status(201).json({ success: true, data: accessorial });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to create accessorial',
            message: (error as Error).message
        });
    }
}

/**
 * Get all accessorials (for dropdown)
 */
export async function getAllAccessorials(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const accessorials = await accessorialService.getAllAccessorialsService(conn);
        res.status(200).json({ success: true, data: accessorials });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch accessorials',
            message: (error as Error).message
        });
    }
}

/**
 * Update an accessorial
 */
export async function updateAccessorial(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { accessorialId } = req.params;
        const { accessorialName } = req.body;
        const userId = (req as any).user?.userId || 1;

        const updated = await accessorialService.updateAccessorialService(
            conn,
            parseInt(accessorialId, 10),
            accessorialName,
            userId
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update accessorial',
            message: (error as Error).message
        });
    }
}

/**
 * Soft delete an accessorial
 */
export async function softDeleteAccessorial(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { accessorialId } = req.params;
        const userId = (req as any).user?.userId || 1;

        await accessorialService.softDeleteAccessorialService(conn, parseInt(accessorialId, 10), userId);

        res.status(200).json({ success: true, message: 'Accessorial deleted successfully' });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete accessorial',
            message: (error as Error).message
        });
    }
}
