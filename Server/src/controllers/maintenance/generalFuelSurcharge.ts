import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as generalFuelService from '../../services/maintenance/generalFuelSurcharge';

// ✅ Create General Fuel Surcharge
export async function createGeneralFuelSurcharge(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await generalFuelService.createGeneralFuelSurcharge(
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
            error: 'Failed to create general fuel surcharge',
            message: (error as Error).message
        });
    }
}

// ✅ Get All General Fuel Surcharges (with pagination)
export async function getGeneralFuelSurcharges(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const page = parseInt((req.query.page as string) || '1', 10);
        const pageSize = parseInt((req.query.pageSize as string) || '10', 10);

        const result = await generalFuelService.getGeneralFuelSurcharges(conn, page, pageSize);

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
            error: 'Failed to fetch general fuel surcharges',
            message: (error as Error).message
        });
    }
}

// ✅ Get General Fuel Surcharge by ID
export async function getGeneralFuelSurchargeById(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { fuelSurchargeId } = req.params;
        const result = await generalFuelService.getGeneralFuelSurchargeById(conn, parseInt(fuelSurchargeId, 10));

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch general fuel surcharge',
            message: (error as Error).message
        });
    }
}

// ✅ Update General Fuel Surcharge
export async function updateGeneralFuelSurcharge(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { fuelSurchargeId } = req.params;
        await generalFuelService.updateGeneralFuelSurcharge(
            conn,
            parseInt(fuelSurchargeId, 10),
            req.body,
            req.user?.userId || 1
        );

        res.status(200).json({
            success: true,
            message: 'General surcharge updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update general fuel surcharge',
            message: (error as Error).message
        });
    }
}

// ✅ Delete General Fuel Surcharge
export async function deleteGeneralFuelSurcharge(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { fuelSurchargeId } = req.params;
        await generalFuelService.deleteGeneralFuelSurcharge(conn, parseInt(fuelSurchargeId, 10));

        res.status(200).json({
            success: true,
            message: 'General surcharge deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete general fuel surcharge',
            message: (error as Error).message
        });
    }
}
