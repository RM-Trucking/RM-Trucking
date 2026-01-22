import { Router, Request, Response } from 'express';
import { db } from '../../config/db2';
import { authenticateJWT } from '../../middleware/auth';
import * as customerController from '../../controllers/maintenance/customer';

const router = Router();

/**
 * POST /api/customers
 * Create a new customer
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerController.createCustomer(req, res, conn);
    if (conn) conn.close();
});


router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerController.getAllCustomers(req, res, conn);
    if (conn) conn.close();
});


/**
 * GET /api/customers/:customerId
 * Get customer details
 */
router.get('/:customerId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerController.getCustomer(req, res, conn);
    if (conn) conn.close();
});

/**
 * PUT /api/customers/:customerId
 * Update customer details
 */
router.put('/:customerId', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerController.updateCustomer(req, res, conn);
    if (conn) conn.close();
});

/**
 * DELETE /api/customers/:customerId
 * Toggle customer active status (activate/deactivate)
 */
router.put('/:customerId/toggle', authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await customerController.toggleCustomerStatus(req, res, conn);
    if (conn) conn.close();
});


export default router;
