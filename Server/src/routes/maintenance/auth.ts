import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as userController from '../../controllers/maintenance/user';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    const conn = await db();
    await userController.login(req, res, conn);
    if (conn) conn.close();
});

router.post('/refresh', async (req: Request, res: Response) => {
    const conn = await db();
    await userController.refreshToken(req, res, conn);
    if (conn) conn.close();
});

router.post('/logout', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.logout(req, res, conn);
    if (conn) conn.close();
});

export default router;
