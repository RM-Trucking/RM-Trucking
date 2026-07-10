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

type TransportRateQuoteResult = {
    rateId: number;
    customerRateId: number;
    originZone: { zoneId: number; zoneName: string } | null;
    destinationZone: { zoneId: number; zoneName: string } | null;
    calculatedRate: number;
    minRate: number | null;
    maxRate: number | null;
    matchedRateField: string | null;
    usedNearestRateField: boolean;
    details: any[];
};

type ZipCandidate =
    | { kind: 'zip'; value: string }
    | { kind: 'range'; start: string; end: string };

type ZoneZipLike = {
    zipCode?: string | null;
    rangeStart?: string | null;
    rangeEnd?: string | null;
};

function parseZipCandidates(input?: string): ZipCandidate[] {
    if (!input) return [];

    return input
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .flatMap(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(value => value.trim());
                return start && end ? [{ kind: 'range' as const, start, end }] as ZipCandidate[] : [];
            }

            return [{ kind: 'zip' as const, value: part }] as ZipCandidate[];
        });
}

function normalizeZipValue(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function toNumericZip(value?: string | null): number | null {
    const normalized = normalizeZipValue(value);
    if (!normalized || !/^\d+$/.test(normalized)) {
        return null;
    }
    return Number(normalized);
}

function isZipWithinRange(zipValue: string, start: string, end: string): boolean {
    const zipNumber = toNumericZip(zipValue);
    const startNumber = toNumericZip(start);
    const endNumber = toNumericZip(end);

    if (zipNumber === null || startNumber === null || endNumber === null) {
        return false;
    }

    const low = Math.min(startNumber, endNumber);
    const high = Math.max(startNumber, endNumber);
    return zipNumber >= low && zipNumber <= high;
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const aStart = toNumericZip(startA);
    const aEnd = toNumericZip(endA);
    const bStart = toNumericZip(startB);
    const bEnd = toNumericZip(endB);

    if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
        return false;
    }

    const lowA = Math.min(aStart, aEnd);
    const highA = Math.max(aStart, aEnd);
    const lowB = Math.min(bStart, bEnd);
    const highB = Math.max(bStart, bEnd);

    return lowA <= highB && lowB <= highA;
}

function candidateMatchesZoneEntry(candidate: ZipCandidate, zoneEntry: ZoneZipLike): boolean {
    const zipCode = normalizeZipValue(zoneEntry.zipCode);

    if (candidate.kind === 'zip') {
        if (zipCode) {
            return candidate.value === zipCode;
        }

        return !!zoneEntry.rangeStart && !!zoneEntry.rangeEnd && isZipWithinRange(candidate.value, zoneEntry.rangeStart, zoneEntry.rangeEnd);
    }

    if (zipCode) {
        return isZipWithinRange(zipCode, candidate.start, candidate.end);
    }

    return !!zoneEntry.rangeStart && !!zoneEntry.rangeEnd && rangesOverlap(candidate.start, candidate.end, zoneEntry.rangeStart, zoneEntry.rangeEnd);
}

function candidateMatchesZone(candidate: ZipCandidate, zoneEntries: ZoneZipLike[]): boolean {
    return zoneEntries.some(entry => candidateMatchesZoneEntry(candidate, entry));
}

function buildZoneCandidates(zoneZips: ZoneZipLike[]): ZipCandidate[] {
    return zoneZips.flatMap(entry => {
        const candidates: ZipCandidate[] = [];
        const zipCode = normalizeZipValue(entry.zipCode);
        if (zipCode) {
            candidates.push({ kind: 'zip', value: zipCode });
        }

        if (entry.rangeStart && entry.rangeEnd) {
            candidates.push({ kind: 'range', start: entry.rangeStart, end: entry.rangeEnd });
        }

        return candidates;
    });
}

async function validateTransportRateZipUniqueness(
    conn: Connection,
    originZoneId: number,
    destinationZoneId: number,
    req: CreateCustomerTransportRateRequest,
    excludeRateId?: number
): Promise<void> {
    const originZoneZips = await zoneDB.getZoneZips(conn, originZoneId);
    const destinationZoneZips = await zoneDB.getZoneZips(conn, destinationZoneId);

    const explicitOriginCandidates = parseZipCandidates(req.originZipOrRange);
    const explicitDestinationCandidates = parseZipCandidates(req.destinationZipOrRange);

    const originCandidates = explicitOriginCandidates.length > 0
        ? explicitOriginCandidates
        : buildZoneCandidates(originZoneZips);

    const destinationCandidates = explicitDestinationCandidates.length > 0
        ? explicitDestinationCandidates
        : buildZoneCandidates(destinationZoneZips);

    if (!originCandidates.length || !destinationCandidates.length) {
        return;
    }

    const existingRates = await rateDB.listCustomerTransportRates(conn, {}, 1, 10000);

    for (const existingRate of existingRates.data) {
        if (excludeRateId !== undefined && existingRate.rateId === excludeRateId) {
            continue;
        }
        const existingOriginZips = await zoneDB.getZoneZips(conn, existingRate.originZoneId);
        const existingDestinationZips = await zoneDB.getZoneZips(conn, existingRate.destinationZoneId);

        for (const originCandidate of originCandidates) {
            if (!candidateMatchesZone(originCandidate, existingOriginZips)) {
                continue;
            }

            for (const destinationCandidate of destinationCandidates) {
                if (candidateMatchesZone(destinationCandidate, existingDestinationZips)) {
                    throw new Error('A transport rate already exists for the provided origin/destination zip range.');
                }
            }
        }
    }
}

function parseNumericRateField(value?: string | null): number | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed || Number.isNaN(Number(trimmed))) return null;
    return Number(trimmed);
}

function getBoundaryDetail(details: any[], fieldName: string): number | null {
    const detail = details.find(d => d?.rateField?.toString().toUpperCase() === fieldName);
    return detail ? Number(detail.chargeValue) : null;
}

function calculateTransportRateQuote(details: any[], weight: number): { calculatedRate: number; matchedRateField: string | null; usedNearestRateField: boolean } {
    const numericDetails = (details || [])
        .map(d => ({ ...d, numericRateField: parseNumericRateField(d?.rateField) }))
        .filter(d => d.numericRateField !== null)
        .sort((a, b) => (a.numericRateField ?? 0) - (b.numericRateField ?? 0));

    const exactMatch = numericDetails.find(d => d.numericRateField === weight);
    if (exactMatch) {
        const rateValue = Number(exactMatch.chargeValue || 0);
        return {
            calculatedRate: exactMatch.perUnitFlag === 'Y' ? rateValue * weight : rateValue,
            matchedRateField: exactMatch.rateField,
            usedNearestRateField: false
        };
    }

    if (!numericDetails.length) {
        return { calculatedRate: 0, matchedRateField: null, usedNearestRateField: false };
    }

    const selectedDetail = numericDetails.reduce((closest, current) => {
        if (!closest) return current;
        if ((current.numericRateField ?? 0) <= weight) {
            return current.numericRateField! > (closest.numericRateField ?? 0) ? current : closest;
        }
        return closest;
    }, null as any);

    const fallbackDetail = selectedDetail ?? numericDetails[numericDetails.length - 1];
    const rateValue = Number(fallbackDetail.chargeValue || 0);
    const selectedWeight = Number(fallbackDetail.numericRateField ?? weight);
    const calculatedRate = fallbackDetail.perUnitFlag === 'Y'
        ? rateValue * (weight / selectedWeight)
        : rateValue;

    return {
        calculatedRate,
        matchedRateField: fallbackDetail.rateField,
        usedNearestRateField: true
    };
}

export async function getCustomerTransportRateQuoteService(
    conn: Connection,
    originZip: string,
    destinationZip: string,
    weight: number,
    stationId: number
): Promise<TransportRateQuoteResult> {
    const normalizedOriginZip = originZip?.trim();
    const normalizedDestinationZip = destinationZip?.trim();

    if (!normalizedOriginZip || !normalizedDestinationZip) {
        throw new Error('Origin zip and destination zip are required');
    }

    if (!Number.isFinite(weight) || weight <= 0) {
        throw new Error('Weight must be a positive number');
    }

    if (!stationId || Number.isNaN(stationId)) {
        throw new Error('stationId is required');
    }

    const mappings = await rateDB.getStationRates(conn, stationId, 'TRANSPORT');
    if (!mappings.length) {
        throw new Error('No transport rate available for the provided stationId');
    }

    const originZones = await zoneDB.findZonesByZip(conn, normalizedOriginZip);
    const destinationZones = await zoneDB.findZonesByZip(conn, normalizedDestinationZip);

    if (!originZones.length || !destinationZones.length) {
        throw new Error('No matching zone found for the provided zip code(s)');
    }

    const matchingRates = mappings
        .map(mapping => mapping.rateId)
        .map(rateId => ({ rateId, rate: null as any }))
        .filter(({ rateId }) => rateId)
        .map(({ rateId }) => ({ rateId, rate: null as any }));

    const resolvedRates = await Promise.all(
        matchingRates.map(async ({ rateId }) => {
            const rate = await rateDB.getCustomerTransportRateById(conn, rateId);
            return rate ? { rateId, rate } : null;
        })
    );

    const filteredRates = resolvedRates.filter((entry): entry is { rateId: number; rate: any } => !!entry)
        .filter(({ rate }) => {
            const hasOriginMatch = originZones.some(zone => zone.zoneId === rate.originZoneId);
            const hasDestinationMatch = destinationZones.some(zone => zone.zoneId === rate.destinationZoneId);
            return hasOriginMatch && hasDestinationMatch;
        });

    if (filteredRates.length > 1) {
        throw new Error('More than one transport rate exists for the provided origin/destination pair');
    }

    if (!filteredRates.length) {
        throw new Error('No transport rate found for the provided origin/destination pair and station mapping');
    }

    const matchedRate = filteredRates[0];

    if (matchingRates.length > 1) {
        throw new Error('More than one transport rate exists for the provided origin/destination pair');
    }

    if (!matchingRates.length) {
        throw new Error('No transport rate found for the provided origin/destination pair');
    }

    const rate = matchedRate.rate;
    const details = await rateDB.getCustomerTransportRateDetails(conn, rate.rateId);
    const minRate = getBoundaryDetail(details, 'MIN');
    const maxRate = getBoundaryDetail(details, 'MAX');
    const quote = calculateTransportRateQuote(details, weight);
    const calculatedRate = (() => {
        let value = quote.calculatedRate;
        if (minRate !== null && value < minRate) value = minRate;
        if (maxRate !== null && value > maxRate) value = maxRate;
        return Number(value.toFixed(2));
    })();

    return {
        rateId: rate.rateId,
        customerRateId: rate.customerRateId,
        originZone: originZones[0] ? { zoneId: originZones[0].zoneId, zoneName: originZones[0].zoneName } : null,
        destinationZone: destinationZones[0] ? { zoneId: destinationZones[0].zoneId, zoneName: destinationZones[0].zoneName } : null,
        calculatedRate,
        minRate,
        maxRate,
        matchedRateField: quote.matchedRateField,
        usedNearestRateField: quote.usedNearestRateField,
        details
    };
}

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
        await validateTransportRateZipUniqueness(conn, req.originZoneId, req.destinationZoneId, req);

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

        const existingRate = await rateDB.getCustomerTransportRateById(conn, rateId);
        if (!existingRate) throw new Error('Transport rate not found');

        const newOriginZoneId = req.originZoneId ?? existingRate.originZoneId;
        const newDestinationZoneId = req.destinationZoneId ?? existingRate.destinationZoneId;

        const originChanged = req.originZoneId !== undefined && req.originZoneId !== existingRate.originZoneId;
        const destinationChanged = req.destinationZoneId !== undefined && req.destinationZoneId !== existingRate.destinationZoneId;

        if (originChanged || destinationChanged) {
            await validateTransportRateZipUniqueness(conn, newOriginZoneId, newDestinationZoneId, req);
        }
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
        // ✅ 🚨 Rule 1: Only ONE WAREHOUSE in request
        const warehouseCount = req.filter(r => r.rateType === 'WAREHOUSE').length;

        if (warehouseCount > 1) {
            throw new Error('Only one warehouse rate can be assigned per request');
        }

        // Fetch existing mappings once
        const existingMaps = await rateDB.getStationRates(conn, req[0].stationId);

        // ✅ 🚨 Rule 2: Station already has WAREHOUSE
        if (warehouseCount === 1) {
            const existingWarehouse = existingMaps.find(
                m => m.rateType === 'WAREHOUSE'
            );

            if (existingWarehouse) {
                throw new Error(
                    `Station already has a warehouse rate.`
                );
            }
        }

        const stationRateIds: number[] = [];

        for (const r of req) {

            // ✅ Existing duplicate check
            const alreadyMapped = existingMaps.find(
                m => m.rateId === r.rateId && m.rateType === r.rateType
            );

            if (alreadyMapped) {
                stationRateIds.push(alreadyMapped.stationRateId);
            } else {
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

        const maps = await rateDB.getStationRates(conn, req[0].stationId);

        await conn.commit();

        return maps
            .filter(m => stationRateIds.includes(m.stationRateId)) // ✅ fixed field
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
