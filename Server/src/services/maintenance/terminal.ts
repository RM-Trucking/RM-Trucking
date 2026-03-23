import { Connection } from 'odbc';
import { CreateTerminalRequest, UpdateTerminalRequest, TerminalResponse } from '../../entities/maintenance/Terminal';
import * as terminalDB from '../../database/maintenance/terminal';
import * as entityDB from '../../database/maintenance/entity';
import * as noteDB from '../../database/maintenance/note';
import * as addressDB from '../../database/maintenance/address';

export async function createTerminal(
    conn: Connection,
    createTerminalReq: CreateTerminalRequest,
    adminId: number
): Promise<{ terminal: TerminalResponse }> {
    const {
        carrierId,
        terminalName,
        rmAccountNumber,
        airportCode,
        email,
        phoneNumber,
        faxNumber,
        openTime,
        closeTime,
        hours,
        addresses,
        note
    } = createTerminalReq;

    // 1) Uniqueness check for all fields
    const conflict = await terminalDB.checkTerminalUniqueFields(conn, {
        email,
        faxNumber,
        phoneNumber,
        rmAccountNumber
    });
    if (conflict) {
        throw new Error(`${conflict} already exists. Please use a unique value.`);
    }

    // 2) Begin transaction
    await conn.beginTransaction();
    try {
        // Create Entity
        const entityId = await entityDB.createEntity(conn, 'TERMINAL', terminalName);

        // Create Note Thread
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, adminId);
        if (note && note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, note.messageText.trim(), adminId);
        }

        // Create Terminal
        const terminalId = await terminalDB.createTerminal(conn, {
            carrierId,
            entityId,
            terminalName,
            rmAccountNumber,
            airportCode,
            email,
            phoneNumber,
            faxNumber,
            openTime: openTime === "" ? null : openTime,
            closeTime: closeTime === "" ? null : closeTime,
            hours,
            createdBy: adminId,
            noteThreadId,
            activeStatus: 'Y'
        });

        // Create Addresses + Map
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

        // Fetch final terminal row
        const terminal = await terminalDB.getTerminalById(conn, terminalId);
        if (!terminal) throw new Error('Failed to create terminal');

        // Commit transaction
        await conn.commit();

        return {
            terminal: {
                ...terminal,
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
        // Rollback on any error
        await conn.rollback();
        throw err;
    }
}


export async function getTerminalById(conn: Connection, terminalId: number): Promise<TerminalResponse | null> {
    const terminal = await terminalDB.getTerminalById(conn, terminalId);
    if (!terminal) return null;

    const addresses = await addressDB.getAddressesForEntity(conn, terminal.entityId);
    const notes = terminal.noteThreadId
        ? await noteDB.getMessagesByThread(conn, terminal.noteThreadId)
        : [];

    return { ...terminal, addresses, notes };
}

export async function getTerminalsForCarrier(
    conn: Connection,
    carrierId: number,
    page: number,
    limit: number
): Promise<{ terminals: TerminalResponse[]; total: number }> {
    const offset = (page - 1) * limit;

    // Use the new count function
    const total = await terminalDB.countTerminalsForCarrier(conn, carrierId);

    // Get paginated terminals
    const terminals = await terminalDB.getTerminalsForCarrier(conn, carrierId, limit, offset);

    // Enrich with addresses + notes
    const enriched = await Promise.all(
        terminals.map(async (t: TerminalResponse) => {
            const addresses = await addressDB.getAddressesForEntity(conn, t.entityId);
            const notes = t.noteThreadId
                ? await noteDB.getMessagesByThread(conn, t.noteThreadId)
                : [];
            return { ...t, addresses, notes };
        })
    );

    return { terminals: enriched, total };
}



export async function updateTerminalService(
    conn: Connection,
    terminalId: number,
    updates: UpdateTerminalRequest,
    userId: number
): Promise<TerminalResponse> {
    const existing = await terminalDB.getTerminalById(conn, terminalId);
    if (!existing) throw new Error('Terminal not found');

    // Start transaction
    await conn.beginTransaction();

    try {
        const {
            terminalName,
            rmAccountNumber,
            airportCode,
            email,
            phoneNumber,
            faxNumber,
            openTime,
            closeTime,
            hours
        } = updates;

        // Check uniqueness before update
        const conflict = await terminalDB.checkTerminalUniqueFields(conn, {
            email,
            faxNumber,
            phoneNumber,
            rmAccountNumber
        }, terminalId);

        if (conflict) {
            throw new Error(`${conflict} already exists. Please use a unique value.`);
        }


        // Update terminal
        await terminalDB.updateTerminal(conn, terminalId, {
            terminalName,
            rmAccountNumber,
            airportCode,
            email,
            phoneNumber,
            faxNumber,
            openTime: openTime === "" ? null : openTime,
            closeTime: closeTime === "" ? null : closeTime,
            hours,
            updatedBy: userId
        });

        // Update addresses
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

        // Commit transaction if everything succeeds
        await conn.commit();

        // Fetch updated terminal row
        const updated = await terminalDB.getTerminalById(conn, terminalId);
        if (!updated) throw new Error('Failed to update terminal');

        const addresses = await addressDB.getAddressesForEntity(conn, updated.entityId);
        const notes = updated.noteThreadId
            ? await noteDB.getMessagesByThread(conn, updated.noteThreadId)
            : [];

        return { ...updated, addresses, notes };
    } catch (error) {
        // Rollback on any error
        await conn.rollback();
        throw error;
    }
}


export async function deleteTerminal(conn: Connection, terminalId: number, adminId: number): Promise<void> {
    await terminalDB.softDeleteTerminal(conn, terminalId, adminId);
}
