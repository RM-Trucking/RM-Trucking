import { promises as fs } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const uploadDirectory = join(process.cwd(), "uploads", "shipments");

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
    const rawBase64Match = base64.match(/^base64,(.+)$/);
    if (!dataUrlMatch && !rawBase64Match) throw new Error("Invalid image Base64 format");

    const mimeType = dataUrlMatch?.[1] ?? "image/jpeg";
    const data = dataUrlMatch?.[2] ?? rawBase64Match?.[1];
    const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
    const filename = `${randomUUID()}.${extension}`;
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(join(uploadDirectory, filename), Buffer.from(data!, "base64"));
    return join("uploads", "shipments", filename).replace(/\\/g, "/");
}

export async function removeEnhancedStoredImage(imagePath?: string): Promise<void> {
    if (!imagePath) return;
    const relativePath = imagePath.replace(/^[/\\]+/, "");
    const absolutePath = join(process.cwd(), relativePath);
    if (!absolutePath.startsWith(uploadDirectory)) return;
    await fs.unlink(absolutePath).catch(() => undefined);
}

export function getEnhancedUploadedImagePath(file: EnhancedShipmentImageFile): string {
    return join("uploads", "shipments", file.filename).replace(/\\/g, "/");
}
