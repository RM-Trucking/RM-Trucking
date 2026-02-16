import { Connection } from 'odbc';
import * as rateDB from '../../database/maintenance/customerRate';
import * as zoneDB from '../../database/maintenance/zone';
import * as userDB from '../../database/maintenance/user';
import {
    CreateWarehouseRateRequest,
    UpdateWarehouseRateRequest,
    WarehouseRateResponse,
    CreateTransportRateRequest,
    UpdateTransportRateRequest,
    TransportRateResponse,
    AssignRateToStationRequest,
    StationRateMapResponse,
    TransportRateSearch
} from '../../entities/maintenance';

// -------------------- Warehouse Rate --------------------
export async function createWarehouseRateService(
    conn: Connection,
    req: CreateWarehouseRateRequest
): Promise<WarehouseRateResponse> {
    const rateId = await rateDB.createWarehouseRate(conn, req);
    const rate = await rateDB.getWarehouseRateById(conn, rateId);
    if (!rate) throw new Error('Failed to create warehouse rate');
    return rate;
}

export async function getWarehouseRateService(
    conn: Connection,
    rateId: number
): Promise<WarehouseRateResponse | null> {
    return await rateDB.getWarehouseRateById(conn, rateId);
}

export async function updateWarehouseRateService(
    conn: Connection,
    rateId: number,
    req: UpdateWarehouseRateRequest
): Promise<WarehouseRateResponse> {
    await rateDB.updateWarehouseRate(conn, rateId, req);
    const rate = await rateDB.getWarehouseRateById(conn, rateId);
    if (!rate) throw new Error('Failed to update warehouse rate');
    return rate;
}

export async function deleteWarehouseRateService(
    conn: Connection,
    rateId: number
): Promise<void> {
    await rateDB.deleteWarehouseRate(conn, rateId);
}


// -------------------- Transport Rate --------------------
export async function createTransportRateService(
    conn: Connection,
    req: CreateTransportRateRequest,
    userId: number
): Promise<TransportRateResponse> {
    await conn.beginTransaction();
    try {
        const rateId = await rateDB.createTransportRate(conn, req.originZoneId, req.destinationZoneId, userId);

        if (req.details && req.details.length > 0) {
            for (const d of req.details) {
                await rateDB.createTransportRateDetail(conn, rateId, d.rateField, d.chargeValue, d.perUnitFlag);
            }
        }

        const rate = await rateDB.getTransportRateById(conn, rateId);
        const details = await rateDB.getTransportRateDetails(conn, rateId);

        // Enrich with zone info
        const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
        const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

        const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
        const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

        // Resolve user names
        const createdByName = await userDB.getUserName(conn, rate!.createdBy);
        const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;

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
            updatedByName
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


export async function getTransportRateService(
    conn: Connection,
    rateId: number
): Promise<TransportRateResponse | null> {
    const rate = await rateDB.getTransportRateById(conn, rateId);
    if (!rate) return null;

    const details = await rateDB.getTransportRateDetails(conn, rateId);

    // Fetch origin zone info
    const originZone = await zoneDB.getZoneById(conn, rate.originZoneId);
    const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

    // Fetch destination zone info
    const destinationZone = await zoneDB.getZoneById(conn, rate.destinationZoneId);
    const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

    // Resolve user names
    const createdByName = await userDB.getUserName(conn, rate.createdBy);
    const updatedByName = rate.updatedBy ? await userDB.getUserName(conn, rate.updatedBy) : undefined;

    return {
        rateId: rate.rateId,
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
        createdByName: createdByName,
        updatedAt: rate.updatedAt,
        updatedByName: updatedByName
    };
}


export async function updateTransportRateService(
    conn: Connection,
    rateId: number,
    req: UpdateTransportRateRequest
): Promise<TransportRateResponse> {
    await conn.beginTransaction();
    try {
        // Update base record if needed
        if (req.originZoneId || req.destinationZoneId) {
            await rateDB.updateTransportRate(conn, rateId, req.originZoneId, req.destinationZoneId);
        }

        // Replace details if provided
        if (req.details && req.details.length > 0) {
            await rateDB.deleteTransportRateDetails(conn, rateId);
            for (const d of req.details) {
                await rateDB.createTransportRateDetail(conn, rateId, d.rateField, d.chargeValue, d.perUnitFlag);
            }
        }

        // Fetch updated rate and details
        const rate = await rateDB.getTransportRateById(conn, rateId);
        const details = await rateDB.getTransportRateDetails(conn, rateId);

        // Enrich with zone info
        const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
        const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

        const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
        const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

        // Resolve user names
        const createdByName = await userDB.getUserName(conn, rate!.createdBy);
        const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;

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
            updatedByName
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


export async function deleteTransportRateService(
    conn: Connection,
    rateId: number
): Promise<void> {
    await rateDB.deleteTransportRate(conn, rateId);
}


// -------------------- Station Rate Map --------------------
export async function assignRateToStationService(
    conn: Connection,
    req: AssignRateToStationRequest[],
    assignedBy: string
): Promise<StationRateMapResponse[]> {
    await conn.beginTransaction();
    try {
        const stationRateIds: number[] = [];

        for (const r of req) {
            const stationRateId = await rateDB.assignRateToStation(
                conn,
                r.stationId,
                r.rateId,
                r.rateType,
                assignedBy
            );
            stationRateIds.push(stationRateId);
        }

        // Fetch all maps for the station
        const maps = await rateDB.getStationRates(conn, req[0].stationId);

        await conn.commit();

        // Return only the ones we just inserted
        return maps.filter(m => stationRateIds.includes(m.stationRateId));
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}


export async function getStationRatesService(
    conn: Connection,
    stationId: number,
    rateType?: 'WAREHOUSE' | 'TRANSPORT'
): Promise<any[]> {
    const rows = await rateDB.getStationRates(conn, stationId, rateType);

    return await Promise.all(
        rows.map(async r => {
            if (r.rateType === 'WAREHOUSE') {
                return {
                    stationRateId: r.stationRateId,
                    stationId: r.stationId,
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
                const rate = await rateDB.getTransportRateById(conn, r.rateId);
                const details = await rateDB.getTransportRateDetails(conn, r.rateId);

                const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
                const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

                const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
                const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

                const createdByName = await userDB.getUserName(conn, rate!.createdBy);
                const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;

                return {
                    stationRateId: r.stationRateId,
                    stationId: r.stationId,
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
                        updatedByName
                    }
                };
            }
        })
    );
}


export async function deleteStationRateMapService(
    conn: Connection,
    stationRateId: number
): Promise<void> {
    await rateDB.deleteStationRateMap(conn, stationRateId);
}


export async function listWarehouseRatesService(
    conn: Connection,
    search?: string,
    page: number = 1,
    pageSize: number = 10
) {
    const { data, total } = await rateDB.listWarehouseRates(conn, search, page, pageSize);
    return {
        rates: data,
        total,
        page,
        pageSize
    };
}

export async function listTransportRatesService(
    conn: Connection,
    search?: TransportRateSearch,
    page: number = 1,
    pageSize: number = 10
) {
    const { data, total } = await rateDB.listTransportRates(conn, search || {}, page, pageSize);

    const enriched = await Promise.all(
        data.map(async r => {
            const details = await rateDB.getTransportRateDetails(conn, r.rateId);

            const originZone = await zoneDB.getZoneById(conn, r.originZoneId);
            const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

            const destinationZone = await zoneDB.getZoneById(conn, r.destinationZoneId);
            const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

            const createdByName = await userDB.getUserName(conn, r.createdBy);
            const updatedByName = r.updatedBy ? await userDB.getUserName(conn, r.updatedBy) : undefined;

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
                updatedByName
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

export async function listTransportRatesByZoneService(
    conn: Connection,
    zoneId: number,
    page: number = 1,
    pageSize: number = 10
) {
    const offset = (page - 1) * pageSize;

    // Query all rates where this zone is origin or destination
    const { data, total } = await rateDB.listTransportRatesByZone(conn, zoneId, pageSize, offset);

    const enriched = await Promise.all(
        data.map(async r => {
            const details = await rateDB.getTransportRateDetails(conn, r.rateId);

            const originZone = await zoneDB.getZoneById(conn, r.originZoneId);
            const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

            const destinationZone = await zoneDB.getZoneById(conn, r.destinationZoneId);
            const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

            const createdByName = await userDB.getUserName(conn, r.createdBy);
            const updatedByName = r.updatedBy ? await userDB.getUserName(conn, r.updatedBy) : undefined;

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
                updatedByName
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
