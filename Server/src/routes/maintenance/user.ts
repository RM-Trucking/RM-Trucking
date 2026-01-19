import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as userController from '../../controllers/maintenance/user';

const router = Router();

router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.createUser(req, res, conn);
    if (conn) conn.close();
});

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.getAllUsers(req, res, conn);
    if (conn) conn.close();
});

router.get('/:userId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.getUser(req, res, conn);
    if (conn) conn.close();
});

router.put('/:userId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.updateUser(req, res, conn);
    if (conn) conn.close();
});

router.post('/:userId/change-password', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.changePassword(req, res, conn);
    if (conn) conn.close();
});

router.post('/:userId/reset-password', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.resetPassword(req, res, conn);
    if (conn) conn.close();
});

router.delete('/:userId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.deleteUser(req, res, conn);
    if (conn) conn.close();
});

router.get('/role/:roleId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await userController.getUsersByRole(req, res, conn);
    if (conn) conn.close();
});

export default router;
