import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as roleController from '../../controllers/maintenance/role';

const router = Router();


router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await roleController.createRole(req, res, conn);
    if (conn) conn.close();
});

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await roleController.getAllRoles(req, res, conn);
    if (conn) conn.close();
});

router.get('/:roleId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await roleController.getRole(req, res, conn);
    if (conn) conn.close();
});

router.put('/:roleId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await roleController.updateRole(req, res, conn);
    if (conn) conn.close();
});

router.delete('/:roleId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await roleController.deleteRole(req, res, conn);
    if (conn) conn.close();
});

export default router;
