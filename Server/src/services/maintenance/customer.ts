import { Connection } from 'odbc';
import { CreateCustomerRequest, UpdateCustomerRequest, CustomerResponse } from '../../entities/maintenance';
import * as customerDB from '../../database/maintenance/customer';
import * as entityDB from '../../database/maintenance/entity';
import * as addressDB from '../../database/maintenance/address';
import * as noteDB from '../../database/maintenance/note';


/**
 * Create a new customer (transactional)
 * Flow:
 * 1) Create Entity
 * 2) Create Note Thread (for that Entity)
 * 3) Create Customer (with noteThreadId)
 * 4) Create Addresses in parallel and map them to the Entity
 * If any step fails, rollback the transaction.
 */
export async function createNewCustomer(
    conn: Connection,
    createCustomerReq: CreateCustomerRequest,
    adminId: number
): Promise<{ customer: CustomerResponse }> {
    const { customerName, rmAccountNumber, phoneNumber, website, corporateBillingSame, addresses, note } = createCustomerReq;

    // Uniqueness check before starting transaction
    const existingCustomer = await customerDB.getCustomerByRmAccountNumber(conn, rmAccountNumber);
    if (existingCustomer) {
        throw new Error('RM account number already exists');
    }

    await conn.beginTransaction();
    try {

        // 1) Create Entity
        const entityId = await entityDB.createEntity(conn, 'CUSTOMER', customerName);
        console.log("entityId", entityId);

        // 2) Create Note Thread
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, adminId);
        console.log("noteThreadId", noteThreadId);

        // If initial note is provided, create the first message
        if (note && note.messageText?.trim()) {
            await noteDB.createNoteMessage(conn, noteThreadId, note.messageText.trim(), adminId);
        }

        // 3) Create Customer (pass values as object now)
        const customerId = await customerDB.createCustomer(conn, {
            customerName,
            rmAccountNumber,
            phoneNumber,
            website,
            corporateBillingSame,
            activeStatus: 'Y',
            createdBy: adminId,
            entityId,
            noteThreadId
        });

        // 4) Create Addresses in parallel and map them
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

        // Fetch the final customer row
        const customer = await customerDB.getCustomerById(conn, customerId);
        if (!customer) throw new Error('Failed to create customer');

        await conn.commit();

        return {
            customer: {
                ...customer,
                addresses: addressResults,
                notes: note && note.messageText?.trim()
                    ? [{
                        noteMessageId: 0, // placeholder; use GET thread to retrieve real IDs
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


export async function getAllCustomersService(
    conn: Connection,
    searchTerm: string | null,
    page: number,
    pageSize: number
): Promise<{ customers: CustomerResponse[]; total: number; page: number; pageSize: number }> {
    const customers = await customerDB.getAllCustomers(conn, searchTerm, page, pageSize);
    const total = await customerDB.countCustomers(conn, searchTerm);

    // For each customer, fetch addresses + notes
    const enriched = await Promise.all(
        customers.map(async (cust) => {
            const addresses = await addressDB.getAddressesForEntity(conn, cust.entityId);
            const notes = cust.noteThreadId
                ? await noteDB.getMessagesByThread(conn, cust.noteThreadId)
                : [];
            return { ...cust, addresses, notes };
        })
    );

    return {
        customers: enriched,
        total,
        page,
        pageSize
    };
}


/**
 * Get customer by ID
 */
export async function getCustomerDetails(conn: Connection, customerId: number): Promise<CustomerResponse> {
    const customer = await customerDB.getCustomerById(conn, customerId);
    if (!customer) {
        throw new Error('Customer not found');
    }

    const addresses = await addressDB.getAddressesForEntity(conn, customer.entityId);
    const notes = customer.noteThreadId
        ? await noteDB.getMessagesByThread(conn, customer.noteThreadId)
        : [];

    return {
        ...customer,
        addresses,
        notes
    };
}


export async function updateCustomer(
    conn: Connection,
    customerId: number,
    updateReq: UpdateCustomerRequest,
    adminId: number
): Promise<CustomerResponse> {
    const customer = await customerDB.getCustomerById(conn, customerId);
    if (!customer) throw new Error('Customer not found');

    // 1. Update scalar fields
    await customerDB.updateCustomer(conn, customerId, {
        customerName: updateReq.customerName,
        rmAccountNumber: updateReq.rmAccountNumber,
        phoneNumber: updateReq.phoneNumber,
        website: updateReq.website,
        activeStatusReason: updateReq.activeStatusReason,
        corporateBillingSame: updateReq.corporateBillingSame,
        updatedBy: adminId
    });

    // 2. Update addresses
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

    // 3. Reload updated customer
    const updatedCustomer = await customerDB.getCustomerById(conn, customerId);
    if (!updatedCustomer) throw new Error('Failed to update customer');

    const addresses = await addressDB.getAddressesForEntity(conn, updatedCustomer.entityId);
    const notes = updatedCustomer.noteThreadId
        ? await noteDB.getMessagesByThread(conn, updatedCustomer.noteThreadId)
        : [];

    return { ...updatedCustomer, addresses, notes };
}


/**
 * Delete customer
 */
export async function deleteCustomer(conn: Connection, customerId: number): Promise<boolean> {
    const customer = await customerDB.getCustomerById(conn, customerId);
    if (!customer) {
        throw new Error('Customer not found');
    }

    await customerDB.softDeleteCustomer(conn, customerId);
    return true;
}
