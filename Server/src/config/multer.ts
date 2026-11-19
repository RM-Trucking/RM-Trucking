import multer from "multer";
import { mkdirSync } from "fs";
import { randomUUID } from "crypto";
import {
    enhancedShipmentImageExtensions,
    getEnhancedShipmentImageDirectory,
} from "../utils/enhancedShipmentImageStorage";

const uploadDirectory = getEnhancedShipmentImageDirectory();
const allowedImageTypes = new Set(Object.keys(enhancedShipmentImageExtensions));
mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
        const extension = enhancedShipmentImageExtensions[file.mimetype as keyof typeof enhancedShipmentImageExtensions];
        callback(null, `${randomUUID()}${extension}`);
    },
});

export const enhancedShipmentImageUploader = multer({
    storage,
    limits: {
        files: 100,
        fileSize: 10 * 1024 * 1024,
        fields: 101,
        fieldSize: 14 * 1024 * 1024,
        parts: 201,
    },
    fileFilter: (_req, file, callback) => {
        if (!allowedImageTypes.has(file.mimetype)) {
            callback(new Error(`Unsupported upload type for ${file.fieldname}; image files are required`));
            return;
        }
        callback(null, true);
    },
}).any();