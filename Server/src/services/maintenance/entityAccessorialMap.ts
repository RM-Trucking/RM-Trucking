import { Connection } from 'odbc';
import * as entityAccessorialMapDB from '../../database/maintenance/entityAccessorialMap';
import {
    CreateEntityAccessorialMapRequest,
    EntityAccessorialMapResponse,
    UpdateEntityAccessorialMapRequest
} from '../../entities/maintenance/EntityAccessorialMap';
import * as noteDB from '../../database/maintenance/note';
import * as entityDB from '../../database/maintenance/entity';
import * as accessorialDB from '../../database/maintenance/accessorial';

/**
 * Create a new entity-accessorial mapping
 */
export async function createEntityAccessorialMapService(
    conn: Connection,
    req: CreateEntityAccessorialMapRequest,
    userId: number
): Promise<EntityAccessorialMapResponse> {

    const accessorial = await accessorialDB.getAccessorialById(conn, req.accessorialId);
    if (!accessorial) {
        throw new Error('Accessorial not found');
    }

    const entityId = await entityDB.createEntity(conn, 'ACCESSORIAL', accessorial.accessorialName);

    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);
    if (req.note && req.note.messageText?.trim()) {
        await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
    }

    const id = await entityAccessorialMapDB.createEntityAccessorialMap(
        conn,
        req.entityId,
        req.accessorialId,
        req.chargeType,
        req.chargeValue,
        noteThreadId
    );

    // Fetch all mappings for this entity and return the newly created one
    const maps = await entityAccessorialMapDB.getAccessorialsForEntity(conn, req.entityId);
    const created = maps.find(m => m.entityAccessorialId === id);
    if (!created) throw new Error('Failed to create entity-accessorial mapping');

    return created;
}

/**
 * Get all accessorial mappings for a given entity
 */
export async function getAccessorialsForEntityService(
    conn: Connection,
    entityId: number
): Promise<EntityAccessorialMapResponse[]> {
    const accessorials = await entityAccessorialMapDB.getAccessorialsForEntity(conn, entityId);

    const enriched = await Promise.all(
        accessorials.map(async (acc) => {
            const notes = acc.noteThreadId
                ? await noteDB.getMessagesByThread(conn, acc.noteThreadId)
                : [];

            return {
                ...acc,
                notes
            };
        })
    );

    return enriched;
}

export async function updateEntityAccessorialMapService(
    conn: Connection,
    entityAccessorialId: number,
    req: UpdateEntityAccessorialMapRequest,
    userId: number
): Promise<EntityAccessorialMapResponse> {
    // Update the mapping record
    if (!req.chargeType) {
        throw new Error('chargeType is required');
    }
    if (typeof req.chargeValue !== 'number') {
        throw new Error('chargeValue is required');
    }
    await entityAccessorialMapDB.updateEntityAccessorialMap(
        conn,
        entityAccessorialId,
        req.chargeType,
        req.chargeValue
    );

    // If note provided, append to existing thread
    if (req.note && req.note.messageText?.trim()) {
        // First fetch mapping to get noteThreadId
        const map = await entityAccessorialMapDB.getAccessorialById(conn, entityAccessorialId);
        if (!map || !map.noteThreadId) throw new Error('Note thread not found for mapping');

        await noteDB.createNoteMessage(conn, map.noteThreadId, req.note.messageText.trim(), userId);
    }

    // Return updated mapping
    const map = await entityAccessorialMapDB.getAccessorialById(conn, entityAccessorialId);
    const entityId = req.entityId ?? (map ? map.entityId : undefined);
    if (!entityId) throw new Error('Entity ID not found for mapping');
    const updatedMaps = await entityAccessorialMapDB.getAccessorialsForEntity(conn, entityId);
    const updated = updatedMaps.find(m => m.entityAccessorialId === entityAccessorialId);
    if (!updated) throw new Error('Failed to fetch updated mapping');

    return updated;
}


/**
 * Delete an entity-accessorial mapping
 */
export async function deleteEntityAccessorialMapService(
    conn: Connection,
    entityAccessorialId: number
): Promise<void> {
    await entityAccessorialMapDB.deleteEntityAccessorialMap(conn, entityAccessorialId);
}
