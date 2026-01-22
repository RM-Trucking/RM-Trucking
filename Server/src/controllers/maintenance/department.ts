import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as departmentService from '../../services/maintenance/department';

/**
 * Create a new department
 */
export async function createDepartment(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 1;
        const department = await departmentService.createDepartmentService(conn, req.body, userId);
        res.status(201).json({ success: true, data: department });
    } catch (error) {
        console.error(error);

        if ((error as Error).message.includes('Email')) {
            res.status(409).json({
                error: 'Duplicate email',
                message: (error as Error).message
            });
        } else {
            res.status(400).json({
                error: 'Failed to create department',
                message: (error as Error).message
            });
        }
    }
}


/**
 * Get a department by ID
 */
export async function getDepartment(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { departmentId } = req.params;
        const department = await departmentService.getDepartmentService(conn, parseInt(departmentId, 10));
        if (!department) {
            res.status(404).json({ error: 'Department not found' });
            return;
        }
        res.status(200).json({ success: true, data: department });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch department',
            message: (error as Error).message
        });
    }
}

/**
 * Get all departments for a station
 */
export async function getDepartmentsForStation(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { stationId } = req.params;
        const departments = await departmentService.getDepartmentsForStationService(conn, parseInt(stationId, 10));
        res.status(200).json({ success: true, data: departments });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch departments',
            message: (error as Error).message
        });
    }
}

/**
 * Update a department
 */
export async function updateDepartment(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { departmentId } = req.params;
        const userId = (req as any).user?.userId || 1;
        const updated = await departmentService.updateDepartmentService(conn, parseInt(departmentId, 10), req.body, userId);
        res.status(200).json({
            success: true,
            message: 'Department updated successfully',
            data: updated
        });
    } catch (error) {

        console.log(error);


        res.status(400).json({
            error: 'Failed to update department',
            message: (error as Error).message
        });
    }
}

/**
 * Delete a department
 */
export async function deleteDepartment(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { departmentId } = req.params;
        const userId = (req as any).user?.userId || 1;
        await departmentService.deleteDepartmentService(conn, parseInt(departmentId, 10), userId);
        res.status(200).json({
            success: true,
            message: 'Department deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete department',
            message: (error as Error).message
        });
    }
}
