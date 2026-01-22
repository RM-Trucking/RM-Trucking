import { Connection } from 'odbc';
import * as accessorialDB from '../../database/maintenance/accessorial';
import {
    AccessorialResponse,
    CreateAccessorialRequest
} from '../../entities/maintenance/Accessorial';

/**
 * Create a new accessorial
 */
export async function createAccessorialService(
    conn: Connection,
    req: CreateAccessorialRequest,
    userId: number
): Promise<AccessorialResponse> {
    const accessorialId = await accessorialDB.createAccessorial(conn, req, userId);

    // Fetch the newly created record
    const all = await accessorialDB.getAllAccessorials(conn);
    const created = all.find(a => a.accessorialId === accessorialId);
    if (!created) throw new Error('Failed to create accessorial');

    return created;
}

/**
 * Get all accessorials (for dropdown)
 */
export async function getAllAccessorialsService(
    conn: Connection
): Promise<AccessorialResponse[]> {
    return await accessorialDB.getAllAccessorials(conn);
}

/**
 * Update an accessorial
 */
export async function updateAccessorialService(
    conn: Connection,
    accessorialId: number,
    accessorialName: string,
    userId: number
): Promise<AccessorialResponse> {
    await accessorialDB.updateAccessorial(conn, accessorialId, accessorialName, userId);

    const updated = await accessorialDB.getAccessorialById(conn, accessorialId);
    if (!updated) throw new Error('Failed to update accessorial');
    return updated;
}

/**
 * Soft delete an accessorial
 */
export async function softDeleteAccessorialService(
    conn: Connection,
    accessorialId: number,
    userId: number
): Promise<void> {
    await accessorialDB.softDeleteAccessorial(conn, accessorialId, userId);
}
