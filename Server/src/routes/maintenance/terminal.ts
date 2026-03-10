import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as terminalController from '../../controllers/maintenance/terminal';

const router = Router();

/**
 * POST /api/terminals
 * Create a new terminal
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await terminalController.createTerminal(req, res, conn);
    if (conn) conn.close();
});

/**
 * GET /api/terminals/:terminalId
 * Get a terminal by ID
 */
router.get('/:terminalId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await terminalController.getTerminal(req, res, conn);
    if (conn) conn.close();
});

/**
 * GET /api/carriers/:carrierId/terminals
 * Get all terminals for a carrier
 */
router.get('/carrier/:carrierId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await terminalController.getTerminalsForCarrier(req, res, conn);
    if (conn) conn.close();
});

/**
 * PUT /api/terminals/:terminalId
 * Update a terminal
 */
router.put('/:terminalId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await terminalController.updateTerminal(req, res, conn);
    if (conn) conn.close();
});

/**
 * DELETE /api/terminals/:terminalId
 * Soft delete a terminal
 */
router.delete('/:terminalId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await terminalController.deleteTerminal(req, res, conn);
    if (conn) conn.close();
});

export default router;
