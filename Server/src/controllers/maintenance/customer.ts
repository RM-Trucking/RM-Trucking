import { Request, Response } from 'express';
import { Connection } from 'odbc';
import { CreateCustomerRequest, UpdateCustomerRequest } from '../../entities/maintenance';
import * as customerService from '../../services/maintenance/customer';

/**
 * Customer Controller
 */

/**
 * POST /api/customers
 * Create a new customer (admin only)
 */
export async function createCustomer(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const createReq: CreateCustomerRequest = req.body;
        const adminId = (req as any).user?.userId || 1;

        if (!createReq.customerName || !createReq.rmAccountNumber || !createReq.phoneNumber || !createReq.website) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const { customer } = await customerService.createNewCustomer(conn, createReq, adminId);

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: {
                customer
            }
        });
    } catch (error) {
        console.log(error);

        res.status(400).json({
            error: 'Failed to create customer',
            message: (error as Error).message
        });
    }
}

/**
 * GET /api/customers/:customerId
 * Get customer details
 */
export async function getCustomer(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { customerId } = req.params;
        const customer = await customerService.getCustomerDetails(conn, parseInt(customerId, 10));

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(404).json({
            error: 'Customer not found',
            message: (error as Error).message
        });
    }
}

/**
 * GET /api/customers
 * Get all customers with search + pagination
 */
export async function getAllCustomers(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const searchTerm = (req.query.search as string) || null;
        const page = parseInt((req.query.page as string) || '1', 10);
        const pageSize = parseInt((req.query.pageSize as string) || '10', 10);

        const result = await customerService.getAllCustomersService(conn, searchTerm, page, pageSize);

        res.status(200).json({
            success: true,
            data: result.customers,
            pagination: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch customers',
            message: (error as Error).message
        });
    }
}


/**
 * PUT /api/customers/:customerId
 * Update customer details
 */

export async function updateCustomer(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { customerId } = req.params;
        const updateReq: UpdateCustomerRequest = req.body;
        const adminId = (req as any).user?.userId || 1;

        const updatedCustomer = await customerService.updateCustomer(
            conn,
            parseInt(customerId, 10),
            updateReq,
            adminId
        );

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: updatedCustomer
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update customer',
            message: (error as Error).message
        });
    }
}

/**
 * DELETE /api/customers/:customerId
 * Delete customer
 */
export async function deleteCustomer(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { customerId } = req.params;

        await customerService.deleteCustomer(conn, parseInt(customerId, 10));

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete customer',
            message: (error as Error).message
        });
    }
}
