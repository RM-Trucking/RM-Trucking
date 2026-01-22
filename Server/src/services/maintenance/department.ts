import { Connection } from 'odbc';
import {
    CreateDepartmentRequest,
    UpdateDepartmentRequest,
    DepartmentResponse
} from '../../entities/maintenance';
import * as departmentDB from '../../database/maintenance/department';
import * as noteDB from '../../database/maintenance/note';
import * as entityDB from '../../database/maintenance/entity';

/**
 * Create a new department
 */
export async function createDepartmentService(
    conn: Connection,
    req: CreateDepartmentRequest,
    userId: number
): Promise<DepartmentResponse | any> {
    await conn.beginTransaction();
    try {
        // ✅ Validate unique email
        if (req.email) {
            const exists = await departmentDB.checkDepartmentEmailExists(conn, req.email);
            if (exists) {
                throw new Error(`Email '${req.email}' is already in use. Please provide a unique email.`);
            }
        }

        const entityId = await entityDB.createEntity(conn, 'DEPARTMENT', req.departmentName);
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

        if (req.note && req.note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, req.note.messageText.trim(), userId);
        }

        const departmentId = await departmentDB.createDepartment(conn, {
            ...req,
            noteThreadId,
            entityId,
            createdBy: userId,
            activeStatus: 'Y'
        });

        const department = await departmentDB.getDepartmentById(conn, departmentId);
        if (!department) throw new Error('Failed to create department');

        await conn.commit();
        return department;
    } catch (error) {
        await conn.rollback();
        throw error;
    }
}


/**
 * Get a single department by ID
 */
export async function getDepartmentService(
    conn: Connection,
    departmentId: number
): Promise<DepartmentResponse | null> {

    const department = await departmentDB.getDepartmentById(conn, departmentId);
    if (!department) return null;

    // Fetch notes via Note Thread
    const notes = department.noteThreadId
        ? await noteDB.getMessagesByThread(conn, department.noteThreadId)
        : [];

    return {
        ...department,
        notes
    };
}

/**
 * Get all departments for a station
 */
export async function getDepartmentsForStationService(
    conn: Connection,
    stationId: number
): Promise<DepartmentResponse[]> {
    const departments = await departmentDB.getDepartmentsByStation(conn, stationId);

    // Enrich each department with notes
    const enriched = await Promise.all(
        departments.map(async (dept) => {
            const notes = dept.noteThreadId
                ? await noteDB.getMessagesByThread(conn, dept.noteThreadId)
                : [];

            return {
                ...dept,
                notes
            };
        })
    );

    return enriched;
}


/**
 * Update department details
 */
export async function updateDepartmentService(
    conn: Connection,
    departmentId: number,
    updates: UpdateDepartmentRequest,
    userId: number
): Promise<DepartmentResponse | any> {
    const existing = await departmentDB.getDepartmentById(conn, departmentId);
    if (!existing) throw new Error('Department not found');

    await departmentDB.updateDepartment(conn, departmentId, { ...updates, updatedBy: userId });

    const updated = await departmentDB.getDepartmentById(conn, departmentId);
    if (!updated) throw new Error('Failed to update department');

    return updated;
}

/**
 * Delete department (soft delete, using activeStatus)
 */
export async function deleteDepartmentService(conn: Connection, departmentId: number, userId: number): Promise<void> {
    const existing = await departmentDB.getDepartmentById(conn, departmentId);
    if (!existing) throw new Error('Department not found');

    await departmentDB.deleteDepartment(conn, departmentId, userId);
}
