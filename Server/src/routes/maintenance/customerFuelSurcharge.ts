import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { db } from '../../config/db2';
import * as customerFuelController from '../../controllers/maintenance/customerFuelSurcharge';

const router = Router();

// ✅ Create a new customer fuel surcharge
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerFuelController.createCustomerFuelSurcharge(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get all customer fuel surcharges
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerFuelController.getCustomerFuelSurcharges(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get surcharge by ID
router.get('/:customerFuelSurchargeId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerFuelController.getCustomerFuelSurchargeById(req, res, conn);
    if (conn) conn.close();
});

// ✅ Update surcharge
router.put('/:customerFuelSurchargeId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerFuelController.updateCustomerFuelSurcharge(req, res, conn);
    if (conn) conn.close();
});

// ✅ Delete surcharge
router.delete('/:customerFuelSurchargeId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerFuelController.deleteCustomerFuelSurcharge(req, res, conn);
    if (conn) conn.close();
});

export default router;
