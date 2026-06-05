import { Request, Response } from "express";
import { Connection } from "odbc";
import * as shipmentService from "../../services/shipment";


export async function createNetworkShipment(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const createReq = req.body;
        const userId = (req as any).user?.userId || 1; // fallback if auth not provided

        console.log("Received create network shipment request:", createReq, userId);

        const shipment = await shipmentService.createNetworkShipment(conn, createReq, userId);

        res.status(201).json({
            success: true,
            message: "Network shipment created successfully",
            data: shipment
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}