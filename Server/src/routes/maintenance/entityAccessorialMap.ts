import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { db } from '../../config/db2';
import * as entityAccessorialMapController from '../../controllers/maintenance/entityAccessorialMap';

const router = Router();

// ✅ Create a new entity-accessorial mapping
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await entityAccessorialMapController.createEntityAccessorialMap(req, res, conn);
    if (conn) conn.close();
});

// ✅ Get all accessorial mappings for a given entity
router.get('/:entityId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await entityAccessorialMapController.getAccessorialsForEntity(req, res, conn);
    if (conn) conn.close();
});

// ✅ Update an entity-accessorial mapping
router.put('/:entityAccessorialId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await entityAccessorialMapController.updateEntityAccessorialMap(req, res, conn);
    if (conn) conn.close();
});


// ✅ Delete an entity-accessorial mapping
router.delete('/:entityAccessorialId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await entityAccessorialMapController.deleteEntityAccessorialMap(req, res, conn);
    if (conn) conn.close();
});

export default router;
