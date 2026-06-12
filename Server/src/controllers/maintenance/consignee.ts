import { Request, Response } from "express";
import { Connection } from "odbc";
import * as consigneeService from "../../services/maintenance/consignee";

export async function getConsigneeInfoDropdown(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const searchTerm = req.query.searchTerm as string || '';
        const consigneeInfo = await consigneeService.getConsigneeInfoDropdown(conn, searchTerm);
        res.json({ success: true, data: consigneeInfo });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}