import { Connection } from 'odbc';
import * as rateDB from '../../database/maintenance/customerRate';
import * as zoneDB from '../../database/maintenance/zone';
import * as userDB from '../../database/maintenance/user';
import * as customerDB from '../../database/maintenance/customer';
import * as entityDB from '../../database/maintenance/entity';
import * as noteDB from '../../database/maintenance/note';

import {
    CreateCustomerWarehouseRateRequest,
    UpdateCustomerWarehouseRateRequest,
    CustomerWarehouseRateResponse,
    CreateCustomerTransportRateRequest,
    UpdateCustomerTransportRateRequest,
    CustomerTransportRateResponse,
    AssignRateToStationRequest,
    StationRateMapResponse,
    CustomerTransportRateSearch
} from '../../entities/maintenance';
import { toUtcDate } from '../../utils/dateFormater';

// -------------------- Warehouse Rate --------------------
export async function createCustomerWarehouseRateService(
    conn: Connection,
    req: CreateCustomerWarehouseRateRequest
): Promise<CustomerWarehouseRateResponse> {
    const rateId = await rateDB.createCustomerWarehouseRate(conn, req);
    const rate = await rateDB.getCustomerWarehouseRateById(conn, rateId);
    if (!rate) throw new Error('Failed to create warehouse rate');
    return rate;
}

export async function getCustomerWarehouseRateService(
    conn: Connection,
    rateId: number
): Promise<CustomerWarehouseRateResponse | null> {
    return await rateDB.getCustomerWarehouseRateById(conn, rateId);
}

export async function updateCustomerWarehouseRateService(
    conn: Connection,
    rateId: number,
    req: UpdateCustomerWarehouseRateRequest
): Promise<CustomerWarehouseRateResponse> {
    await rateDB.updateCustomerWarehouseRate(conn, rateId, req);
    const rate = await rateDB.getCustomerWarehouseRateById(conn, rateId);
    if (!rate) throw new Error('Failed to update warehouse rate');
    return rate;
}

export async function deleteCustomerWarehouseRateService(
    conn: Connection,
    rateId: number
): Promise<void> {
    await rateDB.deleteCustomerWarehouseRate(conn, rateId);
}


// -------------------- Transport Rate --------------------
export async function createCustomerTransportRateService(
    conn: Connection,
    req: CreateCustomerTransportRateRequest,
    userId: number
): Promise<CustomerTransportRateResponse> {
    await conn.beginTransaction();
    try {

        // 1) Create the transport rate (without entity/noteThread yet)
        const rateId = await rateDB.createCustomerTransportRate(
            conn,
            req.originZoneId,
            req.destinationZoneId,
            userId
        );

        // 2) Fetch the CustomerRateId from the newly created rate
        const customerRate = await rateDB.getCustomerTransportRateById(conn, rateId);
        if (!customerRate) throw new Error("Failed to create customer transport rate");

        // 3) Create Entity for this CustomerRate
        const entityId = await entityDB.createEntity(conn, 'CUSTOMER_TRANSPORT_RATE', customerRate.customerRateId.toString());

        // 4) Create Note Thread linked to the entity
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

        // 5) Update Customer_Rate with entityId and noteThreadId
        await rateDB.updateCustomerRateEntityAndNoteThread(conn, customerRate.customerRateId, entityId, noteThreadId);

        // If initial note is provided, create the first message
        if (req.note && req.note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
        }

        if (req.details && req.details.length > 0) {
            for (const d of req.details) {
                await rateDB.createCustomerTransportRateDetail(conn, rateId, d.rateField, d.chargeValue, d.perUnitFlag);
            }
        }

        const rate = await rateDB.getCustomerTransportRateById(conn, rateId);
        const details = await rateDB.getCustomerTransportRateDetails(conn, rateId);

        // Enrich with zone info
        const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
        const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

        const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
        const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

        // Resolve user names
        const createdByName = await userDB.getUserName(conn, rate!.createdBy);
        const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;

        const customerCount = await customerDB.countCustomersByRateId(conn, rateId);

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
            createdAt: rate?.createdAt ? toUtcDate(rate.createdAt) : null,
            updatedByName,
            updatedAt: rate?.updatedAt ? toUtcDate(rate.updatedAt) : null,
            customerCount,
            entityId,
            noteThreadId,
            notes
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


export async function getCustomerTransportRateService(
    conn: Connection,
    rateId: number
): Promise<CustomerTransportRateResponse | null> {
    const rate = await rateDB.getCustomerTransportRateById(conn, rateId);
    if (!rate) return null;

    const details = await rateDB.getCustomerTransportRateDetails(conn, rateId);

    // Fetch origin zone info
    const originZone = await zoneDB.getZoneById(conn, rate.originZoneId);
    const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

    // Fetch destination zone info
    const destinationZone = await zoneDB.getZoneById(conn, rate.destinationZoneId);
    const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

    // Resolve user names
    const createdByName = await userDB.getUserName(conn, rate.createdBy);
    const updatedByName = rate.updatedBy ? await userDB.getUserName(conn, rate.updatedBy) : undefined;

    // 🔑 Fetch customer count
    const customerCount = await customerDB.countCustomersByRateId(conn, rateId);

    const notes = rate?.noteThreadId
        ? await noteDB.getMessagesByThread(conn, rate.noteThreadId)
        : [];

    return {
        rateId: rate.rateId,
        customerRateId: rate.customerRateId,
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
        createdAt: rate.createdAt ? toUtcDate(rate.createdAt) : null,
        createdByName,
        updatedAt: rate.updatedAt ? toUtcDate(rate.updatedAt) : null,
        updatedByName,
        customerCount,
        entityId: rate.entityId,
        noteThreadId: rate.noteThreadId,
        notes
    };
}



export async function updateCustomerTransportRateService(
    conn: Connection,
    rateId: number,
    req: UpdateCustomerTransportRateRequest,
    userId: number
): Promise<CustomerTransportRateResponse> {
    await conn.beginTransaction();
    try {
        // Update base record if needed
        if (req.originZoneId || req.destinationZoneId) {
            await rateDB.updateCustomerTransportRate(conn, rateId, req.originZoneId, req.destinationZoneId, userId);
        }

        if (req.note && req.note.messageText?.trim()) {
            if (!req.noteThreadId) throw new Error('Note thread not found for mapping');
            await noteDB.createNoteMessage(conn, req.noteThreadId, req.note.messageText.trim(), userId);
        }

        // Replace details if provided
        if (req.details && req.details.length > 0) {
            await rateDB.deleteCustomerTransportRateDetails(conn, rateId);
            for (const d of req.details) {
                await rateDB.createCustomerTransportRateDetail(conn, rateId, d.rateField, d.chargeValue, d.perUnitFlag);
            }
        }

        // Fetch updated rate and details
        const rate = await rateDB.getCustomerTransportRateById(conn, rateId);
        const details = await rateDB.getCustomerTransportRateDetails(conn, rateId);

        // Enrich with zone info
        const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
        const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

        const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
        const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

        // Resolve user names
        const createdByName = await userDB.getUserName(conn, rate!.createdBy);
        const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;
        const customerCount = await customerDB.countCustomersByRateId(conn, rateId);
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
            createdAt: rate?.createdAt ? toUtcDate(rate.createdAt) : null,
            updatedByName,
            updatedAt: rate?.updatedAt ? toUtcDate(rate.updatedAt) : null,
            customerCount,
            notes
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


export async function deleteCustomerTransportRateService(
    conn: Connection,
    rateId: number
): Promise<void> {
    await rateDB.deleteCustomerTransportRate(conn, rateId);
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
            // First check if mapping already exists
            const existingMaps = await rateDB.getStationRates(conn, r.stationId);
            const alreadyMapped = existingMaps.find(
                m => m.rateId === r.rateId && m.rateType === r.rateType
            );

            if (alreadyMapped) {
                // If already mapped, just reuse the existing ID
                stationRateIds.push(alreadyMapped.stationRateId);
            } else {
                // Otherwise insert new mapping
                const stationRateId = await rateDB.assignRateToStation(
                    conn,
                    r.stationId,
                    r.rateId,
                    r.rateType,
                    assignedBy
                );
                stationRateIds.push(stationRateId);
            }
        }

        // Fetch all maps for the station (or stations if multiple)
        const maps = await rateDB.getStationRates(conn, req[0].stationId);

        await conn.commit();

        // Return only the ones we just inserted or reused
        return maps
            .filter(m => stationRateIds.includes(m.terminalRateId))
            .map(m => ({
                ...m,
                assignedAt: m.assignedAt ? toUtcDate(m.assignedAt) : null
            }));
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}



export async function getStationRatesService(
    conn: Connection,
    stationId: number,
    rateType?: 'WAREHOUSE' | 'TRANSPORT',
    search?: CustomerTransportRateSearch
): Promise<any[]> {

    const rows = await rateDB.getStationRates(conn, stationId, rateType, search);

    return await Promise.all(
        rows.map(async r => {
            if (r.rateType === 'WAREHOUSE') {
                return {
                    stationRateId: r.stationRateId,
                    stationId: r.stationId,
                    rateId: r.rateId,
                    rateType: r.rateType,
                    assignedBy: r.userName,
                    assignedAt: r.assignedAt ? toUtcDate(r.assignedAt) : null,
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
                const rate = await rateDB.getCustomerTransportRateById(conn, r.rateId);
                const details = await rateDB.getCustomerTransportRateDetails(conn, r.rateId);

                const originZone = await zoneDB.getZoneById(conn, rate!.originZoneId);
                const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

                const destinationZone = await zoneDB.getZoneById(conn, rate!.destinationZoneId);
                const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

                const createdByName = await userDB.getUserName(conn, rate!.createdBy);
                const updatedByName = rate!.updatedBy ? await userDB.getUserName(conn, rate!.updatedBy) : undefined;

                const customerCount = await customerDB.countCustomersByRateId(conn, r.rateId);

                const notes = rate?.noteThreadId
                    ? await noteDB.getMessagesByThread(conn, rate.noteThreadId)
                    : [];

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
                        createdAt: rate?.createdAt ? toUtcDate(rate.createdAt) : null,
                        updatedByName,
                        updatedAt: rate?.updatedAt ? toUtcDate(rate.updatedAt) : null,
                        customerCount,
                        entityId: r.entityId,
                        noteThreadId: r.noteThreadId,
                        notes
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


export async function listCustomerWarehouseRatesService(
    conn: Connection,
    search?: string,
    page: number = 1,
    pageSize: number = 10
) {
    const { data, total } = await rateDB.listCustomerWarehouseRates(conn, search, page, pageSize);
    return {
        rates: data,
        total,
        page,
        pageSize
    };
}

export async function listCustomerTransportRatesService(
    conn: Connection,
    search?: CustomerTransportRateSearch,
    page: number = 1,
    pageSize: number = 10
) {
    const { data, total } = await rateDB.listCustomerTransportRates(conn, search || {}, page, pageSize);

    const enriched = await Promise.all(
        data.map(async r => {
            const details = await rateDB.getCustomerTransportRateDetails(conn, r.rateId);

            const originZone = await zoneDB.getZoneById(conn, r.originZoneId);
            const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

            const destinationZone = await zoneDB.getZoneById(conn, r.destinationZoneId);
            const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

            const createdByName = await userDB.getUserName(conn, r.createdBy);
            const updatedByName = r.updatedBy ? await userDB.getUserName(conn, r.updatedBy) : undefined;
            const customerCount = await customerDB.countCustomersByRateId(conn, r.rateId);

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
                createdAt: r.createdAt ? toUtcDate(r.createdAt) : null,
                updatedByName,
                updatedAt: r.updatedAt ? toUtcDate(r.updatedAt) : null,
                customerCount,
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

export async function listCustomerTransportRatesByZoneService(
    conn: Connection,
    zoneId: number,
    page: number = 1,
    pageSize: number = 10
) {

    const offset = (page - 1) * pageSize;

    // Query all rates where this zone is origin or destination
    const { data, total } = await rateDB.listCustomerTransportRatesByZone(conn, zoneId, pageSize, offset);

    const enriched = await Promise.all(
        data.map(async r => {
            const details = await rateDB.getCustomerTransportRateDetails(conn, r.rateId);

            const originZone = await zoneDB.getZoneById(conn, r.originZoneId);
            const originZips = originZone ? await zoneDB.getZoneZips(conn, originZone.zoneId) : [];

            const destinationZone = await zoneDB.getZoneById(conn, r.destinationZoneId);
            const destinationZips = destinationZone ? await zoneDB.getZoneZips(conn, destinationZone.zoneId) : [];

            const createdByName = await userDB.getUserName(conn, r.createdBy);
            const updatedByName = r.updatedBy ? await userDB.getUserName(conn, r.updatedBy) : undefined;

            const customerCount = await customerDB.countCustomersByRateId(conn, r.rateId);
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
                createdAt: r.createdAt ? toUtcDate(r.createdAt) : null,
                updatedByName,
                updatedAt: r.updatedAt ? toUtcDate(r.updatedAt) : null,
                customerCount,
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
