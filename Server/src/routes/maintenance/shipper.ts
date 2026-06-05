import { Router, Response, Request } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as shipperController from '../../controllers/maintenance/shipper';

const router = Router();

router.get('/dropdown', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await shipperController.getShipperInfoDropdown(req, res, conn);
    if (conn) conn.close();
});

export default router;