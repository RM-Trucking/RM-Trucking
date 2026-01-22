import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as personnelService from '../../services/maintenance';

/**
 * Create new personnel
 */
export async function createPersonnel(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 1;
        const personnel = await personnelService.createCustomerPersonnelService(conn, req.body, userId);
        res.status(201).json({ success: true, data: personnel });
    } catch (error) {
        console.error(error);

        if ((error as Error).message.includes('Email')) {
            res.status(409).json({ error: 'Duplicate email', message: (error as Error).message });
        } else {
            res.status(400).json({ error: 'Failed to create personnel', message: (error as Error).message });
        }
    }
}


/**
 * Get personnel by ID
 */
export async function getPersonnelById(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { personnelId } = req.params;
        const personnel = await personnelService.getPersonnelByIdService(conn, parseInt(personnelId, 10));
        if (!personnel) {
            res.status(404).json({ error: 'Personnel not found' });
            return;
        }
        res.status(200).json({ success: true, data: personnel });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch personnel', message: (error as Error).message });
    }
}

/**
 * Get all personnel for a station
 */
export async function getPersonnelByStation(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { stationId } = req.params;
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
        const searchTerm = (req.query.searchTerm as string) || null;

        const result = await personnelService.getPersonnelByStationService(
            conn,
            parseInt(stationId, 10),
            page,
            pageSize,
            searchTerm
        );

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                total: result.pagination.total,
                page: result.pagination.page,
                pageSize: result.pagination.pageSize
            }
        });

    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch personnel',
            message: (error as Error).message
        });
    }
}

/**
 * Update personnel
 */
export async function updatePersonnel(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 1;
        const { personnelId } = req.params;
        const updated = await personnelService.updateCustomerPersonnelService(
            conn,
            parseInt(personnelId, 10),
            req.body,
            userId
        );
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update personnel', message: (error as Error).message });
    }
}

/**
 * Soft delete personnel
 */
export async function deletePersonnel(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 1;
        const { personnelId } = req.params;
        await personnelService.deletePersonnelService(conn, parseInt(personnelId, 10), userId);
        res.status(200).json({ success: true, message: 'Personnel deleted (soft delete)' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete personnel', message: (error as Error).message });
    }
}
