import { Connection } from "odbc";
import { CreateZoneRequest, UpdateZoneRequest, ZoneDropdownResponse, ZoneResponse } from "../../entities/maintenance/Zone";
import * as zoneDB from "../../database/maintenance/zone";
import * as noteDB from "../../database/maintenance/note";
import * as entityDB from "../../database/maintenance/entity";
import * as userDB from "../../database/maintenance/user";
import * as rateDB from "../../database/maintenance/customerRate";

export async function createZoneService(
    conn: Connection,
    req: CreateZoneRequest,
    userId: number,
    force: boolean
): Promise<{
    conflicts?: { zip: string; zones: { zoneId: number; zoneName: string }[] }[],
    zoneList?: ZoneResponse[],
    zone?: ZoneResponse
}> {
    await conn.beginTransaction();
    try {
        // 🔑 1. Check for duplicate zone name
        // 1. Check for duplicate zone name (case-insensitive, trimmed)
        const existingZone = await zoneDB.getZoneByName(conn, req.zoneName.trim());
        if (existingZone) {
            await conn.rollback();
            throw new Error(`Zone name "${req.zoneName.trim()}" already exists. Zone names must be unique.`);
        }


        // 🔑 2. Check for conflicts in zip codes and ranges
        const conflicts: { zip: string; zones: { zoneId: number; zoneName: string }[] }[] = [];

        if (req.zipCodes) {
            for (const zip of req.zipCodes) {
                const zones = await zoneDB.findZonesByZip(conn, zip);
                if (zones.length) {
                    conflicts.push({ zip, zones });
                }
            }
        }

        if (req.ranges) {
            for (const range of req.ranges) {
                const [start, end] = range.split("-").map(r => r.trim());
                for (let current = parseInt(start); current <= parseInt(end); current++) {
                    const zones = await zoneDB.findZonesByZip(conn, current.toString());
                    if (zones.length) {
                        conflicts.push({ zip: current.toString(), zones });
                    }
                }
            }
        }

        if (conflicts.length && !force) {
            const zoneList: ZoneResponse[] = [];

            for (const conflict of conflicts) {
                for (const zone of conflict.zones) {
                    const fullZone = await zoneDB.getZoneById(conn, zone.zoneId);
                    if (fullZone) {
                        const zips = await zoneDB.getZoneZips(conn, fullZone.zoneId);
                        const notes = await noteDB.getMessagesByThread(conn, fullZone.noteThreadId);
                        const rateCount = await rateDB.countRatesForZone(conn, zone.zoneId);

                        zoneList.push({
                            zoneId: fullZone.zoneId,
                            noteThreadId: fullZone.noteThreadId,
                            entityId: fullZone.entityId,
                            zoneName: fullZone.zoneName,
                            zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
                            ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
                            notes,
                            activeStatus: fullZone.activeStatus,
                            createdAt: fullZone.createdAt,
                            createdBy: await userDB.getUserName(conn, fullZone.createdBy),
                            updatedAt: fullZone.updatedAt,
                            updatedBy: fullZone.updatedBy ? await userDB.getUserName(conn, fullZone.updatedBy) : undefined,
                            rateCount
                        });
                    }
                }
            }

            await conn.rollback();
            return {
                conflicts,
                zoneList
            };
        }

        // 🔑 3. Proceed with creation if no conflicts and name is unique
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
        const rateCount = await rateDB.countRatesForZone(conn, zone.zoneId);

        await conn.commit();

        return {
            zone: {
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
                rateCount
            }
        };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
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
    const rateCount = await rateDB.countRatesForZone(conn, zone.zoneId);
    

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
        updatedBy: zone.updatedBy ? await userDB.getUserName(conn, zone.updatedBy) : undefined,
        rateCount
    };
}

export async function updateZoneService(
    conn: Connection,
    zoneId: number,
    req: UpdateZoneRequest & { zipCodes?: string[]; ranges?: string[]; note?: { noteId?: number; messageText: string } },
    userId: number,
    force: boolean
): Promise<ZoneResponse | {
    conflicts?: { zip: string; zones: { zoneId: number; zoneName: string }[] }[],
    zoneList?: ZoneResponse[],
    zone?: ZoneResponse
}> {
    await conn.beginTransaction();
    try {
        // 1. Check for duplicate zone name (case-insensitive, trimmed)
        if (req.zoneName) {
            const existingZone = await zoneDB.getZoneByName(conn, req.zoneName);
            if (existingZone && existingZone.zoneId !== zoneId) {
                await conn.rollback();
                throw new Error(`Zone name "${req.zoneName.trim()}" already exists. Zone names must be unique.`);
            }
        }

        // 2. Check for conflicts in zip codes and ranges
        const conflicts: { zip: string; zones: { zoneId: number; zoneName: string }[] }[] = [];

        if (req.zipCodes) {
            for (const zip of req.zipCodes) {
                const zones = await zoneDB.findZonesByZip(conn, zip);
                if (zones.length) {
                    conflicts.push({ zip, zones });
                }
            }
        }

        if (req.ranges) {
            for (const range of req.ranges) {
                const [start, end] = range.split("-").map(r => r.trim());
                for (let current = parseInt(start); current <= parseInt(end); current++) {
                    const zones = await zoneDB.findZonesByZip(conn, current.toString());
                    if (zones.length) {
                        conflicts.push({ zip: current.toString(), zones });
                    }
                }
            }
        }

        if (conflicts.length && !force) {
            const zoneList: ZoneResponse[] = [];

            for (const conflict of conflicts) {
                for (const zone of conflict.zones) {
                    const fullZone = await zoneDB.getZoneById(conn, zone.zoneId);
                    const rateCount = await rateDB.countRatesForZone(conn, zone.zoneId);
                    if (fullZone) {
                        const zips = await zoneDB.getZoneZips(conn, fullZone.zoneId);
                        const notes = await noteDB.getMessagesByThread(conn, fullZone.noteThreadId);

                        zoneList.push({
                            zoneId: fullZone.zoneId,
                            noteThreadId: fullZone.noteThreadId,
                            entityId: fullZone.entityId,
                            zoneName: fullZone.zoneName,
                            zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
                            ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
                            notes,
                            activeStatus: fullZone.activeStatus,
                            createdAt: fullZone.createdAt,
                            createdBy: await userDB.getUserName(conn, fullZone.createdBy),
                            updatedAt: fullZone.updatedAt,
                            updatedBy: fullZone.updatedBy ? await userDB.getUserName(conn, fullZone.updatedBy) : undefined,
                            rateCount
                        });
                    }
                }
            }

            await conn.rollback();
            return {
                conflicts,
                zoneList
            };
        }

        // 3. Proceed with update
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
            if (req.note.noteId) {
                await noteDB.updateNoteMessage(conn, req.note.noteId, req.note.messageText.trim(), userId);
            } else {
                await noteDB.createNoteMessage(conn, zone.noteThreadId, req.note.messageText.trim(), userId);
            }
        }

        const zips = await zoneDB.getZoneZips(conn, zoneId);
        const notes = await noteDB.getMessagesByThread(conn, zone.noteThreadId);
        const rateCount = await rateDB.countRatesForZone(conn, zone.zoneId);

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
            updatedBy: zone.updatedBy ? await userDB.getUserName(conn, zone.updatedBy) : undefined,
            rateCount
        };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}


export async function deleteZoneService(conn: Connection, zoneId: number): Promise<void> {
    await zoneDB.softDeleteZone(conn, zoneId);
}


export async function checkZipZoneService(
    conn: Connection,
    zipCode: string
): Promise<{ zones: string[], message: string }> {
    const zones = await zoneDB.findZonesByZip(conn, zipCode); // returns { zoneId, zoneName }[]

    const zoneNames = zones.map(z => z.zoneName);

    if (!zoneNames.length) {
        return { zones: [], message: `Zip code ${zipCode} does not belong to any zone.` };
    }

    if (zoneNames.length === 1) {
        return { zones: zoneNames, message: `Zip code ${zipCode} belongs to zone ${zoneNames[0]}.` };
    }

    return { zones: zoneNames, message: `Zip code ${zipCode} belongs to multiple zones: ${zoneNames.join(", ")}.` };
}

