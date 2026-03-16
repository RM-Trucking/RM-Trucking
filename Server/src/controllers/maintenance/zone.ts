import { Request, Response } from "express";
import { Connection } from "odbc";
import {
    createZoneService,
    getZoneService,
    updateZoneService,
    deleteZoneService,
    listZonesService,
    listZonesDropdownService,
    checkZipZoneService,
    searchZonesByZipsAndRangesService
} from "../../services/maintenance/zone";
import { CreateZoneRequest, UpdateZoneRequest } from "../../entities/maintenance/Zone";

// -------------------- Create Zone --------------------
export async function createZone(req: Request, res: Response, conn: Connection) {
    try {
        const userId = req.user?.userId || 0;
        const zoneReq: CreateZoneRequest = req.body;
        const force = req.query.force === "true";

        const result = await createZoneService(conn, zoneReq, userId, force);

        if (result.conflicts) {
            // Conflict case: still success, but message differs
            res.status(200).json({
                success: true,
                message: "Conflict detected. Some zips already belong to other zones.",
                data: result.zone,        // attempted zone
                conflicts: result.conflicts,
                zones: result.zoneList    // full zone objects
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: "Zone created successfully",
            data: result.zone
        });
    } catch (error: any) {

        console.log(error);


        // Handle duplicate zone name error separately
        if (error.message && error.message.includes("already exists")) {
            res.status(400).json({
                success: false,
                message: error.message
            });
            return;
        }

        // Generic error fallback
        res.status(400).json({
            success: false,
            message: error.message || "Failed to create zone"
        });
    }
}



export async function listZonesDropdown(req: Request, res: Response, conn: Connection) {
    try {
        const input = (req.query.input as string) || null;

        let zones;
        if (input) {
            // If input is provided, run autocomplete search
            zones = await searchZonesByZipsAndRangesService(conn, input);
        } else {
            // Otherwise, return all active zones
            zones = await listZonesDropdownService(conn);
        }

        res.json({ success: true, data: zones });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}



export async function listZones(req: Request, res: Response, conn: Connection) {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
        const searchTerm = req.query.search as string | undefined;

        const result = await listZonesService(conn, page, pageSize, searchTerm);

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                total: result.total || 0,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}



// -------------------- Get Zone By Id --------------------
export async function getZone(req: Request, res: Response, conn: Connection) {
    try {
        const zoneId = parseInt(req.params.zoneId, 10);
        const zone = await getZoneService(conn, zoneId);

        res.json({ success: true, data: zone });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
}

// -------------------- Update Zone --------------------
export async function updateZone(req: Request, res: Response, conn: Connection) {
    try {
        const zoneId = parseInt(req.params.zoneId, 10);
        const userId = req.user?.userId || 0;
        const force = req.query.force === "true";
        const zoneReq: UpdateZoneRequest & { zipCodes?: string[]; ranges?: string[]; note?: { noteId?: number; messageText: string } } = req.body;

        const result = await updateZoneService(conn, zoneId, zoneReq, userId, force);

        if ((result as any).conflicts) {
            res.status(200).json({
                success: true,
                message: "Conflict detected. Some zips already belong to other zones.",
                data: (result as any).zone,
                conflicts: (result as any).conflicts,
                zones: (result as any).zoneList
            });
            return;
        }

        res.json({
            success: true,
            message: "Zone updated successfully",
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// -------------------- Delete Zone --------------------
export async function deleteZone(req: Request, res: Response, conn: Connection) {
    try {
        const zoneId = parseInt(req.params.zoneId, 10);

        await deleteZoneService(conn, zoneId);

        res.json({ success: true, message: "Zone deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}


export async function checkZipZone(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { zipCode } = req.query;
        if (!zipCode) {
            res.status(400).json({ success: false, message: "zipCode is required" });
            return;
        }

        let zones: string[] = [];
        let message = "";

        if ((zipCode as string).includes("-")) {
            // Handle range input like "12345-12349"
            const [start, end] = (zipCode as string).split("-");
            const startNum = parseInt(start);
            const endNum = parseInt(end);

            if (isNaN(startNum) || isNaN(endNum)) {
                res.status(400).json({ success: false, message: "Invalid range format" });
                return;
            }

            for (let current = startNum; current <= endNum; current++) {
                const result = await checkZipZoneService(conn, current.toString());
                if (result.zones.length) {
                    zones.push(...result.zones);
                    message += `Zip code ${current} belongs to ${result.zones.join(", ")}. `;
                }
            }

            zones = [...new Set(zones)]; // remove duplicates

            if (!zones.length) {
                message = `Zip range ${zipCode} does not belong to any zone.`;
            } else {
                message = message.trim();
            }
        } else {
            // Handle individual zip
            const result = await checkZipZoneService(conn, zipCode as string);
            zones = result.zones;
            message = result.message;
        }

        res.status(200).json({
            success: true,
            data: zones,
            message
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}
