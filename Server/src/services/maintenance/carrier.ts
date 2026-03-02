// carrierService.ts

import { Connection } from "odbc";
import * as carrierDB from "../../database/maintenance/carrier";
import * as entityDB from "../../database/maintenance/entity";
import * as noteDB from "../../database/maintenance/note";
import * as addressDB from "../../database/maintenance/address";
import { CreateCarrierRequest, UpdateCarrierRequest, CarrierResponse } from "../../entities/maintenance/Carrier";


export async function createNewCarrier(
    conn: Connection,
    createCarrierReq: CreateCarrierRequest,
    adminId: number
): Promise<{ carrier: CarrierResponse }> {
    const {
        carrierName, carrierType, carrierStatus,
        tsaCertified, ustDotNo, mcnNo, insuranceExpiry,
        tariffRenewalDate, salesRepName, salesRepPhone, salesRepEmail,
        addresses, note
    } = createCarrierReq;

    await conn.beginTransaction();
    try {
        // 1) Create Entity
        const entityId = await entityDB.createEntity(conn, "CARRIER", carrierName);

        // 2) Create Note Thread
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, adminId);

        if (note && note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, note.messageText.trim(), adminId);
        }

        // 3) Insert Carrier
        const carrierId = await carrierDB.createCarrier(conn, {
            carrierName,
            carrierType,
            carrierStatus,
            tsaCertified,
            ustDotNo,
            mcnNo,
            insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
            tariffRenewalDate: tariffRenewalDate ? new Date(tariffRenewalDate) : undefined,
            salesRepName,
            salesRepPhone,
            salesRepEmail,
            totalShipments: 0,
            rmOnTimePercent: 0,
            lateShipments: 0,
            createdBy: adminId,
            entityId,
            noteThreadId
        });

        // 4) Insert addresses
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

        // 5) Fetch final carrier row
        const carrier = await carrierDB.getCarrierById(conn, carrierId);
        if (!carrier) throw new Error("Failed to create carrier");

        await conn.commit();

        return {
            carrier: {
                ...carrier,
                addresses: addressResults,
                notes: note && note.messageText?.trim()
                    ? [{
                        noteMessageId: 0, // placeholder
                        noteThreadId,
                        messageText: note.messageText.trim(),
                        createdAt: new Date(),
                        createdBy: adminId,
                        createdByName: "" // placeholder
                    }]
                    : []
            }
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


// UPDATE
export async function updateCarrierService(
    conn: Connection,
    updateReq: UpdateCarrierRequest,
    adminId: number
): Promise<CarrierResponse> {
    await conn.beginTransaction();
    try {
        await carrierDB.updateCarrier(conn, updateReq.carrierId, {
            ...updateReq,
            insuranceExpiry: updateReq.insuranceExpiry ? new Date(updateReq.insuranceExpiry) : undefined,
            tariffRenewalDate: updateReq.tariffRenewalDate ? new Date(updateReq.tariffRenewalDate) : undefined,
            updatedBy: adminId
        });

        // update addresses if provided
        if (updateReq.addresses) {
            for (const addr of updateReq.addresses) {
                await addressDB.updateAddress(
                    conn,
                    addr.addressId,
                    addr.line1 ?? '',
                    addr.line2 ?? null,
                    addr.city ?? '',
                    addr.state ?? '',
                    addr.zipCode ?? '',
                    adminId,
                    addr.addressRole ?? ''
                );
            }
        }

        const carrier = await carrierDB.getCarrierById(conn, updateReq.carrierId);
        if (!carrier) throw new Error("Carrier not found");

        const addresses = await addressDB.getAddressesForEntity(conn, carrier.entityId);
        const notes = carrier.noteThreadId != null
            ? await noteDB.getMessagesByThread(conn, carrier.noteThreadId)
            : [];

        await conn.commit();
        return { ...carrier, addresses, notes };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}

// GET ALL
export async function listCarriersService(
    conn: Connection,
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string
): Promise<{ data: CarrierResponse[]; total: number; page: number; pageSize: number }> {
    const offset = (page - 1) * pageSize;
    const carriers = await carrierDB.listCarriers(conn, pageSize, offset, searchTerm);
    const total = await carrierDB.countCarriers(conn, searchTerm);

    // enrich with addresses + notes
    const responses: CarrierResponse[] = [];
    for (const c of carriers) {
        const addresses = await addressDB.getAddressesForEntity(conn, c.entityId);
        const notes = c.noteThreadId != null
            ? await noteDB.getMessagesByThread(conn, c.noteThreadId)
            : [];
        responses.push({ ...c, addresses, notes });
    }

    return { data: responses, total, page, pageSize };
}

// GET BY ID
export async function getCarrierByIdService(conn: Connection, carrierId: number): Promise<CarrierResponse | null> {
    const carrier = await carrierDB.getCarrierById(conn, carrierId);
    if (!carrier) return null;

    const addresses = await addressDB.getAddressesForEntity(conn, carrier.entityId);
    const notes = carrier.noteThreadId != null
        ? await noteDB.getMessagesByThread(conn, carrier.noteThreadId)
        : [];

    return { ...carrier, addresses, notes };
}

// DROPDOWN (minimal list)
export async function listCarrierDropdownService(conn: Connection): Promise<{ carrierId: number; carrierName: string }[]> {
    const queryResult = await carrierDB.listCarriers(conn, 1000, 0); // limit arbitrarily high
    return queryResult.map(c => ({ carrierId: c.carrierId, carrierName: c.carrierName }));
}

// MAKE ACTIVE / INACTIVE
export async function toggleCarrierStatusService(
    conn: Connection,
    carrierId: number,
    status: 'Active' | 'Inactive' | 'Incomplete',
    adminId: number
): Promise<void> {
    await carrierDB.updateCarrier(conn, carrierId, {
        carrierStatus: status,
        updatedBy: adminId
    });
}
