import { Connection } from "odbc";
import { CreateZoneRequest, UpdateZoneRequest, ZoneResponse } from "../../entities/maintenance/Zone";
import * as zoneDB from "../../database/maintenance/zone";
import * as noteDB from "../../database/maintenance/note";
import * as entityDB from "../../database/maintenance/entity";
import * as userDB from "../../database/maintenance/user";
import * as rateDB from "../../database/maintenance/customerRate";

export async function createZoneService(
    conn: Connection,
    req: CreateZoneRequest,
    userId: number
): Promise<ZoneResponse> {
    await conn.beginTransaction();
    try {
        const entityId = await entityDB.createEntity(conn, "ZONE", req.zoneName);
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

        const zoneId = await zoneDB.createZone(conn, req.zoneName, entityId, noteThreadId, userId);

        if (req.note?.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
        }

        if (req.zipCodes) {
            for (const zip of req.zipCodes) {
                await zoneDB.createZoneZip(conn, zoneId, zip, null, null);
            }
        }

        if (req.ranges) {
            for (const range of req.ranges) {
                const [start, end] = range.split("-").map(r => r.trim());
                await zoneDB.createZoneZip(conn, zoneId, null, start, end);
            }
        }

        const zone = await zoneDB.getZoneById(conn, zoneId);
        if (!zone) throw new Error("Failed to create zone");

        const zips = await zoneDB.getZoneZips(conn, zoneId);
        const notes = await noteDB.getMessagesByThread(conn, noteThreadId);

        await conn.commit();

        return {
            zoneId: zone.zoneId,
            noteThreadId: zone.noteThreadId,
            entityId: zone.entityId,
            zoneName: zone.zoneName,
            zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
            ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
            notes,
            activeStatus: zone.activeStatus,
            createdAt: zone.createdAt,
            createdBy: await userDB.getUserName(conn, zone.createdBy),
            updatedAt: zone.updatedAt,
            updatedBy: zone.updatedBy ? await userDB.getUserName(conn, zone.updatedBy) : undefined
        };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}


export interface ZoneDropdownResponse {
    zoneId: number;
    zoneName: string;
    zipCodes: string[];
    ranges: string[];
}

export async function listZonesDropdownService(conn: Connection): Promise<ZoneDropdownResponse[]> {
    const zones = await zoneDB.getAllZonesBasic(conn);

    const responses: ZoneDropdownResponse[] = [];
    for (const zone of zones) {
        const zips = await zoneDB.getZoneZips(conn, zone.zoneId);

        responses.push({
            zoneId: zone.zoneId,
            zoneName: zone.zoneName,
            zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
            ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
        });
    }

    return responses;
}


export async function listZonesService(
    conn: Connection,
    page: number,
    pageSize: number,
    searchTerm?: string
): Promise<{ data: ZoneResponse[]; total: number; page: number; pageSize: number }> {
    const offset = (page - 1) * pageSize;

    const zones = await zoneDB.getZones(conn, pageSize, offset, searchTerm);
    const total = await zoneDB.countZones(conn, searchTerm);

    const responses: ZoneResponse[] = [];
    for (const zone of zones) {
        const zips = await zoneDB.getZoneZips(conn, zone.zoneId);
        const notes = await noteDB.getMessagesByThread(conn, zone.noteThreadId);

        // NEW: count how many rates reference this zone
        const rateCount = await rateDB.countRatesForZone(conn, zone.zoneId);

        responses.push({
            zoneId: zone.zoneId,
            noteThreadId: zone.noteThreadId,
            entityId: zone.entityId,
            zoneName: zone.zoneName,
            zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
            ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
            notes,
            activeStatus: zone.activeStatus,
            createdAt: zone.createdAt,
            createdBy: await userDB.getUserName(conn, zone.createdBy),
            updatedAt: zone.updatedAt,
            updatedBy: zone.updatedBy ? await userDB.getUserName(conn, zone.updatedBy) : undefined,
            rateCount // include in response
        });
    }

    return { data: responses, total, page, pageSize };
}




export async function getZoneService(conn: Connection, zoneId: number): Promise<ZoneResponse> {
    const zone = await zoneDB.getZoneById(conn, zoneId);
    if (!zone) throw new Error("Zone not found");

    const zips = await zoneDB.getZoneZips(conn, zoneId);
    const notes = await noteDB.getMessagesByThread(conn, zone.noteThreadId);

    return {
        zoneId: zone.zoneId,
        noteThreadId: zone.noteThreadId,
        entityId: zone.entityId,
        zoneName: zone.zoneName,
        zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
        ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
        notes,
        activeStatus: zone.activeStatus,
        createdAt: zone.createdAt,
        createdBy: await userDB.getUserName(conn, zone.createdBy),
        updatedAt: zone.updatedAt,
        updatedBy: zone.updatedBy ? await userDB.getUserName(conn, zone.updatedBy) : undefined
    };
}

export async function updateZoneService(
    conn: Connection,
    zoneId: number,
    req: UpdateZoneRequest & { zipCodes?: string[]; ranges?: string[]; note?: { noteId?: number; messageText: string } },
    userId: number
): Promise<ZoneResponse> {
    await conn.beginTransaction();
    try {
        await zoneDB.updateZone(conn, zoneId, req.zoneName, req.activeStatus, userId);

        await zoneDB.deleteZoneZips(conn, zoneId);

        if (req.zipCodes) {
            for (const zip of req.zipCodes) {
                await zoneDB.createZoneZip(conn, zoneId, zip, null, null);
            }
        }

        if (req.ranges) {
            for (const range of req.ranges) {
                const [start, end] = range.split("-").map(r => r.trim());
                await zoneDB.createZoneZip(conn, zoneId, null, start, end);
            }
        }

        const zone = await zoneDB.getZoneById(conn, zoneId);
        if (!zone) throw new Error("Zone not found");

        if (req.note?.messageText?.trim()) {
            // If the request includes a noteId, update that note
            if (req.note.noteId) {
                await noteDB.updateNoteMessage(conn, req.note.noteId, req.note.messageText.trim(), userId);
            } else {
                await noteDB.createNoteMessage(conn, zone.noteThreadId, req.note.messageText.trim(), userId);
            }
        }


        const zips = await zoneDB.getZoneZips(conn, zoneId);
        const notes = await noteDB.getMessagesByThread(conn, zone.noteThreadId);

        await conn.commit();

        return {
            zoneId: zone.zoneId,
            noteThreadId: zone.noteThreadId,
            entityId: zone.entityId,
            zoneName: zone.zoneName,
            zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
            ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
            notes,
            activeStatus: zone.activeStatus,
            createdAt: zone.createdAt,
            createdBy: await userDB.getUserName(conn, zone.createdBy),
            updatedAt: zone.updatedAt,
            updatedBy: zone.updatedBy ? await userDB.getUserName(conn, zone.updatedBy) : undefined
        };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}



export async function deleteZoneService(conn: Connection, zoneId: number): Promise<void> {
    await zoneDB.softDeleteZone(conn, zoneId);
}
