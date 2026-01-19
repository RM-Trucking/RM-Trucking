import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as stationService from '../../services/maintenance/station';

/**
 * Create a new station
 */
export async function createStation(req: Request, res: Response, conn: Connection): Promise<void> {
    try {

        console.log(req.body);


        const adminId = (req as any).user?.userId || 1;
        const { station } = await stationService.createStation(conn, req.body, adminId);
        res.status(201).json({ success: true, data: station });
    } catch (error) {

        console.log(error);


        res.status(400).json({
            error: 'Failed to create station',
            message: (error as Error).message
        });
    }
}

/**
 * Get a station by ID
 */
export async function getStation(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { stationId } = req.params;
        const station = await stationService.getStationService(conn, parseInt(stationId, 10));
        if (!station) {
            res.status(404).json({ error: 'Station not found' });
            return;
        }
        res.status(200).json({ success: true, data: station });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch station',
            message: (error as Error).message
        });
    }
}

/**
 * Get all stations for a customer
 */
export async function getStationsForCustomer(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { customerId } = req.params;
        const searchTerm = (req.query.search as string) || null;
        const page = parseInt((req.query.page as string) || '1', 10);
        const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
        console.log(req.query);


        const result = await stationService.getStationsForCustomerService(
            conn,
            parseInt(customerId, 10),
            page,
            pageSize,
            searchTerm
        );

        res.status(200).json({
            success: true,
            data: result.stations,
            pagination: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch stations',
            message: (error as Error).message
        });
    }
}


/**
 * Update a station
 */
export async function updateStation(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { stationId } = req.params;
        const userId = (req as any).user?.userId || 1;
        const updated = await stationService.updateStationService(conn, parseInt(stationId, 10), req.body, userId);
        res.status(200).json({
            success: true,
            message: 'Station updated successfully',
            data: updated
        });
    } catch (error) {

        console.log(error);


        res.status(400).json({
            error: 'Failed to update station',
            message: (error as Error).message
        });
    }
}

/**
 * Soft delete a station
 */
export async function deleteStation(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { stationId } = req.params;
        await stationService.deleteStationService(conn, parseInt(stationId, 10));
        res.status(200).json({
            success: true,
            message: 'Station deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete station',
            message: (error as Error).message
        });
    }
}
