import { Request, Response } from "express";
import { Connection } from "odbc";
import * as airlineService from "../../services/maintenance/airline";

export async function getAirlineDropdown(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const airportCode = req.query.airportCode as string || '';
        const scenarioType = req.query.scenarioType as 'IMPORT' | 'EXPORT';
        const searchTerm = req.query.searchTerm as string || '';
        const airlineInfo = await airlineService.getAirlineDropdown(conn, scenarioType, airportCode, searchTerm);
        res.json({ success: true, data: airlineInfo });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}