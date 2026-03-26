import { Connection } from 'odbc';
import * as accessorialDB from '../../database/maintenance/accessorial';
import {
    Accessorial,
    AccessorialResponse,
    CreateAccessorialRequest
} from '../../entities/maintenance/Accessorial';
import { toUtcDate } from '../../utils/dateFormater';

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
    const created = await accessorialDB.getAccessorialById(conn, accessorialId);
    if (!created) throw new Error('Failed to create accessorial');

    return {
        ...created,
        createdAt: created.createdAt ? toUtcDate(created.createdAt) : null,
        updatedAt: created.updatedAt ? toUtcDate(created.updatedAt) : null
    };
}

/**
 * Get all accessorials (for dropdown)
 */
export async function getAllAccessorialsService(
    conn: Connection,
    searchTerm: string | null,
    page: number,
    pageSize: number
): Promise<{ accessorials: AccessorialResponse[]; total: number; page: number; pageSize: number }> {
    // Fetch paginated accessorials
    const accessorials = await accessorialDB.getAllAccessorials(conn, searchTerm, page, pageSize);

    const formattedAccessorials = accessorials.map(created => ({
        ...created,
        createdAt: created.createdAt ? toUtcDate(created.createdAt) : null,
        updatedAt: created.updatedAt ? toUtcDate(created.updatedAt) : null
    }));

    // Count total for pagination metadata
    const total = await accessorialDB.countAccessorials(conn, searchTerm);

    return {
        accessorials: formattedAccessorials,
        total,
        page,
        pageSize
    };
}



export async function getAccessorialDropdownService(conn: Connection) {
    return await accessorialDB.getAccessorialDropdown(conn);
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

    return {
        ...updated,
        createdAt: updated.createdAt ? toUtcDate(updated.createdAt) : null,
        updatedAt: updated.updatedAt ? toUtcDate(updated.updatedAt) : null
    };
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
