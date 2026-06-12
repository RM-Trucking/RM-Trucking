import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { db } from '../../config/db2';
import * as shipmentController from '../../controllers/shipment';

const router = Router();

// ✅ Create a new shipment
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await shipmentController.createNetworkShipment(req, res, conn);
    if (conn) conn.close();
});

export default router;