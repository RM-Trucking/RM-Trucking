import { Connection } from 'odbc';
import * as personnelDB from '../../database/maintenance';
import {
    CreateCustomerPersonnelRequest,
    UpdateCustomerPersonnelRequest,
    CustomerPersonnelResponse
} from '../../entities/maintenance';
import * as noteDB from '../../database/maintenance/note';
import * as entityDB from '../../database/maintenance/entity';
import { toUtcDate } from '../../utils/dateFormater';

/**
 * Create new personnel
 */
export async function createCustomerPersonnelService(
    conn: Connection,
    req: CreateCustomerPersonnelRequest,
    userId: number
): Promise<CustomerPersonnelResponse> {

    // ✅ Validate unique email
    if (req.email) {
        const exists = await personnelDB.checkCustomerPersonnelEmailExists(conn, req.email);
        if (exists) {
            throw new Error(`Email '${req.email}' is already in use. Please provide a unique email.`);
        }
    }

    const entityId = await entityDB.createEntity(conn, 'CUSTOMER_PERSONNEL', req.name);
    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

    if (req.note && req.note.messageText?.trim()) {
        await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
    }

    const personnelId = await personnelDB.createCustomerPersonnel(conn, {
        ...req,
        noteThreadId,
        entityId,
        createdBy: userId
    });

    const personnel = await personnelDB.getCustomerPersonnelById(conn, personnelId);
    if (!personnel) throw new Error('Failed to create personnel');

    const notes = personnel.noteThreadId
        ? await noteDB.getMessagesByThread(conn, personnel.noteThreadId)
        : [];

    return {
        ...personnel,
        createdAt: personnel.createdAt ? toUtcDate(personnel.createdAt) : null,
        updatedAt: personnel.updatedAt ? toUtcDate(personnel.updatedAt) : null,
        notes
    };
}


/**
 * Get personnel by ID
 */
export async function getCustomerPersonnelByIdService(
    conn: Connection,
    personnelId: number
): Promise<CustomerPersonnelResponse | null> {

    const personnel = await personnelDB.getCustomerPersonnelById(conn, personnelId);
    if (!personnel) return null;

    // Fetch notes via Note Thread
    const notes = personnel.noteThreadId
        ? await noteDB.getMessagesByThread(conn, personnel.noteThreadId)
        : [];

    return {
        ...personnel,
        createdAt: personnel.createdAt ? toUtcDate(personnel.createdAt) : null,
        updatedAt: personnel.updatedAt ? toUtcDate(personnel.updatedAt) : null,
        notes
    };
}

/**
 * Get all personnel for a station
 */
export async function getCustomerPersonnelByStationService(
    conn: Connection,
    stationId: number,
    page: number,
    pageSize: number,
    searchTerm?: string | null
): Promise<{ data: CustomerPersonnelResponse[]; pagination: { total: number; page: number; pageSize: number } }> {
    // Fetch paginated personnel
    const personnelList = await personnelDB.getPersonnelByStation(conn, stationId, searchTerm ?? null, page, pageSize);

    // Enrich each personnel with notes
    const enriched = await Promise.all(
        personnelList.map(async (person) => {
            const notes = person.noteThreadId
                ? await noteDB.getMessagesByThread(conn, person.noteThreadId)
                : [];
            return {
                ...person,
                createdAt: person.createdAt ? toUtcDate(person.createdAt) : null,
                updatedAt: person.updatedAt ? toUtcDate(person.updatedAt) : null,
                notes
            };
        })
    );

    // Count total for pagination metadata
    const total = await personnelDB.countPersonnelByStation(conn, stationId, searchTerm ?? null);

    return {
        data: enriched,
        pagination: {
            total,
            page,
            pageSize
        }
    };
}


/**
 * Update personnel
 */
export async function updateCustomerPersonnelService(
    conn: Connection,
    personnelId: number,
    updates: UpdateCustomerPersonnelRequest,
    userId: number
): Promise<CustomerPersonnelResponse> {
    await personnelDB.updateCustomerPersonnel(conn, personnelId, updates, userId);

    const personnel = await personnelDB.getCustomerPersonnelById(conn, personnelId);
    if (!personnel) throw new Error('Personnel not found after update');

    const notes = personnel.noteThreadId
        ? await noteDB.getMessagesByThread(conn, personnel.noteThreadId)
        : [];

    return {
        ...personnel,
        createdAt: personnel.createdAt ? toUtcDate(personnel.createdAt) : null,
        updatedAt: personnel.updatedAt ? toUtcDate(personnel.updatedAt) : null,
        notes
    };
}

/**
 * Soft delete personnel
 */
export async function deleteCustomerPersonnelService(
    conn: Connection,
    personnelId: number,
    userId: number
): Promise<void> {
    await personnelDB.softDeleteCustomerPersonnel(conn, personnelId, userId);
}
