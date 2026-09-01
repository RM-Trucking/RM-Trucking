import { Request, Response } from "express";
import { Connection } from "odbc";
import * as shipmentService from "../../services/shipment";

// export async function createNetworkShipment(req: Request, res: Response, conn: Connection): Promise<void> {
//     try {
//         const createReq = req.body;
//         const userId = (req as any).user?.userId || 1;

//         console.log("Received create network shipment request:", createReq, userId);

//         const shipment = await shipmentService.createNetworkShipment(conn, createReq, userId);

//         res.status(201).json({
//             success: true,
//             message: "Network shipment created successfully",
//             data: shipment
//         });
//     } catch (error: any) {
//         console.log(error);
//         res.status(400).json({ success: false, message: error.message });
//     }
// }

export async function createShipmentFlow(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const payload = req.body;
        const userId = (req as any).user?.userId || 1;

        console.log("Received create shipment flow request:", payload, userId);

        const result = await shipmentService.createShipmentFlow(conn, payload, userId);

        res.status(201).json({
            success: true,
            message: "Shipment flow created successfully",
            data: result
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

export async function editShipmentFlow(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const shipmentId = Number(req.params.shipmentId);
        if (Number.isNaN(shipmentId) || shipmentId <= 0) {
            res.status(400).json({ success: false, message: "Invalid shipmentId" });
            return;
        }

        const payload = req.body;
        const userId = (req as any).user?.userId || 1;

        console.log("Received edit shipment flow request:", { shipmentId, payload, userId });

        const result = await shipmentService.editShipmentFlow(conn, shipmentId, payload, userId);

        res.status(200).json({
            success: true,
            message: "Shipment flow updated successfully",
            data: result
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

