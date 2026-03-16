import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { db } from '../../config/db2';
import * as personnelController from '../../controllers/maintenance/carrierPersonnel';

const router = Router();

// ✅ Create personnel
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await personnelController.createPersonnel(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get personnel by ID
router.get('/:personnelId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await personnelController.getCarrierPersonnelById(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get personnel by terminal
router.get('/terminal/:terminalId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await personnelController.getCarrierPersonnelByTerminal(req, res, conn);
    if (conn) conn.close();
});

// ✅ Update personnel
router.put('/:personnelId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await personnelController.updateCarrierPersonnel(req, res, conn);
    if (conn) conn.close();
});

// ✅ Soft delete personnel
router.delete('/:personnelId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await personnelController.deleteCarrierPersonnel(req, res, conn);
    if (conn) conn.close();
});

export default router;
