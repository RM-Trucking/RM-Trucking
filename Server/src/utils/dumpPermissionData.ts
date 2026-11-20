import "../config/env";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Connection } from "odbc";
import { db } from "../config/db2";
import * as authorizationRepository from "../database/authorization/authorizationRepository";
import { PermissionApplicationCode } from "../entities/authorization/Permission";

interface PermissionSourceRecord {
    permissionCode: string;
    displayName: string;
    applicationCode: PermissionApplicationCode;
    permissionKey: string;
    moduleKey: string;
    resourceKey: string;
    actionKey: string;
    description?: string | null;
    forEmployee: "Y" | "N";
    forCustomer: "Y" | "N";
}

const sourcePath = resolve(process.argv[2] || resolve(__dirname, "../source/permission.json"));
const applicationCodes: PermissionApplicationCode[] = ["warehouse", "maintenance", "network_services"];

function readPermissionSource(): PermissionSourceRecord[] {
    if (!existsSync(sourcePath)) {
        throw new Error(`Permission source file not found: ${sourcePath}`);
    }

    const source = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    if (!Array.isArray(source)) {
        throw new Error("Permission source must contain an array of permission records");
    }

    return source as PermissionSourceRecord[];
}

function required(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
}

function validatePermissions(permissions: PermissionSourceRecord[]): string[] {
    const errors: string[] = [];
    const permissionCodes = new Set<string>();
    const permissionKeys = new Set<string>();

    permissions.forEach((permission, index) => {
        const label = `Permission ${index + 1}${permission?.permissionCode ? ` (${permission.permissionCode})` : ""}`;
        for (const field of ["permissionCode", "displayName", "applicationCode", "permissionKey", "moduleKey", "resourceKey", "actionKey", "forEmployee", "forCustomer"] as const) {
            if (!required(permission?.[field])) {
                errors.push(`${label}.${field} is required`);
            }
        }

        if (required(permission?.applicationCode) && !applicationCodes.includes(permission.applicationCode)) {
            errors.push(`${label}.applicationCode must be warehouse, maintenance, or network_services`);
        }

        if (required(permission?.permissionCode)) {
            const code = permission.permissionCode.trim().toUpperCase();
            if (permissionCodes.has(code)) errors.push(`${label}.permissionCode is duplicated in the source data`);
            permissionCodes.add(code);
        }

        if (required(permission?.permissionKey)) {
            const key = permission.permissionKey.trim().toLowerCase();
            if (permissionKeys.has(key)) errors.push(`${label}.permissionKey is duplicated in the source data`);
            permissionKeys.add(key);
        }

        if (required(permission?.moduleKey) && required(permission?.resourceKey) && required(permission?.actionKey) && required(permission?.permissionKey)) {
            const expectedKey = `${permission.moduleKey.trim()}.${permission.resourceKey.trim()}.${permission.actionKey.trim()}`;
            if (permission.permissionKey.trim() !== expectedKey) {
                errors.push(`${label}.permissionKey must match moduleKey.resourceKey.actionKey (${expectedKey})`);
            }
        }

        if (permission?.description !== undefined && permission.description !== null && typeof permission.description !== "string") {
            errors.push(`${label}.description must be a string or null`);
        }
        if (required(permission?.forEmployee) && !["Y", "N"].includes(permission.forEmployee)) {
            errors.push(`${label}.forEmployee must be Y or N`);
        }
        if (required(permission?.forCustomer) && !["Y", "N"].includes(permission.forCustomer)) {
            errors.push(`${label}.forCustomer must be Y or N`);
        }
    });

    return errors;
}

async function upsertPermission(conn: Connection, source: PermissionSourceRecord): Promise<"inserted" | "updated"> {
    return authorizationRepository.upsertPermission(conn, {
        permissionCode: source.permissionCode.trim(),
        displayName: source.displayName.trim(),
        applicationCode: source.applicationCode,
        permissionKey: source.permissionKey.trim(),
        moduleKey: source.moduleKey.trim(),
        resourceKey: source.resourceKey.trim(),
        actionKey: source.actionKey.trim(),
        description: source.description?.trim() || null,
        forEmployee: source.forEmployee,
        forCustomer: source.forCustomer,
    });
}

export async function dumpPermissionData(): Promise<void> {
    const permissions = readPermissionSource();
    const validationErrors = validatePermissions(permissions);
    if (validationErrors.length > 0) {
        validationErrors.forEach((message) => console.error(`[Permission import] Validation error: ${message}`));
        throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
    }

    const conn = await db();
    let transactionStarted = false;

    try {
        await conn.beginTransaction();
        transactionStarted = true;
        let inserted = 0;
        let updated = 0;

        for (const [index, permission] of permissions.entries()) {
            const result = await upsertPermission(conn, permission);
            if (result === "inserted") inserted += 1;
            else updated += 1;
            console.log(`[Permission import] ${index + 1}/${permissions.length}: ${permission.permissionCode} ${result}`);
        }

        await conn.commit();
        console.log(`[Permission import] Complete: ${inserted} inserted, ${updated} updated`);
    } catch (error) {
        if (transactionStarted) {
            await conn.rollback();
            console.error("[Permission import] Rolled back all permission data");
        }
        throw error;
    } finally {
        await conn.close();
    }
}

if (require.main === module) {
    dumpPermissionData().catch((error: unknown) => {
        console.error("[Permission import] Failed:", error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}
