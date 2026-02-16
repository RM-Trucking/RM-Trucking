import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { db } from '../../config/db2';
import * as zoneController from '../../controllers/maintenance/zone';

const router = Router();

/**
 * POST /api/maintenance/zone
 * Create a new zone with zip codes, ranges, and notes
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.createZone(req, res, conn);
    if (conn) conn.close();
});

/**
 * GET /api/maintenance/zone?page=1&pageSize=10&search=North
 * Paginated list of zones, optionally filtered by zoneName
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.listZones(req, res, conn);
    if (conn) conn.close();
});


/**
 * GET /api/maintenance/zone/dropdown
 * Lightweight list of zones for dropdowns (zoneId, zoneName, zipCodes, ranges)
 */
router.get('/dropdown', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.listZonesDropdown(req, res, conn);
    if (conn) conn.close();
});


/**
 * GET /api/maintenance/zone/:zoneId
 * Get zone details by ID (including zips and notes)
 */
router.get('/:zoneId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.getZone(req, res, conn);
    if (conn) conn.close();
});

/**
 * PUT /api/maintenance/zone/:zoneId
 * Update zone name or active status
 */
router.put('/:zoneId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.updateZone(req, res, conn);
    if (conn) conn.close();
});

/**
 * DELETE /api/maintenance/zone/:zoneId
 * Soft delete (deactivate) a zone
 */
router.delete('/:zoneId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.deleteZone(req, res, conn);
    if (conn) conn.close();
});

export default router;
