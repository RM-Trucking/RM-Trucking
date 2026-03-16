import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as customerFuelService from '../../services/maintenance/customerFuelSurcharge';

// ✅ Create Customer Fuel Surcharge
export async function createCustomerFuelSurcharge(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await customerFuelService.createCustomerFuelSurcharge(
            conn,
            req.body,
            req.user?.userId || 1
        );
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to create customer fuel surcharge',
            message: (error as Error).message
        });
    }
}

// ✅ Get All Customer Fuel Surcharges (with pagination)
export async function getCustomerFuelSurcharges(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const page = parseInt((req.query.page as string) || '1', 10);
        const pageSize = parseInt((req.query.pageSize as string) || '10', 10);

        const result = await customerFuelService.getCustomerFuelSurcharges(conn, page, pageSize);

        res.status(200).json({
            success: true,
            data: result.surcharges,
            pagination: {
                total: result.total || 0,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch customer fuel surcharges',
            message: (error as Error).message
        });
    }
}

// ✅ Get Customer Fuel Surcharge by ID
export async function getCustomerFuelSurchargeById(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { customerFuelSurchargeId } = req.params;
        const result = await customerFuelService.getCustomerFuelSurchargeById(conn, parseInt(customerFuelSurchargeId, 10));

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch customer fuel surcharge',
            message: (error as Error).message
        });
    }
}

// ✅ Update Customer Fuel Surcharge
export async function updateCustomerFuelSurcharge(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { customerFuelSurchargeId } = req.params;
        await customerFuelService.updateCustomerFuelSurcharge(
            conn,
            parseInt(customerFuelSurchargeId, 10),
            req.body,
            req.user?.userId || 1
        );

        res.status(200).json({
            success: true,
            message: 'Customer surcharge updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update customer fuel surcharge',
            message: (error as Error).message
        });
    }
}

// ✅ Delete Customer Fuel Surcharge
export async function deleteCustomerFuelSurcharge(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { customerFuelSurchargeId } = req.params;
        await customerFuelService.deleteCustomerFuelSurcharge(conn, parseInt(customerFuelSurchargeId, 10));

        res.status(200).json({
            success: true,
            message: 'Customer surcharge deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete customer fuel surcharge',
            message: (error as Error).message
        });
    }
}
