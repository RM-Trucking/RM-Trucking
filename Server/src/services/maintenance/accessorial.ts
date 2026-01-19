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
