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
import { toUtcDate } from '../../utils/dateFormater';

type TransportRateQuoteResult = {
    rateId: number;
    carrierRateId: number;
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
    req: CreateCarrierTransportRateRequest,
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

    const existingRates = await rateDB.listCarrierTransportRates(conn, {}, 1, 10000);

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
    const detail = details.find(d => d?.rateField?.toString().toUpperCase().includes(fieldName.toUpperCase()));
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

export async function getCarrierTransportRateQuoteService(
    conn: Connection,
    originZip: string,
    destinationZip: string,
    weight: number,
    terminalId: number
): Promise<TransportRateQuoteResult> {
    const normalizedOriginZip = originZip?.trim();
    const normalizedDestinationZip = destinationZip?.trim();

    if (!normalizedOriginZip || !normalizedDestinationZip) {
        throw new Error('Origin zip and destination zip are required');
    }

    if (!Number.isFinite(weight) || weight <= 0) {
        throw new Error('Weight must be a positive number');
    }

    if (!terminalId || Number.isNaN(terminalId)) {
        throw new Error('terminalId is required');
    }

    const mappings = await rateDB.getTerminalRates(conn, terminalId, 'TRANSPORT');
    if (!mappings.length) {
        throw new Error('No transport rate available for the provided terminalId');
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
            const rate = await rateDB.getCarrierTransportRateById(conn, rateId);
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
        throw new Error('No transport rate found for the provided origin/destination pair and terminal mapping');
    }

    const matchedRate = filteredRates[0];

    if (matchingRates.length > 1) {
        throw new Error('More than one transport rate exists for the provided origin/destination pair');
    }

    if (!matchingRates.length) {
        throw new Error('No transport rate found for the provided origin/destination pair');
    }

    const rate = matchedRate.rate;
    const details = await rateDB.getCarrierTransportRateDetails(conn, rate.rateId);
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
        carrierRateId: rate.carrierRateId,
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
        await validateTransportRateZipUniqueness(conn, req.originZoneId, req.destinationZoneId, req);

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
            createdAt: rate?.createdAt ? toUtcDate(rate.createdAt) : null,
            updatedByName,
            updatedAt: rate?.updatedAt ? toUtcDate(rate.updatedAt) : null,
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
        createdAt: rate.createdAt ? toUtcDate(rate.createdAt) : null,
        createdByName,
        updatedAt: rate.updatedAt ? toUtcDate(rate.updatedAt) : null,
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
        const existingRate = await rateDB.getCarrierTransportRateById(conn, rateId);
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
            createdAt: rate?.createdAt ? toUtcDate(rate.createdAt) : null,
            updatedAt: rate?.updatedAt ? toUtcDate(rate.updatedAt) : null,
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
        return maps
            .filter(m => terminalRateIds.includes(m.terminalRateId))
            .map(m => ({
                ...m,
                assignedAt: m.assignedAt ? toUtcDate(m.assignedAt) : null
            }));
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

    const rows = await rateDB.getTerminalRates(conn, terminalId, rateType, search);
    return await Promise.all(
        rows.map(async r => {
            if (r.rateType === 'WAREHOUSE') {
                return {
                    terminalRateId: r.terminalRateId,
                    terminalId: r.terminalId,
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
                    ? await noteDB.getMessagesByThread(conn, rate.noteThreadId)
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
                        createdAt: rate?.createdAt ? toUtcDate(rate.createdAt) : null,
                        updatedByName,
                        updatedAt: rate?.updatedAt ? toUtcDate(rate.updatedAt) : null,
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
                createdAt: r.createdAt ? toUtcDate(r.createdAt) : null,
                updatedByName,
                updatedAt: r.updatedAt ? toUtcDate(r.updatedAt) : null,
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
                createdAt: r.createdAt ? toUtcDate(r.createdAt) : null,
                updatedByName,
                updatedAt: r.updatedAt ? toUtcDate(r.updatedAt) : null,
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
