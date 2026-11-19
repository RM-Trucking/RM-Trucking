import { Request, Response } from "express";
import { Connection } from "odbc";
import * as shipmentService from "../../services/shipment";
import {
    materializeEnhancedShipmentBase64Fields,
    parseEnhancedShipmentPayload,
} from "../../middleware/enhancedShipmentUpload";
import {
    getEnhancedUploadedImagePath,
    removeEnhancedStoredImage,
} from "../../utils/enhancedShipmentImageStorage";

function makeJsonSafe(value: any): any {
    if (typeof value === "bigint") {
        return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
            ? Number(value)
            : value.toString();
    }
    if (Array.isArray(value)) return value.map(makeJsonSafe);
    if (value && typeof value === "object" && !(value instanceof Date)) {
        return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, makeJsonSafe(nestedValue)]));
    }
    return value;
}

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
            data: makeJsonSafe(shipment)
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
            data: makeJsonSafe(result.items),
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

export async function editShipmentEnhanced(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const shipmentId = Number(req.params.shipmentId);
        if (Number.isNaN(shipmentId) || shipmentId <= 0) {
            res.status(400).json({ success: false, message: "Invalid shipmentId" });
            return;
        }

        const userId = (req as any).user?.userId || 1;
        const body = req.body ?? {};
        const payload = parseEnhancedShipmentPayload(body);
        const files = ((req as any).files ?? []) as Array<{ fieldname: string; filename: string }>;
        const payloadShipmentId = payload.shipmentDetails?.shipmentId;
        if (payloadShipmentId !== undefined && Number(payloadShipmentId) !== shipmentId) {
            await Promise.all(files.map((file) =>
                removeEnhancedStoredImage(getEnhancedUploadedImagePath(file))
            ));
            res.status(400).json({
                success: false,
                message: `Route shipmentId ${shipmentId} does not match payload shipmentId ${payloadShipmentId}`,
            });
            return;
        }
        await materializeEnhancedShipmentBase64Fields(body, payload, files);
        const result = await shipmentService.editShipmentEnhanced(
            conn,
            shipmentId,
            payload,
            userId,
            files
        );

        res.status(200).json({
            success: true,
            message: "Enhanced shipment updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

