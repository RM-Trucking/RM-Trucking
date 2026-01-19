import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as zoneController from '../../controllers/maintenance/zone';

const router = Router();

// ...existing code...
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.createZoneHandler(req, res, conn);
    if (conn) conn.close();
});

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.getAllZonesHandler(req, res, conn);
    if (conn) conn.close();
});

router.get('/:zoneId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.getZoneByIdHandler(req, res, conn);
    if (conn) conn.close();
});

router.post('/zone-zips', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.addZoneZipHandler(req, res, conn);
    if (conn) conn.close();
});

router.get('/:zoneId/zone-zips', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.getZoneZipsByZoneHandler(req, res, conn);
    if (conn) conn.close();
});

router.get('/zone-zips', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await zoneController.getAllZoneZipsHandler(req, res, conn);
    if (conn) conn.close();
});

export default router;
