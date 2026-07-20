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

export async function getNetworkShipmentView(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const shipmentId = Number(req.params.shipmentId);
        if (Number.isNaN(shipmentId) || shipmentId <= 0) {
            res.status(400).json({ success: false, message: "Invalid shipmentId" });
            return;
        }

        const shipment = await shipmentService.getNetworkShipmentView(conn, shipmentId);

        if (!shipment) {
            res.status(404).json({ success: false, message: "Shipment not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Network shipment retrieved successfully",
            data: shipment
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

export async function getNetworkShipmentForms(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const pagination = shipmentService.normalizePaginationParams(req.query.page, req.query.limit);
        const result = await shipmentService.getNetworkShipmentForms(conn, pagination);

        res.status(200).json({
            success: true,
            message: "Shipments retrieved successfully",
            data: result.items,
            pagination: result.pagination
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

export async function updateNetworkShipment(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const shipmentId = Number(req.params.shipmentId);
        if (Number.isNaN(shipmentId) || shipmentId <= 0) {
            res.status(400).json({ success: false, message: "Invalid shipmentId" });
            return;
        }

        const updateReq = req.body;

        const updated = await shipmentService.updateNetworkShipment(conn, shipmentId, updateReq);

        res.status(200).json({
            success: true,
            message: "Network shipment updated successfully",
            data: updated
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}
