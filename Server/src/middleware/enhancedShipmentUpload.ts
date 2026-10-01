import multer from "multer";
import { RequestHandler } from "express";
import { mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import {
    EnhancedShipmentImageFile,
    removeEnhancedStoredImage,
    saveEnhancedBase64Image,
} from "../utils/enhancedShipmentImageStorage";

const uploadDirectory = join(process.cwd(), "uploads", "shipments");
mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
        const extension = file.originalname.includes(".")
            ? file.originalname.substring(file.originalname.lastIndexOf("."))
            : "";
        callback(null, `${randomUUID()}${extension}`);
    },
});

const multerEnhancedShipmentUpload = multer({
    storage,
    limits: {
        files: 100,
        fileSize: 10 * 1024 * 1024,
        fields: 101,
        fieldSize: 14 * 1024 * 1024,
        parts: 201,
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            callback(new Error(`Unsupported upload type for ${file.fieldname}; image files are required`));
            return;
        }
        callback(null, true);
    },
}).any();

export const enhancedShipmentUpload: RequestHandler = (req, res, next) => {
    if (!req.is("multipart/form-data")) {
        next();
        return;
    }
    multerEnhancedShipmentUpload(req, res, next);
};

export async function materializeEnhancedShipmentBase64Fields(
    body: Record<string, any>,
    payload: Record<string, any>,
    files: EnhancedShipmentImageFile[]
): Promise<void> {
    const handlingUnits = payload.commodityDetails?.handlingUnits;
    if (!Array.isArray(handlingUnits)) return;

    const createdImagePaths: string[] = [];
    try {
        for (const [handlingUnitIndex, handlingUnit] of handlingUnits.entries()) {
            if (!Array.isArray(handlingUnit.images)) continue;
            for (const [imageIndex, image] of handlingUnit.images.entries()) {
                if (!image) continue;
                if (image.base64 !== undefined) {
                    throw new Error("Image data must be sent as an indexed multipart field, not inside the JSON payload");
                }
                if (image.imageId !== undefined || image.delete === true) continue;

                const fieldName = `handlingUnit-${handlingUnitIndex}-${imageIndex}`;
                const base64 = body[fieldName];
                if (base64 === undefined) continue;
                if (typeof base64 !== "string" || !base64.trim()) {
                    throw new Error(`Form-data field ${fieldName} must contain one Base64 image string`);
                }

                const imagePath = await saveEnhancedBase64Image(base64.trim());
                createdImagePaths.push(imagePath);
                const filename = imagePath.substring(imagePath.lastIndexOf("/") + 1);
                files.push({ fieldname: fieldName, filename });
                delete body[fieldName];
            }
        }
    } catch (error) {
        for (const imagePath of createdImagePaths) await removeEnhancedStoredImage(imagePath);
        throw error;
    }
}

export function parseEnhancedShipmentPayload(body: Record<string, any>): Record<string, any> {
    const rawPayload = body.payload ?? body.shipmentPayload ?? body.data;
    let payload: Record<string, any>;
    if (typeof rawPayload === "string") {
        payload = JSON.parse(rawPayload);
    } else if (rawPayload && typeof rawPayload === "object") {
        payload = { ...rawPayload };
    } else {
        payload = { ...body };
        for (const field of ["shipmentDetails", "customerDetails", "commodityDetails", "carrierDetails", "shipmentRateDetails"]) {
            if (typeof payload[field] === "string") payload[field] = JSON.parse(payload[field]);
        }
    }

    return payload;
}
