import { promises as fs } from "fs";
import { homedir } from "os";
import { basename, isAbsolute, join, normalize, relative, resolve, sep } from "path";
import { randomUUID } from "crypto";
import { HANDLING_UNIT_IMAGE_PATH } from "../config/env";

export const enhancedShipmentImageRoute = "/api/uploads/network-shipment/handling-unit-image";
export const enhancedShipmentImageExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
};

export function getEnhancedShipmentImageDirectory(): string {
    const configuredPath = HANDLING_UNIT_IMAGE_PATH?.trim();
    if (!configuredPath) throw new Error("HANDLING_UNIT_IMAGE_PATH must be configured");

    const expandedPath = configuredPath.startsWith("~")
        ? join(homedir(), configuredPath.slice(1))
        : configuredPath;
    return isAbsolute(expandedPath)
        ? normalize(expandedPath)
        : resolve(process.cwd(), expandedPath);
}

export interface EnhancedShipmentImageFile {
    fieldname: string;
    filename: string;
}

export interface EnhancedShipmentImageInput {
    imageId?: number;
    delete?: boolean;
    imagePath?: string;
}

export async function saveEnhancedBase64Image(base64: string): Promise<string> {
    const dataUrlMatch = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    const prefixedBase64Match = base64.match(/^base64,(.+)$/);

    const mimeType = dataUrlMatch?.[1] ?? "image/jpeg";
    const extension = enhancedShipmentImageExtensions[mimeType as keyof typeof enhancedShipmentImageExtensions];
    if (!extension) throw new Error(`Unsupported image type: ${mimeType}`);

    const data = (dataUrlMatch?.[2] ?? prefixedBase64Match?.[1] ?? base64).replace(/\s/g, "");
    const paddingLength = data.match(/=+$/)?.[0].length ?? 0;
    const unpaddedLength = data.length - paddingLength;
    if (
        !/^[A-Za-z0-9+/]+={0,2}$/.test(data)
        || unpaddedLength % 4 === 1
        || (paddingLength > 0 && data.length % 4 !== 0)
        || (paddingLength === 1 && unpaddedLength % 4 !== 3)
        || (paddingLength === 2 && unpaddedLength % 4 !== 2)
    ) {
        throw new Error("Invalid image Base64 format");
    }

    const filename = `${randomUUID()}.${extension}`;
    const uploadDirectory = getEnhancedShipmentImageDirectory();
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(join(uploadDirectory, filename), Buffer.from(data, "base64"));
    return join(enhancedShipmentImageRoute, filename).replace(/\\/g, "/");
}

export async function removeEnhancedStoredImage(imagePath?: string): Promise<void> {
    if (!imagePath) return;
    const normalizedPath = imagePath.replace(/\\/g, "/");
    const isPublicRoutePath = normalizedPath.startsWith(`${enhancedShipmentImageRoute}/`);
    const absolutePath = isPublicRoutePath
        ? join(getEnhancedShipmentImageDirectory(), basename(normalizedPath))
        : resolve(process.cwd(), normalizedPath.replace(/^[/]+/, ""));
    const pathFromDirectory = relative(getEnhancedShipmentImageDirectory(), absolutePath);
    const isAllowedPath = pathFromDirectory !== ""
        && pathFromDirectory !== ".."
        && !pathFromDirectory.startsWith(`..${sep}`)
        && !isAbsolute(pathFromDirectory);
    if (!isAllowedPath) return;
    await fs.unlink(absolutePath).catch(() => undefined);
}

export function getEnhancedUploadedImagePath(file: EnhancedShipmentImageFile): string {
    return join(enhancedShipmentImageRoute, file.filename).replace(/\\/g, "/");
}
