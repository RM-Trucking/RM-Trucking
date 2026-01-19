import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { db } from '../../config/db2';
import * as accessorialController from '../../controllers/maintenance/accessorial';

const router = Router();

// ✅ Create a new accessorial
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await accessorialController.createAccessorial(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get all accessorials (for dropdown)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await accessorialController.getAllAccessorials(req, res, conn);
    if (conn) conn.close();
});

export default router;
