import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as stationController from '../../controllers/maintenance/station';

const router = Router();

/**
 * POST /api/stations
 * Create a new station
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await stationController.createStation(req, res, conn);
    if (conn) conn.close();
});

/**
 * GET /api/stations/:stationId
 * Get a station by ID
 */
router.get('/:stationId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await stationController.getStation(req, res, conn);
    if (conn) conn.close();
});

/**
 * GET /api/customers/:customerId/stations
 * Get all stations for a customer
 */
router.get('/customer/:customerId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await stationController.getStationsForCustomer(req, res, conn);
    if (conn) conn.close();
});


/**
 * PUT /api/stations/:stationId
 * Update a station
 */
router.put('/:stationId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await stationController.updateStation(req, res, conn);
    if (conn) conn.close();
});

/**
 * DELETE /api/stations/:stationId
 * Soft delete a station
 */
router.delete('/:stationId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await stationController.deleteStation(req, res, conn);
    if (conn) conn.close();
});

export default router;
