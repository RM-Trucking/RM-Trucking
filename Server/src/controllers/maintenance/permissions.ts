import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as permissionsService from '../../services/maintenance/permission';

export async function getPermissions(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const permissions = await permissionsService.getPermissions(conn);


        res.status(200).json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.log(error);

        res.status(404).json({
            error: 'Permissions not found',
            message: (error as Error).message
        });
    }
}
