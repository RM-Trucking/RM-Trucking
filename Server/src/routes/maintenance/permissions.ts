import { Router, Request, Response } from 'express';
import * as permissionsController from '../../controllers/maintenance/permissions';
import { db } from '../../config/db2';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const conn = await db();
    await permissionsController.getPermissions(req, res, conn);
    if (conn) conn.close();
});

export default router;
