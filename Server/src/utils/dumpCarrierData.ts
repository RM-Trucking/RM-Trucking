import "../config/env";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Connection } from "odbc";
import { CreateCarrierRequest } from "../entities/maintenance/Carrier";
import { CreateTerminalRequest } from "../entities/maintenance/Terminal";
import { db } from "../config/db2";
import * as addressDB from "../database/maintenance/address";
import * as carrierDB from "../database/maintenance/carrier";
import * as entityDB from "../database/maintenance/entity";
import * as noteDB from "../database/maintenance/note";
import * as terminalDB from "../database/maintenance/terminal";

interface CarrierSourceRecord extends Omit<CreateCarrierRequest, "addresses"> {
    addresses: CreateCarrierRequest["addresses"];
    terminals: Array<Omit<CreateTerminalRequest, "carrierId">>;
}

const sourcePath = resolve(process.argv[2] || resolve(__dirname, "../source/carrier.json"));
let adminId = 1;
const configuredAdminId = process.argv[3] || process.env.CARRIER_IMPORT_ADMIN_ID;
if (configuredAdminId) {
    adminId = Number(configuredAdminId);
}

function readCarrierSource(): CarrierSourceRecord[] {
    if (!existsSync(sourcePath)) {
        throw new Error(`Carrier source file not found: ${sourcePath}`);
    }

    const source = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    if (!Array.isArray(source)) {
        throw new Error("Carrier source must contain an array of carrier records");
    }

    return source as CarrierSourceRecord[];
}

function normalizeCarrier(record: CarrierSourceRecord): CreateCarrierRequest {
    return {
        ...record,
        tsaCertified: record.tsaCertified || "N",
        corporateBillingSame: record.corporateBillingSame || "N",
        isParcelCarrier: record.isParcelCarrier || "N",
        isLTLCarrier: record.isLTLCarrier || "N",
        isAirportCarrier: record.isAirportCarrier || "N",
        addresses: record.addresses || []
    };
}

function required(value: unknown): boolean {
    return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function validateAddress(address: any, location: string): string[] {
    const errors: string[] = [];
    for (const field of ["line1", "city", "state", "zipCode", "addressRole"]) {
        if (!required(address?.[field])) {
            errors.push(`${location}.${field} is required`);
        }
    }
    if (required(address?.addressRole) && !["Corporate", "Billing", "Primary"].includes(address.addressRole)) {
        errors.push(`${location}.addressRole must be Corporate, Billing, or Primary`);
    }
    return errors;
}

function validateCarriers(carriers: CarrierSourceRecord[]): string[] {
    const errors: string[] = [];

    carriers.forEach((carrier, carrierIndex) => {
        const carrierLabel = `Carrier ${carrierIndex + 1}${carrier?.carrierName ? ` (${carrier.carrierName})` : ""}`;
        for (const field of ["carrierName", "carrierType", "carrierStatus", "corporateBillingSame"]) {
            if (!required(carrier?.[field as keyof CarrierSourceRecord])) {
                errors.push(`${carrierLabel}.${field} is required`);
            }
        }

        if (!Array.isArray(carrier?.addresses) || carrier.addresses.length === 0) {
            errors.push(`${carrierLabel}.addresses must contain at least one address`);
        } else {
            carrier.addresses.forEach((address, addressIndex) => {
                errors.push(...validateAddress(address, `${carrierLabel}.addresses[${addressIndex}]`));
            });
        }

        if (!Array.isArray(carrier?.terminals) || carrier.terminals.length === 0) {
            errors.push(`${carrierLabel}.terminals must contain at least one terminal`);
            return;
        }

        carrier.terminals.forEach((terminal, terminalIndex) => {
            const terminalLabel = `${carrierLabel}.terminals[${terminalIndex}]`;
            for (const field of ["terminalName", "rmAccountNumber", "airportCode"]) {
                if (!required(terminal?.[field as keyof Omit<CreateTerminalRequest, "carrierId">])) {
                    errors.push(`${terminalLabel}.${field} is required`);
                }
            }
            if (!Array.isArray(terminal?.addresses) || terminal.addresses.length === 0) {
                errors.push(`${terminalLabel}.addresses must contain at least one address`);
            } else {
                terminal.addresses.forEach((address, addressIndex) => {
                    errors.push(...validateAddress(address, `${terminalLabel}.addresses[${addressIndex}]`));
                });
            }
        });
    });

    return errors;
}

async function createAddressRecords(
    conn: Connection,
    entityId: number,
    addresses: CreateCarrierRequest["addresses"] | CreateTerminalRequest["addresses"]
): Promise<void> {
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

async function createCarrierAggregate(conn: Connection, source: CarrierSourceRecord): Promise<number> {
    const carrier = normalizeCarrier(source);
    const carrierName = carrier.carrierName.trim().toUpperCase();
    try {
        const conflict = await carrierDB.checkCarrierUniqueFields(conn, { carrierName });
        if (conflict) {
            throw new Error(`Carrier "${carrierName}" already exists`);
        }

        const entityId = await entityDB.createEntity(conn, "CARRIER", carrierName);
        const noteThreadId = await noteDB.createNoteThread(conn, entityId, adminId);
        const carrierId = await carrierDB.createCarrier(conn, {
            ...carrier,
            carrierName,
            insuranceExpiry: carrier.insuranceExpiry ? new Date(carrier.insuranceExpiry) : null,
            tariffRenewalDate: carrier.tariffRenewalDate ? new Date(carrier.tariffRenewalDate) : null,
            totalShipments: 0,
            rmOnTimePercent: 0,
            lateShipments: 0,
            createdBy: adminId,
            entityId,
            noteThreadId
        });
        if (!carrierId) {
            throw new Error(`Carrier insert failed for "${carrierName}"`);
        }

        await createAddressRecords(conn, entityId, carrier.addresses);

        for (const terminalSource of source.terminals) {
            const terminalName = terminalSource.terminalName.trim().toUpperCase();
            const terminalConflict = await terminalDB.getTerminalByCarrierAndName(conn, carrierId, terminalName);
            if (terminalConflict) {
                throw new Error(`Terminal "${terminalName}" already exists for carrier "${carrierName}"`);
            }

            const fieldConflict = await terminalDB.checkTerminalUniqueFields(conn, {
                email: terminalSource.email,
                faxNumber: terminalSource.faxNumber,
                phoneNumber: terminalSource.phoneNumber,
                rmAccountNumber: terminalSource.rmAccountNumber
            });
            if (fieldConflict) {
                throw new Error(`Terminal ${fieldConflict} "${terminalSource[fieldConflict as keyof typeof terminalSource]}" already exists for "${carrierName}"`);
            }

            const terminalEntityId = await entityDB.createEntity(conn, "TERMINAL", terminalName);
            const terminalNoteThreadId = await noteDB.createNoteThread(conn, terminalEntityId, adminId);
            const terminalId = await terminalDB.createTerminal(conn, {
                ...terminalSource,
                carrierId,
                entityId: terminalEntityId,
                terminalName,
                email: terminalSource.email || null,
                phoneNumber: terminalSource.phoneNumber || null,
                faxNumber: terminalSource.faxNumber || null,
                openTime: terminalSource.openTime || null,
                closeTime: terminalSource.closeTime || null,
                noteThreadId: terminalNoteThreadId,
                activeStatus: "Y",
                createdBy: adminId
            });
            if (!terminalId) {
                throw new Error(`Terminal insert failed for "${terminalName}"`);
            }
            await createAddressRecords(conn, terminalEntityId, terminalSource.addresses);
        }

        return carrierId;
    } catch (error) {
        console.error("[Carrier import] Error while creating carrier aggregate for:", carrierName);
        console.error("[Carrier import] Carrier source snapshot:", JSON.stringify({
            carrierName: source.carrierName,
            carrierType: source.carrierType,
            carrierStatus: source.carrierStatus,
            terminalCount: source.terminals?.length ?? 0
        }, null, 2));
        console.error("[Carrier import] Actual DB error:", error);
        throw error;
    }
}

export async function dumpCarrierData(): Promise<void> {
    if (!Number.isInteger(adminId) || adminId < 1) {
        throw new Error(`Invalid admin user ID: ${adminId}`);
    }

    const carriers = readCarrierSource();
    const validationErrors = validateCarriers(carriers);
    if (validationErrors.length > 0) {
        validationErrors.forEach((message) => console.error(`[Carrier import] Mandatory field missing: ${message}`));
        throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
    }

    const conn = await db();
    let terminalCount = 0;
    let transactionStarted = false;

    try {
        await conn.beginTransaction();
        transactionStarted = true;

        for (const [index, record] of carriers.entries()) {
            await createCarrierAggregate(conn, record);
            terminalCount += record.terminals.length;

            console.log(
                `[Carrier import] ${index + 1}/${carriers.length}: ${record.carrierName} ` +
                `(${record.terminals.length} terminals)`
            );
        }

        await conn.commit();
        console.log(`[Carrier import] Complete: ${carriers.length} carriers, ${terminalCount} terminals`);
    } catch (error) {
        if (transactionStarted) {
            await conn.rollback();
            console.error("[Carrier import] Rolled back all carrier data");
        }
        throw error;
    } finally {
        await conn.close();
    }
}

if (require.main === module) {
    dumpCarrierData().catch((error: unknown) => {
        console.error("[Carrier import] Failed:", error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}