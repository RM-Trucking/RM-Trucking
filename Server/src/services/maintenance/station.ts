import { Connection } from 'odbc';
import {
    CreateStationRequest,
    UpdateStationRequest,
    StationResponse
} from '../../entities/maintenance';
import * as stationDB from '../../database/maintenance/station';
import * as entityDB from '../../database/maintenance/entity';
import * as addressDB from '../../database/maintenance/address';
import * as noteDB from '../../database/maintenance/note';

/**
 * Create a new station with addresses and optional note
 */
export async function createStation(
    conn: Connection,
    createStationReq: CreateStationRequest,
    adminId: number
): Promise<{ station: StationResponse }> {
    const {
        customerId,
        stationName,
        rmAccountNumber,
        airportCode,
        phoneNumber,
        faxNumber,
        openTime,
        closeTime,
        hours,
        warehouse,
        warehouseDetail,
        addresses,
        note
    } = createStationReq;


    // Uniqueness check
    const existingStation = await stationDB.getStationByRmAccountNumber(conn, rmAccountNumber);
    if (existingStation) {
        throw new Error('RM account number already exists');
    }

    await conn.beginTransaction();
    try {
        // 1) Create Entity
        const entityId = await entityDB.createEntity(conn, 'STATION', stationName);

        // 2) Create Note Thread
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, adminId);
        if (note && note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, note.messageText.trim(), adminId);
        }


        // 3) Create Station
        const stationId = await stationDB.createStation(conn, {
            customerId,
            entityId,
            stationName,
            rmAccountNumber,
            airportCode,
            phoneNumber,
            faxNumber,
            openTime: openTime === "" ? null : openTime,
            closeTime: closeTime === "" ? null : closeTime,
            hours,
            warehouse,
            warehouseDetail,
            createdBy: adminId,
            noteThreadId,
            activeStatus: 'Y'
        });


        // 4) Create Addresses + Map
        const addressResults = await Promise.all(
            (addresses || []).map(async (addr) => {
                const addressId = await addressDB.createAddress(
                    conn,
                    addr.line1,
                    addr.line2 || null,
                    addr.city,
                    addr.state,
                    addr.zipCode,
                    adminId
                );
                await addressDB.createEntityAddressMap(conn, entityId, addressId, addr.addressRole);
                return { addressId, ...addr };
            })
        );

        // 5) Fetch final station row
        const station = await stationDB.getStationById(conn, stationId);
        if (!station) throw new Error('Failed to create station');

        await conn.commit();

        return {
            station: {
                ...station,
                addresses: addressResults,
                notes: note && note.messageText?.trim()
                    ? [{
                        noteMessageId: 0, // placeholder
                        noteThreadId,
                        messageText: note.messageText.trim(),
                        createdAt: new Date(),
                        createdBy: adminId
                    }]
                    : []
            }
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}
/**
 * Get a station by ID (with addresses + notes)
 */
export async function getStationService(conn: Connection, stationId: number): Promise<StationResponse | null> {
    const station = await stationDB.getStationById(conn, stationId);

    console.log(station);


    if (!station) return null;

    // Fetch addresses via Entity_Address_Map
    const addresses = await addressDB.getAddressesForEntity(conn, station.entityId);

    // Fetch notes via Note Thread
    const notes = station.noteThreadId
        ? await noteDB.getMessagesByThread(conn, station.noteThreadId)
        : [];

    return { ...station, addresses, notes };
}

/**
 * Get all stations for a customer (with addresses + notes)
 */
export async function getStationsForCustomerService(
    conn: Connection,
    customerId: number,
    page: number,
    pageSize: number,
    searchTerm: string | null
): Promise<{ stations: StationResponse[]; total: number; page: number; pageSize: number }> {
    // Fetch paginated stations
    const stations = await stationDB.getStationsByCustomer(conn, customerId, page, pageSize, searchTerm);

    // Count total stations for pagination
    const total = await stationDB.countStationsByCustomer(conn, customerId, searchTerm);

    // Enrich each station with addresses + notes
    const enriched = await Promise.all(
        stations.map(async (station) => {
            const addresses = await addressDB.getAddressesForEntity(conn, station.entityId);
            const notes = station.noteThreadId
                ? await noteDB.getMessagesByThread(conn, station.noteThreadId)
                : [];
            return { ...station, addresses, notes };
        })
    );

    return {
        stations: enriched,
        total,
        page,
        pageSize
    };
}



/**
 * Update a station
 */
export async function updateStationService(
    conn: Connection,
    stationId: number,
    updates: UpdateStationRequest,
    userId: number
): Promise<StationResponse> {
    const existing = await stationDB.getStationById(conn, stationId);
    if (!existing) throw new Error('Station not found');

    // 1. Update only Station fields (exclude addresses)
    const {
        stationName,
        rmAccountNumber,
        airportCode,
        phoneNumber,
        faxNumber,
        openTime,
        closeTime,
        hours,
        warehouse,
        warehouseDetail
    } = updates;

    await stationDB.updateStation(conn, stationId, {
        stationName,
        rmAccountNumber,
        airportCode,
        phoneNumber,
        faxNumber,
        openTime: openTime === "" ? null : openTime,
        closeTime: closeTime === "" ? null : closeTime,
        hours,
        warehouse,
        warehouseDetail,
        updatedBy: userId
    });

    // 2. Update addresses (only existing ones)
    if (updates.addresses) {
        for (const addr of updates.addresses) {
            if (!addr.addressId) {
                throw new Error('AddressId is required when updating an address');
            }
            await addressDB.updateAddress(
                conn,
                addr.addressId,
                addr.line1 ?? '',
                addr.line2 ?? null,
                addr.city ?? '',
                addr.state ?? '',
                addr.zipCode ?? '',
                userId,
                addr.addressRole ?? ''
            );
        }
    }

    // 3. Fetch updated station row
    const updated = await stationDB.getStationById(conn, stationId);
    if (!updated) throw new Error('Failed to update station');

    // 4. Fetch addresses + notes
    const addresses = await addressDB.getAddressesForEntity(conn, updated.entityId);
    const notes = updated.noteThreadId
        ? await noteDB.getMessagesByThread(conn, updated.noteThreadId)
        : [];

    return { ...updated, addresses, notes };
}


/**
 * Soft delete a station
 */
export async function deleteStationService(conn: Connection, stationId: number): Promise<void> {
    const existing = await stationDB.getStationById(conn, stationId);
    if (!existing) throw new Error('Station not found');

    await stationDB.softDeleteStation(conn, stationId);
}
