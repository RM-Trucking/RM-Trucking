import "../config/env";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Connection } from "odbc";
import { db } from "../config/db2";
import * as entityDB from "../database/maintenance/entity";
import * as shipmentDB from "../database/shipment";

interface AirlineSourceRecord {
    airlineNumber: string;
    airlineCode: string;
    airlineName: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    airportCode?: string;
    contactPersonName?: string;
    phoneNumber?: string;
    scenarioType: "IMPORT" | "EXPORT";
}

const sourcePath = resolve(process.argv[2] || resolve(__dirname, "../source/airline.json"));

function readAirlineSource(): AirlineSourceRecord[] {
    if (!existsSync(sourcePath)) {
        throw new Error(`Airline source file not found: ${sourcePath}`);
    }

    const source = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    if (!Array.isArray(source)) {
        throw new Error("Airline source must contain an array of airline records");
    }

    return source as AirlineSourceRecord[];
}

function required(value: unknown): boolean {
    return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function validateAirlines(airlines: AirlineSourceRecord[]): string[] {
    const errors: string[] = [];

    airlines.forEach((airline, index) => {
        const label = `Airline ${index + 1}${airline?.airlineName ? ` (${airline.airlineName})` : ""}`;
        for (const field of ["airlineNumber", "airlineCode", "airlineName", "scenarioType"]) {
            if (!required(airline?.[field as keyof AirlineSourceRecord])) {
                errors.push(`${label}.${field} is required`);
            }
        }

        if (required(airline?.scenarioType) && !["IMPORT", "EXPORT"].includes(airline.scenarioType)) {
            errors.push(`${label}.scenarioType must be IMPORT or EXPORT`);
        }
    });

    return errors;
}

async function createAirlineAggregate(conn: Connection, source: AirlineSourceRecord): Promise<{ entityId: number; airlineId: number }> {
    const airlineNumber = source.airlineNumber.trim();
    const airlineCode = source.airlineCode.trim().toUpperCase();
    const airlineName = source.airlineName.trim();
    const scenarioType = source.scenarioType;

    try {
        const conflict = await shipmentDB.checkAirlineUniqueFields(conn, airlineNumber, airlineCode, scenarioType);
        if (conflict) {
            throw new Error(`Airline "${airlineName}" already exists with duplicate ${conflict} for ${scenarioType}`);
        }

        console.log(`[Airline import] Creating entity for ${airlineName} (${scenarioType})`);
        const entityId = await entityDB.createEntity(conn, "AIRLINE", airlineName);
        if (!entityId) {
            throw new Error(`Entity insert failed for "${airlineName}"`);
        }

        const airlineRecord = await shipmentDB.createAirlineInfo(conn, {
            airlineNumber,
            airlineCode,
            airportCode: source.airportCode?.trim() || "",
            airlineName,
            addressLine1: source.addressLine1?.trim() || "",
            addressLine2: source.addressLine2?.trim() || "",
            city: source.city?.trim() || "",
            state: source.state?.trim() || "",
            zipCode: source.zipCode?.trim() || "",
            contactPersonName: source.contactPersonName?.trim() || "",
            phoneNumber: source.phoneNumber?.trim() || "",
            entityId,
            scenarioType
        });
        const airlineId = airlineRecord?.airlineId;
        if (!airlineId) {
            throw new Error(`Airline insert failed for "${airlineName}"`);
        }

        return { entityId, airlineId };
    } catch (error) {
        console.error(`[Airline import] Error while creating airline "${airlineName}" (${scenarioType})`);
        console.error("[Airline import] Airline source snapshot:", JSON.stringify(source, null, 2));
        console.error("[Airline import] Actual DB error:", error);
        throw error;
    }
}

export async function dumpAirlineData(): Promise<void> {
    const airlines = readAirlineSource();
    const validationErrors = validateAirlines(airlines);
    if (validationErrors.length > 0) {
        validationErrors.forEach((message) => console.error(`[Airline import] Validation error: ${message}`));
        throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
    }

    const conn = await db();
    let transactionStarted = false;

    try {
        console.log(`[Airline import] Starting import of ${airlines.length} airline records from ${sourcePath}`);
        await conn.beginTransaction();
        transactionStarted = true;

        for (const [index, airline] of airlines.entries()) {
            const created = await createAirlineAggregate(conn, airline);
            console.log(
                `[Airline import] ${index + 1}/${airlines.length}: ${airline.airlineName} ` +
                `(${airline.scenarioType}) -> entityId=${created.entityId}, airlineId=${created.airlineId}`
            );
        }

        await conn.commit();
        console.log(`[Airline import] Complete: ${airlines.length} airlines imported with entity mappings`);
    } catch (error) {
        if (transactionStarted) {
            await conn.rollback();
            console.error("[Airline import] Rolled back all airline and entity data");
        }
        throw error;
    } finally {
        await conn.close();
        console.log("[Airline import] Database connection closed");
    }
}

if (require.main === module) {
    dumpAirlineData().catch((error: unknown) => {
        console.error("[Airline import] Failed:", error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}