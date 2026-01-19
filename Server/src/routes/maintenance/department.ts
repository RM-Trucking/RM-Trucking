import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as departmentController from '../../controllers/maintenance/department';

const router = Router();

/**
 * POST /api/departments
 * Create a new department
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await departmentController.createDepartment(req, res, conn);
    if (conn) conn.close();
});

/**
 * GET /api/departments/:departmentId
 * Get a department by ID
 */
router.get('/:departmentId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await departmentController.getDepartment(req, res, conn);
    if (conn) conn.close();
});

/**
 * GET /api/stations/:stationId/departments
 * Get all departments for a station
 */
router.get('/station/:stationId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await departmentController.getDepartmentsForStation(req, res, conn);
    if (conn) conn.close();
});

/**
 * PUT /api/departments/:departmentId
 * Update a department
 */
router.put('/:departmentId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await departmentController.updateDepartment(req, res, conn);
    if (conn) conn.close();
});

/**
 * DELETE /api/departments/:departmentId
 * Delete a department
 */
router.delete('/:departmentId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await departmentController.deleteDepartment(req, res, conn);
    if (conn) conn.close();
});

export default router;
