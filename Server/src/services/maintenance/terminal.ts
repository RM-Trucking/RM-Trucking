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

    // Uniqueness check
    const existingTerminal = await terminalDB.getTerminalByRmAccountNumber(conn, rmAccountNumber);
    if (existingTerminal) {
        throw new Error('RM account number already exists');
    }

    await conn.beginTransaction();
    try {
        // 1) Create Entity
        const entityId = await entityDB.createEntity(conn, 'TERMINAL', terminalName);

        // 2) Create Note Thread
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, adminId);
        if (note && note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, note.messageText.trim(), adminId);
        }

        // 3) Create Terminal
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

        // 4) Create Addresses + Map (at least one primary address required)
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

        // 5) Fetch final terminal row
        const terminal = await terminalDB.getTerminalById(conn, terminalId);
        if (!terminal) throw new Error('Failed to create terminal');

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

export async function getTerminalsForCarrier(conn: Connection, carrierId: number): Promise<TerminalResponse[]> {
    const terminals = await terminalDB.getTerminalsForCarrier(conn, carrierId);

    return Promise.all(
        terminals.map(async (t: TerminalResponse) => {
            const addresses = await addressDB.getAddressesForEntity(conn, t.entityId);
            const notes = t.noteThreadId
                ? await noteDB.getMessagesByThread(conn, t.noteThreadId)
                : [];
            return { ...t, addresses, notes };
        })
    );
}


export async function updateTerminalService(
    conn: Connection,
    terminalId: number,
    updates: UpdateTerminalRequest,
    userId: number
): Promise<TerminalResponse> {
    const existing = await terminalDB.getTerminalById(conn, terminalId);
    if (!existing) throw new Error('Terminal not found');

    // 1. Update only Terminal fields (exclude addresses)
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

    // 3. Fetch updated terminal row
    const updated = await terminalDB.getTerminalById(conn, terminalId);
    if (!updated) throw new Error('Failed to update terminal');

    // 4. Fetch addresses + notes
    const addresses = await addressDB.getAddressesForEntity(conn, updated.entityId);
    const notes = updated.noteThreadId
        ? await noteDB.getMessagesByThread(conn, updated.noteThreadId)
        : [];

    return { ...updated, addresses, notes };
}


export async function deleteTerminal(conn: Connection, terminalId: number, adminId: number): Promise<void> {
    await terminalDB.softDeleteTerminal(conn, terminalId, adminId);
}
