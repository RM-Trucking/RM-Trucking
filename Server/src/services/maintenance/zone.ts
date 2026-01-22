import { Connection } from "odbc";
import { CreateZoneRequest, UpdateZoneRequest, ZoneResponse } from "../../entities/maintenance/Zone";
import * as zoneDB from "../../database/maintenance/zone";
import * as noteDB from "../../database/maintenance/note";
import * as entityDB from "../../database/maintenance/entity";
import { ZoneZip } from "../../entities/maintenance/Zone";

export async function createZoneService(
    conn: Connection,
    req: CreateZoneRequest,
    userId: number
): Promise<ZoneResponse> {
    const entityId = await entityDB.createEntity(conn, 'ZONE', req.zoneName);
    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

    const zoneId = await zoneDB.createZone(conn, req.zoneName, entityId, noteThreadId, userId);

    if (req.note?.messageText?.trim()) {
        await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
    }

    const zips: ZoneZip[] = [];

    if (req.zipCodes) {
        for (const zip of req.zipCodes) {
            const zoneZipId = await zoneDB.createZoneZip(conn, zoneId, zip, null, null);
            zips.push({ zoneZipId, zoneId, zipCode: zip });
        }
    }

    if (req.ranges) {
        for (const range of req.ranges) {
            const [start, end] = range.split('-').map(r => r.trim());
            const zoneZipId = await zoneDB.createZoneZip(conn, zoneId, null, start, end);
            zips.push({ zoneZipId, zoneId, rangeStart: start, rangeEnd: end });
        }
    }

    const zone = await zoneDB.getZoneById(conn, zoneId);
    if (!zone) throw new Error('Failed to create zone');

    const notes = await noteDB.getMessagesByThread(conn, noteThreadId);

    return { ...zone, zips, notes };
}

export async function getZoneService(conn: Connection, zoneId: number): Promise<ZoneResponse> {
    const zone = await zoneDB.getZoneById(conn, zoneId);
    if (!zone) throw new Error('Zone not found');
    const zips = await zoneDB.getZoneZips(conn, zoneId);
    const notes = await noteDB.getMessagesByThread(conn, zone.noteThreadId);
    return { ...zone, zips, notes };
}

export async function updateZoneService(
    conn: Connection,
    zoneId: number,
    req: UpdateZoneRequest,
    userId: number
): Promise<void> {
    await zoneDB.updateZone(conn, zoneId, req.zoneName, req.activeStatus, userId);
}

export async function deleteZoneService(conn: Connection, zoneId: number): Promise<void> {
    await zoneDB.softDeleteZone(conn, zoneId);
}
