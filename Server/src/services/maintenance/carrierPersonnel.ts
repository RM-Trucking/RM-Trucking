import { Connection } from 'odbc';
import * as personnelDB from '../../database/maintenance';
import {
    CreateCarrierPersonnelRequest,
    UpdateCarrierPersonnelRequest,
    CarrierPersonnelResponse
} from '../../entities/maintenance';
import * as noteDB from '../../database/maintenance/note';
import * as entityDB from '../../database/maintenance/entity';

/**
 * Create new personnel
 */
export async function createCarrierPersonnelService(
    conn: Connection,
    req: CreateCarrierPersonnelRequest,
    userId: number
): Promise<CarrierPersonnelResponse> {

    // ✅ Validate unique email
    if (req.email) {
        const exists = await personnelDB.checkCarrierPersonnelEmailExists(conn, req.email);
        if (exists) {
            throw new Error(`Email '${req.email}' is already in use. Please provide a unique email.`);
        }
    }

    const entityId = await entityDB.createEntity(conn, 'CARRIER_PERSONNEL', req.name);
    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

    if (req.note && req.note.messageText?.trim()) {
        await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
    }

    console.log(entityId, noteThreadId);


    const personnelId = await personnelDB.createCarrierPersonnel(conn, {
        ...req,
        noteThreadId,
        entityId,
        createdBy: userId
    });

    console.info(`Created Carrier Personnel with ID ${personnelId} linked to Entity ${entityId} and Note Thread ${noteThreadId}`);

    const personnel = await personnelDB.getCarrierPersonnelById(conn, personnelId);
    if (!personnel) throw new Error('Failed to create personnel');

    const notes = personnel.noteThreadId
        ? await noteDB.getMessagesByThread(conn, personnel.noteThreadId)
        : [];

    return { ...personnel, notes };
}


/**
 * Get personnel by ID
 */
export async function getCarrierPersonnelByIdService(
    conn: Connection,
    personnelId: number
): Promise<CarrierPersonnelResponse | null> {

    const personnel = await personnelDB.getCarrierPersonnelById(conn, personnelId);
    if (!personnel) return null;

    // Fetch notes via Note Thread
    const notes = personnel.noteThreadId
        ? await noteDB.getMessagesByThread(conn, personnel.noteThreadId)
        : [];

    return {
        ...personnel,
        notes
    };
}

/**
 * Get all personnel for a terminal
 */
export async function getCarrierPersonnelByTerminalService(
    conn: Connection,
    terminalId: number,
    page: number,
    pageSize: number,
    searchTerm?: string | null
): Promise<{ data: CarrierPersonnelResponse[]; pagination: { total: number; page: number; pageSize: number } }> {
    // Fetch paginated personnel
    const personnelList = await personnelDB.getPersonnelByTerminal(conn, terminalId, searchTerm ?? null, page, pageSize);

    // Enrich each personnel with notes
    const enriched = await Promise.all(
        personnelList.map(async (person) => {
            const notes = person.noteThreadId
                ? await noteDB.getMessagesByThread(conn, person.noteThreadId)
                : [];
            return {
                ...person,
                notes
            };
        })
    );

    // Count total for pagination metadata
    const total = await personnelDB.countPersonnelByTerminal(conn, terminalId, searchTerm ?? null);

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
export async function updateCarrierPersonnelService(
    conn: Connection,
    personnelId: number,
    updates: UpdateCarrierPersonnelRequest,
    userId: number
): Promise<CarrierPersonnelResponse> {
    await personnelDB.updateCarrierPersonnel(conn, personnelId, updates, userId);

    const personnel = await personnelDB.getCarrierPersonnelById(conn, personnelId);
    if (!personnel) throw new Error('Personnel not found after update');

    const notes = personnel.noteThreadId
        ? await noteDB.getMessagesByThread(conn, personnel.noteThreadId)
        : [];

    return {
        ...personnel,
        notes
    };
}

/**
 * Soft delete personnel
 */
export async function deleteCarrierPersonnelService(
    conn: Connection,
    personnelId: number,
    userId: number
): Promise<void> {
    await personnelDB.softDeleteCarrierPersonnel(conn, personnelId, userId);
}
