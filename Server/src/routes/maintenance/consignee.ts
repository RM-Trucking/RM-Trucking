import { Router, Request, Response } from "express";
import { db } from "../../config/db2";
import { authenticateJWT } from "../../middleware/auth";
import * as consigneeController from "../../controllers/maintenance/consignee";

const router = Router();

router.get('/dropdown', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await consigneeController.getConsigneeInfoDropdown(req, res, conn);
    if (conn) conn.close();
});

export default router;