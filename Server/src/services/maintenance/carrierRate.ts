import { Connection } from 'odbc';
import * as rateDB from '../../database/maintenance/carrierRate';
import * as zoneDB from '../../database/maintenance/zone';
import * as userDB from '../../database/maintenance/user';
import * as carrierDB from '../../database/maintenance/carrier';
import * as entityDB from '../../database/maintenance/entity';
import * as noteDB from '../../database/maintenance/note';

import {
    CreateCarrierWarehouseRateRequest,
    UpdateCarrierWarehouseRateRequest,
    CarrierWarehouseRateResponse,
    CreateCarrierTransportRateRequest,
    UpdateCarrierTransportRateRequest,
    CarrierTransportRateResponse,
    AssignRateToTerminalRequest,
    TerminalRateMapResponse,
    CarrierTransportRateSearch
} from '../../entities/maintenance';

// -------------------- Warehouse Rate --------------------
export async function createCarrierWarehouseRateService(
    conn: Connection,
    req: CreateCarrierWarehouseRateRequest
): Promise<CarrierWarehouseRateResponse> {
    const rateId = await rateDB.createCarrierWarehouseRate(conn, req);
    const rate = await rateDB.getCarrierWarehouseRateById(conn, rateId);
    if (!rate) throw new Error('Failed to create warehouse rate');
    return rate;
}

export async function getCarrierWarehouseRateService(
    conn: Connection,
    rateId: number
): Promise<CarrierWarehouseRateResponse | null> {
    return await rateDB.getCarrierWarehouseRateById(conn, rateId);
}

export async function updateCarrierWarehouseRateService(
    conn: Connection,
    rateId: number,
    req: UpdateCarrierWarehouseRateRequest
): Promise<CarrierWarehouseRateResponse> {
    await rateDB.updateCarrierWarehouseRate(conn, rateId, req);
    const rate = await rateDB.getCarrierWarehouseRateById(conn, rateId);
    if (!rate) throw new Error('Failed to update warehouse rate');
    return rate;
}

export async function deleteCarrierWarehouseRateService(
    conn: Connection,
    rateId: number
): Promise<void> {
    await rateDB.deleteCarrierWarehouseRate(conn, rateId);
}


// -------------------- Transport Rate --------------------
export async function createCarrierTransportRateService(
    conn: Connection,
    req: CreateCarrierTransportRateRequest,
    userId: number
): Promise<CarrierTransportRateResponse> {
    await conn.beginTransaction();
    try {

        // 1) Create the transport rate (without entity/noteThread yet)
        const rateId = await rateDB.createCarrierTransportRate(
            conn,
            req.originZoneId,
            req.destinationZoneId,
            userId
        );

        // 2) Fetch the CarrierRateId from the newly created rate
        const carrierRate = await rateDB.getCarrierTransportRateById(conn, rateId);
        if (!carrierRate) throw new Error("Failed to create carrier transport rate");

        // 3) Create Entity for this CarrierRate
        const entityId = await entityDB.createEntity(conn, 'CUSTOMER_TRANSPORT_RATE', carrierRate.carrierRateId.toString());

        // 4) Create Note Thread linked to the entity
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

        // 5) Update Carrier_Rate with entityId and noteThreadId
        await rateDB.updateCarrierRateEntityAndNoteThread(conn, carrierRate.carrierRateId, entityId, noteThreadId);

        // If initial note is provided, create the first message
        if (req.note && req.note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
        }

        if (req.details && req.details.length > 0) {
            for (const d of req.details) {
                await rateDB.createCarrierTransportRateDetail(conn, rateId, d.rateField, d.chargeValue, d.perUnitFlag);
            }
        }

        const rate = await rateDB.getCarrierTransportRateById(conn, rateId);
        const details = await rateDB.getCarrierTransportRateDetails(conn, rateId);

        // Enrich with zone info
        const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
        const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

        const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
        const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

        // Resolve user names
        const createdByName = await userDB.getUserName(conn, rate!.createdBy);
        const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;

        const carrierCount = await carrierDB.countCarriersByRateId(conn, rateId);

        const notes = rate?.noteThreadId
            ? await noteDB.getMessagesByThread(conn, rate.noteThreadId)
            : [];



        await conn.commit();

        return {
            ...rate!,
            originZone: originZone
                ? {
                    zoneId: originZone.zoneId,
                    zoneName: originZone.zoneName,
                    zipCodes: originZips.filter(z => z.zipCode).map(z => z.zipCode!),
                    ranges: originZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                }
                : null,
            destinationZone: destinationZone
                ? {
                    zoneId: destinationZone.zoneId,
                    zoneName: destinationZone.zoneName,
                    zipCodes: destinationZips.filter(z => z.zipCode).map(z => z.zipCode!),
                    ranges: destinationZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                }
                : null,
            details,
            createdByName,
            updatedByName,
            carrierCount,
            entityId,
            noteThreadId,
            notes
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


export async function getCarrierTransportRateService(
    conn: Connection,
    rateId: number
): Promise<CarrierTransportRateResponse | null> {
    const rate = await rateDB.getCarrierTransportRateById(conn, rateId);
    if (!rate) return null;

    const details = await rateDB.getCarrierTransportRateDetails(conn, rateId);

    // Fetch origin zone info
    const originZone = await zoneDB.getZoneById(conn, rate.originZoneId);
    const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

    // Fetch destination zone info
    const destinationZone = await zoneDB.getZoneById(conn, rate.destinationZoneId);
    const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

    // Resolve user names
    const createdByName = await userDB.getUserName(conn, rate.createdBy);
    const updatedByName = rate.updatedBy ? await userDB.getUserName(conn, rate.updatedBy) : undefined;

    // 🔑 Fetch carrier count
    const carrierCount = await carrierDB.countCarriersByRateId(conn, rateId);

    const notes = rate?.noteThreadId
        ? await noteDB.getMessagesByThread(conn, rate.noteThreadId)
        : [];

    return {
        rateId: rate.rateId,
        carrierRateId: rate.carrierRateId,
        originZone: originZone
            ? {
                zoneId: originZone.zoneId,
                zoneName: originZone.zoneName,
                zipCodes: originZips.filter(z => z.zipCode).map(z => z.zipCode!),
                ranges: originZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
            }
            : null,
        destinationZone: destinationZone
            ? {
                zoneId: destinationZone.zoneId,
                zoneName: destinationZone.zoneName,
                zipCodes: destinationZips.filter(z => z.zipCode).map(z => z.zipCode!),
                ranges: destinationZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
            }
            : null,
        details,
        activeStatus: rate.activeStatus,
        expiryDate: rate.expiryDate,
        createdAt: rate.createdAt,
        createdByName,
        updatedAt: rate.updatedAt,
        updatedByName,
        carrierCount,
        entityId: rate.entityId,
        noteThreadId: rate.noteThreadId,
        notes
    };
}



export async function updateCarrierTransportRateService(
    conn: Connection,
    rateId: number,
    req: UpdateCarrierTransportRateRequest,
    userId: number
): Promise<CarrierTransportRateResponse> {
    await conn.beginTransaction();
    try {
        // Update base record if needed
        if (req.originZoneId || req.destinationZoneId) {
            await rateDB.updateCarrierTransportRate(conn, rateId, req.originZoneId, req.destinationZoneId, userId);
        }

        if (req.note && req.note.messageText?.trim()) {
            if (!req.noteThreadId) throw new Error('Note thread not found for mapping');
            await noteDB.createNoteMessage(conn, req.noteThreadId, req.note.messageText.trim(), userId);
        }


        // Replace details if provided
        if (req.details && req.details.length > 0) {
            await rateDB.deleteCarrierTransportRateDetails(conn, rateId);
            for (const d of req.details) {
                await rateDB.createCarrierTransportRateDetail(conn, rateId, d.rateField, d.chargeValue, d.perUnitFlag);
            }
        }

        // Fetch updated rate and details
        const rate = await rateDB.getCarrierTransportRateById(conn, rateId);
        const details = await rateDB.getCarrierTransportRateDetails(conn, rateId);

        // Enrich with zone info
        const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
        const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

        const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
        const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

        // Resolve user names
        const createdByName = await userDB.getUserName(conn, rate!.createdBy);
        const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;
        const carrierCount = await carrierDB.countCarriersByRateId(conn, rateId);
        const notes = rate?.noteThreadId
            ? await noteDB.getMessagesByThread(conn, rate.noteThreadId)
            : [];

        await conn.commit();

        return {
            ...rate!,
            originZone: originZone
                ? {
                    zoneId: originZone.zoneId,
                    zoneName: originZone.zoneName,
                    zipCodes: originZips.filter(z => z.zipCode).map(z => z.zipCode!),
                    ranges: originZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                }
                : null,
            destinationZone: destinationZone
                ? {
                    zoneId: destinationZone.zoneId,
                    zoneName: destinationZone.zoneName,
                    zipCodes: destinationZips.filter(z => z.zipCode).map(z => z.zipCode!),
                    ranges: destinationZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                }
                : null,
            details,
            createdByName,
            updatedByName,
            carrierCount,
            notes
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


export async function deleteCarrierTransportRateService(
    conn: Connection,
    rateId: number
): Promise<void> {
    await rateDB.deleteCarrierTransportRate(conn, rateId);
}


// -------------------- Terminal Rate Map --------------------
export async function assignRateToTerminalService(
    conn: Connection,
    req: AssignRateToTerminalRequest[],
    assignedBy: string
): Promise<TerminalRateMapResponse[]> {
    await conn.beginTransaction();
    try {
        const terminalRateIds: number[] = [];

        for (const r of req) {
            const terminalRateId = await rateDB.assignRateToTerminal(
                conn,
                r.terminalId,
                r.rateId,
                r.rateType,
                assignedBy
            );
            terminalRateIds.push(terminalRateId);
        }

        // Fetch all maps for the terminal
        const maps = await rateDB.getTerminalRates(conn, req[0].terminalId);

        await conn.commit();

        // Return only the ones we just inserted
        return maps.filter(m => terminalRateIds.includes(m.terminalRateId));
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}


export async function getTerminalRatesService(
    conn: Connection,
    terminalId: number,
    rateType?: 'WAREHOUSE' | 'TRANSPORT',
    search?: CarrierTransportRateSearch
): Promise<any[]> {

    console.log(terminalId);
    console.log(search);



    const rows = await rateDB.getTerminalRates(conn, terminalId, rateType, search);

    console.log(rows);


    return await Promise.all(
        rows.map(async r => {
            if (r.rateType === 'WAREHOUSE') {
                return {
                    terminalRateId: r.terminalRateId,
                    terminalId: r.terminalId,
                    rateId: r.rateId,
                    rateType: r.rateType,
                    assignedBy: r.userName,
                    assignedAt: r.assignedAt,
                    warehouseRate: {
                        minRate: r.minRate,
                        maxRate: r.maxRate,
                        ratePerPound: r.ratePerPound,
                        department: r.department,
                        warehouse: r.warehouse
                    }
                };
            } else {
                // Fetch full transport rate info
                const rate = await rateDB.getCarrierTransportRateById(conn, r.rateId);
                const details = await rateDB.getCarrierTransportRateDetails(conn, r.rateId);

                const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
                const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

                const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
                const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

                const createdByName = await userDB.getUserName(conn, rate!.createdBy);
                const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;

                const carrierCount = await carrierDB.countCarriersByRateId(conn, r.rateId);

                const notes = rate?.noteThreadId
                    ? await noteDB.getMessagesByThread(conn, r.noteThreadId)
                    : [];

                return {
                    terminalRateId: r.terminalRateId,
                    terminalId: r.terminalId,
                    rateId: r.rateId,
                    rateType: r.rateType,
                    assignedBy: r.userName,
                    assignedAt: r.assignedAt,
                    transportRate: {
                        ...rate!,
                        originZone: originZone
                            ? {
                                zoneId: originZone.zoneId,
                                zoneName: originZone.zoneName,
                                zipCodes: originZips.filter(z => z.zipCode).map(z => z.zipCode!),
                                ranges: originZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                            }
                            : null,
                        destinationZone: destinationZone
                            ? {
                                zoneId: destinationZone.zoneId,
                                zoneName: destinationZone.zoneName,
                                zipCodes: destinationZips.filter(z => z.zipCode).map(z => z.zipCode!),
                                ranges: destinationZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                            }
                            : null,
                        details,
                        createdByName,
                        updatedByName,
                        carrierCount,
                        entityId: r.entityId,
                        noteThreadId: r.noteThreadId,
                        notes
                    }
                };
            }
        })
    );
}


export async function deleteTerminalRateMapService(
    conn: Connection,
    terminalRateId: number
): Promise<void> {
    await rateDB.deleteTerminalRateMap(conn, terminalRateId);
}


export async function listCarrierWarehouseRatesService(
    conn: Connection,
    search?: string,
    page: number = 1,
    pageSize: number = 10
) {
    const { data, total } = await rateDB.listCarrierWarehouseRates(conn, search, page, pageSize);
    return {
        rates: data,
        total,
        page,
        pageSize
    };
}

export async function listCarrierTransportRatesService(
    conn: Connection,
    search?: CarrierTransportRateSearch,
    page: number = 1,
    pageSize: number = 10
) {
    const { data, total } = await rateDB.listCarrierTransportRates(conn, search || {}, page, pageSize);

    const enriched = await Promise.all(
        data.map(async r => {
            const details = await rateDB.getCarrierTransportRateDetails(conn, r.rateId);

            const originZone = await zoneDB.getZoneById(conn, r.originZoneId);
            const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

            const destinationZone = await zoneDB.getZoneById(conn, r.destinationZoneId);
            const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

            const createdByName = await userDB.getUserName(conn, r.createdBy);
            const updatedByName = r.updatedBy ? await userDB.getUserName(conn, r.updatedBy) : undefined;
            const carrierCount = await carrierDB.countCarriersByRateId(conn, r.rateId);

            const notes = r?.noteThreadId
                ? await noteDB.getMessagesByThread(conn, r.noteThreadId)
                : [];

            return {
                ...r,
                originZone: originZone
                    ? {
                        zoneId: originZone.zoneId,
                        zoneName: originZone.zoneName,
                        zipCodes: originZips.filter(z => z.zipCode).map(z => z.zipCode!),
                        ranges: originZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                    }
                    : null,
                destinationZone: destinationZone
                    ? {
                        zoneId: destinationZone.zoneId,
                        zoneName: destinationZone.zoneName,
                        zipCodes: destinationZips.filter(z => z.zipCode).map(z => z.zipCode!),
                        ranges: destinationZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                    }
                    : null,
                details,
                createdByName,
                updatedByName,
                carrierCount,
                notes
            };
        })
    );

    return {
        rates: enriched,
        total,
        page,
        pageSize
    };
}

export async function listCarrierTransportRatesByZoneService(
    conn: Connection,
    zoneId: number,
    page: number = 1,
    pageSize: number = 10
) {

    const offset = (page - 1) * pageSize;

    // Query all rates where this zone is origin or destination
    const { data, total } = await rateDB.listCarrierTransportRatesByZone(conn, zoneId, pageSize, offset);

    const enriched = await Promise.all(
        data.map(async r => {
            const details = await rateDB.getCarrierTransportRateDetails(conn, r.rateId);

            const originZone = await zoneDB.getZoneById(conn, r.originZoneId);
            const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

            const destinationZone = await zoneDB.getZoneById(conn, r.destinationZoneId);
            const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

            const createdByName = await userDB.getUserName(conn, r.createdBy);
            const updatedByName = r.updatedBy ? await userDB.getUserName(conn, r.updatedBy) : undefined;

            const carrierCount = await carrierDB.countCarriersByRateId(conn, r.rateId);
            const notes = r?.noteThreadId
                ? await noteDB.getMessagesByThread(conn, r.noteThreadId)
                : [];

            return {
                ...r,
                originZone: originZone
                    ? {
                        zoneId: originZone.zoneId,
                        zoneName: originZone.zoneName,
                        zipCodes: originZips.filter(z => z.zipCode).map(z => z.zipCode!),
                        ranges: originZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                    }
                    : null,
                destinationZone: destinationZone
                    ? {
                        zoneId: destinationZone.zoneId,
                        zoneName: destinationZone.zoneName,
                        zipCodes: destinationZips.filter(z => z.zipCode).map(z => z.zipCode!),
                        ranges: destinationZips.filter(z => z.rangeStart && z.rangeEnd).map(z => `${z.rangeStart}-${z.rangeEnd}`)
                    }
                    : null,
                details,
                createdByName,
                updatedByName,
                carrierCount,
                notes
            };
        })
    );

    return {
        rates: enriched,
        total,
        page,
        pageSize
    };
}
