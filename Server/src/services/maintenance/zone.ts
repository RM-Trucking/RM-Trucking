import { Connection } from "odbc";
import { CreateZoneRequest, UpdateZoneRequest, ZoneDropdownResponse, ZoneResponse } from "../../entities/maintenance/Zone";
import * as zoneDB from "../../database/maintenance/zone";
import * as noteDB from "../../database/maintenance/note";
import * as entityDB from "../../database/maintenance/entity";
import * as userDB from "../../database/maintenance/user";
import * as customerRateDB from "../../database/maintenance/customerRate";
import * as carrierRateDB from "../../database/maintenance/carrierRate";

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
        // 1. Check for duplicate zone name
        const existingZone = await zoneDB.getZoneByName(conn, req.zoneName.trim());
        if (existingZone) {
            await conn.rollback();
            throw new Error(`Zone name "${req.zoneName.trim()}" already exists. Zone names must be unique.`);
        }

        // 2. Conflict detection (parallelized + deduplication)
        const conflicts: { zip: string; zones: { zoneId: number; zoneName: string }[] }[] = [];

        if (req.zipCodes?.length) {
            const uniqueZips = [...new Set(req.zipCodes)];
            const results = await Promise.all(uniqueZips.map(zip => zoneDB.findZonesByZip(conn, zip)));
            results.forEach((zones, idx) => {
                if (zones.length) {
                    // Deduplicate zones by zoneId
                    const uniqueZones = Object.values(
                        zones.reduce((acc, z) => {
                            acc[z.zoneId] = z;
                            return acc;
                        }, {} as Record<number, { zoneId: number; zoneName: string }>)
                    );
                    conflicts.push({ zip: uniqueZips[idx], zones: uniqueZones });
                }
            });
        }

        if (req.ranges?.length) {
            const allNumbers: string[] = [];
            for (const range of req.ranges) {
                const [start, end] = range.split("-").map(Number);
                for (let current = start; current <= end; current++) {
                    allNumbers.push(current.toString());
                }
            }
            const uniqueNumbers = [...new Set(allNumbers)];
            const results = await Promise.all(uniqueNumbers.map(num => zoneDB.findZonesByZip(conn, num)));
            results.forEach((zones, idx) => {
                if (zones.length) {
                    // Deduplicate zones by zoneId
                    const uniqueZones = Object.values(
                        zones.reduce((acc, z) => {
                            acc[z.zoneId] = z;
                            return acc;
                        }, {} as Record<number, { zoneId: number; zoneName: string }>)
                    );
                    conflicts.push({ zip: uniqueNumbers[idx], zones: uniqueZones });
                }
            });
        }

        if (conflicts.length && !force) {
            const zoneIds = [...new Set(conflicts.flatMap(c => c.zones.map(z => z.zoneId)))];

            const zoneDetails = await Promise.all(zoneIds.map(id => zoneDB.getZoneById(conn, id)));
            const zoneZips = await Promise.all(zoneIds.map(id => zoneDB.getZoneZips(conn, id)));
            const notes = await Promise.all(zoneDetails.map(z => noteDB.getMessagesByThread(conn, z!.noteThreadId)));
            const customerCounts = await Promise.all(zoneIds.map(id => customerRateDB.countCustomerRatesForZone(conn, id)));
            const carrierCounts = await Promise.all(zoneIds.map(id => carrierRateDB.countCarrierRatesForZone(conn, id)));
            const createdByNames = await Promise.all(zoneDetails.map(z => userDB.getUserName(conn, z!.createdBy)));
            const updatedByNames = await Promise.all(
                zoneDetails.map(z => (z!.updatedBy ? userDB.getUserName(conn, z!.updatedBy) : Promise.resolve(undefined)))
            );

            const zoneList: ZoneResponse[] = zoneIds.map((id, idx) => {
                const zone = zoneDetails[idx]!;
                return {
                    zoneId: zone.zoneId,
                    noteThreadId: zone.noteThreadId,
                    entityId: zone.entityId,
                    zoneName: zone.zoneName,
                    zipCodes: zoneZips[idx].filter(z => z.zipCode).map(z => z.zipCode!),
                    ranges: zoneZips[idx].filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
                    notes: notes[idx],
                    activeStatus: zone.activeStatus,
                    createdAt: zone.createdAt,
                    createdBy: createdByNames[idx],
                    updatedAt: zone.updatedAt,
                    updatedBy: updatedByNames[idx],
                    customerRateCount: customerCounts[idx],
                    carrierRateCount: carrierCounts[idx]
                };
            });

            await conn.rollback();
            return { conflicts, zoneList };
        }

        // 3. Proceed with creation
        const entityId = await entityDB.createEntity(conn, "ZONE", req.zoneName);
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);
        const zoneId = await zoneDB.createZone(conn, req.zoneName, entityId, noteThreadId, userId);

        if (req.note?.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
        }

        if (req.zipCodes) {
            await Promise.all(req.zipCodes.map(zip => zoneDB.createZoneZip(conn, zoneId, zip, null, null)));
        }

        if (req.ranges) {
            await Promise.all(
                req.ranges.map(range => {
                    const [start, end] = range.split("-").map(r => r.trim());
                    return zoneDB.createZoneZip(conn, zoneId, null, start, end);
                })
            );
        }

        const zone = await zoneDB.getZoneById(conn, zoneId);
        if (!zone) throw new Error("Failed to create zone");

        const [zips, notes, customerRateCount, carrierRateCount, createdByName, updatedByName] = await Promise.all([
            zoneDB.getZoneZips(conn, zoneId),
            noteDB.getMessagesByThread(conn, noteThreadId),
            customerRateDB.countCustomerRatesForZone(conn, zone.zoneId),
            carrierRateDB.countCarrierRatesForZone(conn, zone.zoneId),
            userDB.getUserName(conn, zone.createdBy),
            zone.updatedBy ? userDB.getUserName(conn, zone.updatedBy) : Promise.resolve(undefined)
        ]);

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
                createdBy: createdByName,
                updatedAt: zone.updatedAt,
                updatedBy: updatedByName,
                customerRateCount,
                carrierRateCount
            }
        };
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}



// export async function listZonesDropdownService(conn: Connection): Promise<ZoneDropdownResponse[]> {
//     const zones = await zoneDB.getAllZonesBasic(conn);

//     const responses: ZoneDropdownResponse[] = [];
//     for (const zone of zones) {
//         const zips = await zoneDB.getZoneZips(conn, zone.zoneId);

//         responses.push({
//             zoneId: zone.zoneId,
//             zoneName: zone.zoneName,
//             zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
//             ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
//         });
//     }

//     return responses;
// }


// export async function searchZonesByZipsAndRanges(
//     conn: Connection,
//     input: string
// ): Promise<ZoneDropdownResponse[]> {
//     const tokens = input.split(",").map(t => t.trim()).filter(t => t.length > 0);
//     const matchedZoneIds = new Set<number>();

//     for (const token of tokens) {
//         if (token.includes("-")) {
//             const [start, end] = token.split("-").map(r => r.trim());
//             const startNum = parseInt(start, 10);
//             const endNum = parseInt(end, 10);

//             for (let current = startNum; current <= endNum; current++) {
//                 const zones = await zoneDB.findZonesByZip(conn, current.toString());
//                 zones.forEach(z => matchedZoneIds.add(z.zoneId));
//             }
//         } else {
//             const zones = await zoneDB.findZonesByZip(conn, token);
//             zones.forEach(z => matchedZoneIds.add(z.zoneId));
//         }
//     }

//     const responses: ZoneDropdownResponse[] = [];
//     for (const zoneId of matchedZoneIds) {
//         const zone = await zoneDB.getZoneById(conn, zoneId);
//         if (zone) {
//             const zips = await zoneDB.getZoneZips(conn, zone.zoneId);
//             responses.push({
//                 zoneId: zone.zoneId,
//                 zoneName: zone.zoneName,
//                 zipCodes: zips.filter(z => z.zipCode).map(z => z.zipCode!),
//                 ranges: zips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
//             });
//         }
//     }

//     return responses;
// }



export async function searchZonesByZipsAndRangesService(
    conn: Connection,
    input: string
): Promise<ZoneDropdownResponse[]> {
    const tokens = input.split(",").map(t => t.trim()).filter(Boolean);

    const zipTokens = tokens.filter(t => !t.includes("-"));
    const ranges: [number, number][] = tokens
        .filter(t => t.includes("-"))
        .map(t => {
            const [start, end] = t.split("-").map(Number);
            return [start, end];
        });

    // Call one DB function that fetches all zones + zips in one shot
    const rows = await zoneDB.findZonesByZipsAndRanges(conn, zipTokens, ranges);

    // Group results in memory
    const grouped: Record<number, ZoneDropdownResponse> = {};
    for (const r of rows) {
        if (!grouped[r.zoneId]) {
            grouped[r.zoneId] = {
                zoneId: r.zoneId,
                zoneName: r.zoneName,
                zipCodes: [],
                ranges: []
            };
        }
        if (r.zipCode) grouped[r.zoneId].zipCodes.push(r.zipCode);
        if (r.rangeStart && r.rangeEnd) grouped[r.zoneId].ranges.push(`${r.rangeStart}-${r.rangeEnd}`);
    }

    return Object.values(grouped);
}

export async function listZonesDropdownService(
    conn: Connection
): Promise<ZoneDropdownResponse[]> {
    // Single DB call to fetch all zones + zips
    const rows = await zoneDB.getAllZonesWithZips(conn);

    const grouped: Record<number, ZoneDropdownResponse> = {};
    for (const r of rows) {
        if (!grouped[r.zoneId]) {
            grouped[r.zoneId] = {
                zoneId: r.zoneId,
                zoneName: r.zoneName,
                zipCodes: [],
                ranges: []
            };
        }
        if (r.zipCode) grouped[r.zoneId].zipCodes.push(r.zipCode);
        if (r.rangeStart && r.rangeEnd) grouped[r.zoneId].ranges.push(`${r.rangeStart}-${r.rangeEnd}`);
    }

    return Object.values(grouped);
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
        const customerRateCount = await customerRateDB.countCustomerRatesForZone(conn, zone.zoneId);
        const carrierRateCount = await carrierRateDB.countCarrierRatesForZone(conn, zone.zoneId);

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
            customerRateCount,
            carrierRateCount
        });
    }

    return { data: responses, total, page, pageSize };
}




export async function getZoneService(conn: Connection, zoneId: number): Promise<ZoneResponse> {
    const zone = await zoneDB.getZoneById(conn, zoneId);
    if (!zone) throw new Error("Zone not found");

    const zips = await zoneDB.getZoneZips(conn, zoneId);
    const notes = await noteDB.getMessagesByThread(conn, zone.noteThreadId);
    const customerRateCount = await customerRateDB.countCustomerRatesForZone(conn, zone.zoneId);
    const carrierRateCount = await carrierRateDB.countCarrierRatesForZone(conn, zone.zoneId);


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
        customerRateCount,
        carrierRateCount
    };
}

export async function updateZoneService(
    conn: Connection,
    zoneId: number,
    req: UpdateZoneRequest & {
        zipCodes?: string[];
        ranges?: string[];
        note?: { noteId?: number; messageText: string };
    },
    userId: number,
    force: boolean
): Promise<
    ZoneResponse | {
        conflicts?: { zip: string; zones: { zoneId: number; zoneName: string }[] }[];
        zoneList?: ZoneResponse[];
        zone?: ZoneResponse;
    }
> {
    await conn.beginTransaction();
    try {
        // 1. Duplicate zone name check
        if (req.zoneName) {
            const existingZone = await zoneDB.getZoneByName(conn, req.zoneName);
            if (existingZone && existingZone.zoneId !== zoneId) {
                await conn.rollback();
                throw new Error(`Zone name "${req.zoneName.trim()}" already exists. Zone names must be unique.`);
            }
        }

        // 2. Conflict detection (only new zips/ranges, deduplicated)
        const conflicts: { zip: string; zones: { zoneId: number; zoneName: string }[] }[] = [];

        const currentZips = await zoneDB.getZoneZips(conn, zoneId);
        const existingZipSet = new Set(currentZips.filter(z => z.zipCode).map(z => z.zipCode!));
        const existingRangeSet = new Set(
            currentZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
        );

        // Check new zips
        if (req.zipCodes?.length) {
            const newZips = req.zipCodes.filter(zip => !existingZipSet.has(zip));
            const results = await Promise.all(newZips.map(zip => zoneDB.findZonesByZip(conn, zip)));
            results.forEach((zones, idx) => {
                if (zones.length) {
                    const uniqueZones = Object.values(
                        zones.reduce((acc, z) => {
                            acc[z.zoneId] = z;
                            return acc;
                        }, {} as Record<number, { zoneId: number; zoneName: string }>)
                    );
                    conflicts.push({ zip: newZips[idx], zones: uniqueZones });
                }
            });
        }

        // Check new ranges
        if (req.ranges?.length) {
            const newRanges = req.ranges.filter(r => !existingRangeSet.has(r));
            const allNumbers: string[] = [];
            for (const range of newRanges) {
                const [start, end] = range.split("-").map(Number);
                for (let current = start; current <= end; current++) {
                    allNumbers.push(current.toString());
                }
            }
            const uniqueNumbers = [...new Set(allNumbers)];
            const results = await Promise.all(uniqueNumbers.map(num => zoneDB.findZonesByZip(conn, num)));
            results.forEach((zones, idx) => {
                if (zones.length) {
                    const uniqueZones = Object.values(
                        zones.reduce((acc, z) => {
                            acc[z.zoneId] = z;
                            return acc;
                        }, {} as Record<number, { zoneId: number; zoneName: string }>)
                    );
                    conflicts.push({ zip: uniqueNumbers[idx], zones: uniqueZones });
                }
            });
        }

        if (conflicts.length && !force) {
            // Build conflict zone list (parallelized)
            const zoneIds = [...new Set(conflicts.flatMap(c => c.zones.map(z => z.zoneId)))];

            const zoneDetails = await Promise.all(zoneIds.map(id => zoneDB.getZoneById(conn, id)));
            const zoneZips = await Promise.all(zoneIds.map(id => zoneDB.getZoneZips(conn, id)));
            const notes = await Promise.all(zoneDetails.map(z => noteDB.getMessagesByThread(conn, z!.noteThreadId)));
            const customerCounts = await Promise.all(zoneIds.map(id => customerRateDB.countCustomerRatesForZone(conn, id)));
            const carrierCounts = await Promise.all(zoneIds.map(id => carrierRateDB.countCarrierRatesForZone(conn, id)));
            const createdByNames = await Promise.all(zoneDetails.map(z => userDB.getUserName(conn, z!.createdBy)));
            const updatedByNames = await Promise.all(
                zoneDetails.map(z => (z!.updatedBy ? userDB.getUserName(conn, z!.updatedBy) : Promise.resolve(undefined)))
            );

            const zoneList: ZoneResponse[] = zoneIds.map((id, idx) => {
                const zone = zoneDetails[idx]!;
                return {
                    zoneId: zone.zoneId,
                    noteThreadId: zone.noteThreadId,
                    entityId: zone.entityId,
                    zoneName: zone.zoneName,
                    zipCodes: zoneZips[idx].filter(z => z.zipCode).map(z => z.zipCode!),
                    ranges: zoneZips[idx].filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`),
                    notes: notes[idx],
                    activeStatus: zone.activeStatus,
                    createdAt: zone.createdAt,
                    createdBy: createdByNames[idx],
                    updatedAt: zone.updatedAt,
                    updatedBy: updatedByNames[idx],
                    customerRateCount: customerCounts[idx],
                    carrierRateCount: carrierCounts[idx]
                };
            });

            await conn.rollback();
            return { conflicts, zoneList };
        }

        // 3. Proceed with update
        await zoneDB.updateZone(conn, zoneId, req.zoneName, req.activeStatus, userId);
        await zoneDB.deleteZoneZips(conn, zoneId);

        if (req.zipCodes) {
            await Promise.all(req.zipCodes.map(zip => zoneDB.createZoneZip(conn, zoneId, zip, null, null)));
        }

        if (req.ranges) {
            await Promise.all(
                req.ranges.map(range => {
                    const [start, end] = range.split("-").map(r => r.trim());
                    return zoneDB.createZoneZip(conn, zoneId, null, start, end);
                })
            );
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

        const [zips, notes, customerRateCount, carrierRateCount, createdByName, updatedByName] = await Promise.all([
            zoneDB.getZoneZips(conn, zoneId),
            noteDB.getMessagesByThread(conn, zone.noteThreadId),
            customerRateDB.countCustomerRatesForZone(conn, zone.zoneId),
            carrierRateDB.countCarrierRatesForZone(conn, zone.zoneId),
            userDB.getUserName(conn, zone.createdBy),
            zone.updatedBy ? userDB.getUserName(conn, zone.updatedBy) : Promise.resolve(undefined)
        ]);

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
            createdBy: createdByName,
            updatedAt: zone.updatedAt,
            updatedBy: updatedByName,
            customerRateCount,
            carrierRateCount
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

