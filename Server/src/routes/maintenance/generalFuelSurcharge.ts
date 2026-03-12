import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { db } from '../../config/db2';
import * as generalFuelController from '../../controllers/maintenance/generalFuelSurcharge';

const router = Router();

// ✅ Create a new general fuel surcharge
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await generalFuelController.createGeneralFuelSurcharge(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get all general fuel surcharges
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await generalFuelController.getGeneralFuelSurcharges(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get surcharge by ID
router.get('/:fuelSurchargeId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await generalFuelController.getGeneralFuelSurchargeById(req, res, conn);
    if (conn) conn.close();
});

// ✅ Update surcharge
router.put('/:fuelSurchargeId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await generalFuelController.updateGeneralFuelSurcharge(req, res, conn);
    if (conn) conn.close();
});

// ✅ Delete surcharge
router.delete('/:fuelSurchargeId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await generalFuelController.deleteGeneralFuelSurcharge(req, res, conn);
    if (conn) conn.close();
});

export default router;
