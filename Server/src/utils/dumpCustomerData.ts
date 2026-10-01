import "../config/env";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Connection } from "odbc";
import { AddressRequest, CreateCustomerRequest, CreateDepartmentRequest, CreateStationRequest } from "../entities/maintenance";
import { db } from "../config/db2";
import * as addressDB from "../database/maintenance/address";
import * as customerDB from "../database/maintenance/customer";
import * as departmentDB from "../database/maintenance/department";
import * as entityDB from "../database/maintenance/entity";
import * as noteDB from "../database/maintenance/note";
import * as stationDB from "../database/maintenance/station";

interface CustomerSourceRecord extends Omit<CreateCustomerRequest, "addresses"> {
    addresses: AddressRequest[];
    stations: StationSourceRecord[];
}

interface StationSourceRecord extends Omit<CreateStationRequest, "customerId" | "addresses" | "note"> {
    addresses: AddressRequest[];
    note?: { messageText: string };
    departments: DepartmentSourceRecord[];
}

interface DepartmentSourceRecord extends Omit<CreateDepartmentRequest, "stationId" | "note"> {
    note?: { messageText: string };
}

const sourcePath = resolve(process.argv[2] || resolve(__dirname, "../source/customer.json"));
let adminId = 1;
const configuredAdminId = process.argv[3] || process.env.CUSTOMER_IMPORT_ADMIN_ID;
if (configuredAdminId) {
    adminId = Number(configuredAdminId);
}

function readCustomerSource(): CustomerSourceRecord[] {
    if (!existsSync(sourcePath)) {
        throw new Error(`Customer source file not found: ${sourcePath}`);
    }

    const source = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    if (!Array.isArray(source)) {
        throw new Error("Customer source must contain an array of customer records");
    }

    return source as CustomerSourceRecord[];
}

function required(value: unknown): boolean {
    return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function validateAddress(address: AddressRequest, location: string): string[] {
    const errors: string[] = [];
    for (const field of ["line1", "city", "state", "zipCode", "addressRole"] as const) {
        if (!required(address?.[field])) {
            errors.push(`${location}.${field} is required`);
        }
    }
    if (required(address?.addressRole) && !["Corporate", "Billing", "Primary"].includes(address.addressRole)) {
        errors.push(`${location}.addressRole must be Corporate, Billing, or Primary`);
    }
    return errors;
}

function validateCustomers(customers: CustomerSourceRecord[]): string[] {
    const errors: string[] = [];

    customers.forEach((customer, customerIndex) => {
        const customerLabel = `Customer ${customerIndex + 1}${customer?.customerName ? ` (${customer.customerName})` : ""}`;
        for (const field of ["customerName", "rmAccountNumber", "corporateBillingSame"] as const) {
            if (!required(customer?.[field])) {
                errors.push(`${customerLabel}.${field} is required`);
            }
        }

        if (!Array.isArray(customer?.addresses) || customer.addresses.length === 0) {
            errors.push(`${customerLabel}.addresses must contain at least one address`);
        } else {
            customer.addresses.forEach((address, addressIndex) => {
                errors.push(...validateAddress(address, `${customerLabel}.addresses[${addressIndex}]`));
            });
        }

        if (!Array.isArray(customer?.stations) || customer.stations.length === 0) {
            errors.push(`${customerLabel}.stations must contain at least one station`);
            return;
        }

        customer.stations.forEach((station, stationIndex) => {
            const stationLabel = `${customerLabel}.stations[${stationIndex}]`;
            for (const field of ["stationName", "rmAccountNumber", "airportCode"] as const) {
                if (!required(station?.[field])) {
                    errors.push(`${stationLabel}.${field} is required`);
                }
            }
            if (!Array.isArray(station?.addresses) || station.addresses.length === 0) {
                errors.push(`${stationLabel}.addresses must contain at least one address`);
            } else {
                station.addresses.forEach((address, addressIndex) => {
                    errors.push(...validateAddress(address, `${stationLabel}.addresses[${addressIndex}]`));
                });
            }
            if (!Array.isArray(station?.departments) || station.departments.length === 0) {
                errors.push(`${stationLabel}.departments must contain at least one department`);
            } else {
                station.departments.forEach((department, departmentIndex) => {
                    const departmentLabel = `${stationLabel}.departments[${departmentIndex}]`;
                    for (const field of ["departmentName", "phoneNumber", "email"] as const) {
                        if (!required(department?.[field])) {
                            errors.push(`${departmentLabel}.${field} is required`);
                        }
                    }
                });
            }
        });
    });

    return errors;
}

async function createAddressRecords(conn: Connection, entityId: number, addresses: AddressRequest[]): Promise<void> {
    for (const address of addresses) {
        const addressId = await addressDB.createAddress(
            conn,
            address.line1,
            address.line2 || null,
            address.city,
            address.state,
            address.zipCode,
            adminId
        );
        if (!addressId) {
            throw new Error(`Address insert failed for entity ${entityId}`);
        }
        await addressDB.createEntityAddressMap(conn, entityId, addressId, address.addressRole);
    }
}

async function createCustomerAggregate(conn: Connection, source: CustomerSourceRecord): Promise<{ stations: number; departments: number }> {
    const customerName = source.customerName.trim().toUpperCase();
    try {
        if (await customerDB.checkCustomerUniqueFields(conn, { customerName })) {
            throw new Error(`Customer "${customerName}" already exists`);
        }
        if (await customerDB.getCustomerByRmAccountNumber(conn, source.rmAccountNumber)) {
            throw new Error(`Customer RM account number "${source.rmAccountNumber}" already exists`);
        }

        const entityId = await entityDB.createEntity(conn, "CUSTOMER", customerName);
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, adminId);
        const customerId = await customerDB.createCustomer(conn, {
            ...source,
            customerName,
            activeStatus: "Y",
            createdBy: adminId,
            entityId,
            noteThreadId
        });
        if (!customerId) {
            throw new Error(`Customer insert failed for "${customerName}"`);
        }
        await createAddressRecords(conn, entityId, source.addresses);

        let departmentCount = 0;
        for (const stationSource of source.stations) {
            const stationName = stationSource.stationName.trim().toUpperCase();
            if (await stationDB.getStationByCustomerAndName(conn, customerId, stationName)) {
                throw new Error(`Station "${stationName}" already exists for customer "${customerName}"`);
            }
            if (await stationDB.getStationByRmAccountNumber(conn, stationSource.rmAccountNumber)) {
                throw new Error(`Station RM account number "${stationSource.rmAccountNumber}" already exists`);
            }

            const stationEntityId = await entityDB.createEntity(conn, "STATION", stationName);
            const stationNoteThreadId = await noteDB.createNoteThread(conn, stationEntityId, adminId);
            if (stationSource.note?.messageText?.trim()) {
                await noteDB.createNoteMessage(conn, stationNoteThreadId, stationSource.note.messageText.trim(), adminId);
            }
            const stationId = await stationDB.createStation(conn, {
                ...stationSource,
                customerId,
                entityId: stationEntityId,
                stationName,
                openTime: stationSource.openTime || null,
                closeTime: stationSource.closeTime || null,
                warehouseEmails: stationSource.warehouseEmails ? JSON.stringify(stationSource.warehouseEmails) : null,
                noteThreadId: stationNoteThreadId,
                activeStatus: "Y",
                createdBy: adminId
            });
            if (!stationId) {
                throw new Error(`Station insert failed for "${stationName}"`);
            }
            await createAddressRecords(conn, stationEntityId, stationSource.addresses);

            for (const departmentSource of stationSource.departments) {
                const departmentName = departmentSource.departmentName.trim().toUpperCase();
                if (await departmentDB.getDepartmentByStationAndName(conn, stationId, departmentName)) {
                    throw new Error(`Department "${departmentName}" already exists for station "${stationName}"`);
                }

                const departmentEntityId = await entityDB.createEntity(conn, "DEPARTMENT", departmentName);
                const departmentNoteThreadId = await noteDB.createNoteThread(conn, departmentEntityId, adminId);
                if (departmentSource.note?.messageText?.trim()) {
                    await noteDB.createNoteMessage(conn, departmentNoteThreadId, departmentSource.note.messageText.trim(), adminId);
                }
                const departmentId = await departmentDB.createDepartment(conn, {
                    ...departmentSource,
                    stationId,
                    departmentName,
                    entityId: departmentEntityId,
                    noteThreadId: departmentNoteThreadId,
                    activeStatus: "Y",
                    createdBy: adminId
                });
                if (!departmentId) {
                    throw new Error(`Department insert failed for "${departmentName}"`);
                }
                departmentCount += 1;
            }
        }

        return { stations: source.stations.length, departments: departmentCount };
    } catch (error) {
        console.error('[Customer import] Error while creating customer aggregate for:', customerName);
        console.error('[Customer import] Customer source snapshot:', JSON.stringify({
            customerName: source.customerName,
            rmAccountNumber: source.rmAccountNumber,
            stationCount: source.stations?.length ?? 0,
            departmentCount: source.stations?.reduce((total, station) => total + (station.departments?.length ?? 0), 0) ?? 0
        }, null, 2));
        console.error('[Customer import] Actual DB error:', error);
        throw error;
    }
}

export async function dumpCustomerData(): Promise<void> {
    if (!Number.isInteger(adminId) || adminId < 1) {
        throw new Error(`Invalid admin user ID: ${adminId}`);
    }

    const customers = readCustomerSource();
    const validationErrors = validateCustomers(customers);
    if (validationErrors.length > 0) {
        validationErrors.forEach((message) => console.error(`[Customer import] Validation error: ${message}`));
        throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
    }

    const conn = await db();
    let transactionStarted = false;
    let stationCount = 0;
    let departmentCount = 0;

    try {
        await conn.beginTransaction();
        transactionStarted = true;

        for (const [index, customer] of customers.entries()) {
            const counts = await createCustomerAggregate(conn, customer);
            stationCount += counts.stations;
            departmentCount += counts.departments;
            console.log(`[Customer import] ${index + 1}/${customers.length}: ${customer.customerName} (${counts.stations} stations, ${counts.departments} departments)`);
        }

        await conn.commit();
        console.log(`[Customer import] Complete: ${customers.length} customers, ${stationCount} stations, ${departmentCount} departments`);
    } catch (error) {
        if (transactionStarted) {
            await conn.rollback();
            console.error("[Customer import] Rolled back all customer data");
        }
        throw error;
    } finally {
        await conn.close();
    }
}

if (require.main === module) {
    dumpCustomerData().catch((error: unknown) => {
        console.error("[Customer import] Failed:", error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}