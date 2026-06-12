import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as shipperService from '../../services/maintenance/shipper';

export async function getShipperInfoDropdown(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const searchTerm = req.query.searchTerm as string || '';
        const shipperInfo = await shipperService.getShipperInfoDropdown(conn, searchTerm);
        res.json({ success: true, data: shipperInfo });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}