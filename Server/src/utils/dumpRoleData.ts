import "../config/env";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Connection } from "odbc";
import { db, SCHEMA } from "../config/db2";
import * as authorizationRepository from "../database/authorization/authorizationRepository";

interface RoleSourceRecord {
    name: string;
    description: string | null;
    roleKind: "EMPLOYEE" | "CUSTOMER";
    status: "ACTIVE" | "INACTIVE";
    isSystemManaged: "Y" | "N";
    permissionCodes: string[];
    parentRoleIds: number[];
}

const sourcePath = resolve(process.argv[2] || resolve(__dirname, "../source/role.json"));

function readRoleSource(): RoleSourceRecord[] {
    if (!existsSync(sourcePath)) {
        throw new Error(`Role source file not found: ${sourcePath}`);
    }

    const source = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    if (!Array.isArray(source)) {
        throw new Error("Role source must contain an array of role records");
    }

    return source as RoleSourceRecord[];
}

function required(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
}

function validateRoles(roles: RoleSourceRecord[]): string[] {
    const errors: string[] = [];
    const roleNames = new Set<string>();

    roles.forEach((role, index) => {
        const label = `Role ${index + 1}${role?.name ? ` (${role.name})` : ""}`;
        for (const field of ["name", "roleKind", "status", "isSystemManaged"] as const) {
            if (!required(role?.[field])) errors.push(`${label}.${field} is required`);
        }

        if (required(role?.roleKind) && !["EMPLOYEE", "CUSTOMER"].includes(role.roleKind)) {
            errors.push(`${label}.roleKind must be EMPLOYEE or CUSTOMER`);
        }
        if (required(role?.status) && !["ACTIVE", "INACTIVE"].includes(role.status)) {
            errors.push(`${label}.status must be ACTIVE or INACTIVE`);
        }
        if (required(role?.isSystemManaged) && !["Y", "N"].includes(role.isSystemManaged)) {
            errors.push(`${label}.isSystemManaged must be Y or N`);
        }
        if (role?.description !== null && role?.description !== undefined && typeof role.description !== "string") {
            errors.push(`${label}.description must be a string or null`);
        }

        if (required(role?.name) && required(role?.roleKind)) {
            const key = `${role.roleKind}:${role.name.trim().toUpperCase()}`;
            if (roleNames.has(key)) errors.push(`${label}.name is duplicated for this role kind`);
            roleNames.add(key);
        }

        if (!Array.isArray(role?.permissionCodes) || role.permissionCodes.some((code) => !required(code))) {
            errors.push(`${label}.permissionCodes must be an array of non-empty strings`);
        } else {
            const codes = role.permissionCodes.map((code) => code.trim().toUpperCase());
            if (new Set(codes).size !== codes.length) errors.push(`${label}.permissionCodes contains duplicates`);
        }

        if (!Array.isArray(role?.parentRoleIds) || role.parentRoleIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
            errors.push(`${label}.parentRoleIds must be an array of positive integer role IDs`);
        } else if (new Set(role.parentRoleIds).size !== role.parentRoleIds.length) {
            errors.push(`${label}.parentRoleIds contains duplicates`);
        }
    });

    return errors;
}

async function upsertRole(conn: Connection, source: RoleSourceRecord, actorUserId: number): Promise<{ roleId: number; result: "inserted" | "updated" }> {
    const name = source.name.trim();
    const existing = await authorizationRepository.getRoleByName(conn, name, source.roleKind);

    if (existing) {
        await conn.query(
            `UPDATE ${SCHEMA}."Role" SET "name" = ?, "description" = ?, "roleKind" = ?, "status" = ?, "isSystemManaged" = ?, "updatedBy" = ?, "updatedAt" = (CURRENT_TIMESTAMP - CURRENT_TIMEZONE) WHERE "roleId" = ?`,
            [name, source.description?.trim() || null, source.roleKind, source.status, source.isSystemManaged, actorUserId, existing.roleId] as any[],
        );
        return { roleId: existing.roleId, result: "updated" };
    }

    await conn.query(
        `INSERT INTO ${SCHEMA}."Role" ("name", "description", "roleKind", "status", "isSystemManaged", "createdBy", "createdAt", "updatedBy", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE), ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE))`,
        [name, source.description?.trim() || null, source.roleKind, source.status, source.isSystemManaged, actorUserId, actorUserId] as any[],
    );

    const created = await authorizationRepository.getRoleByName(conn, name, source.roleKind);
    if (!created) throw new Error(`Role "${name}" could not be retrieved after insert`);
    return { roleId: created.roleId, result: "inserted" };
}

async function replaceRolePermissions(conn: Connection, roleId: number, permissionCodes: string[], actorUserId: number): Promise<void> {
    const permissionRows = await authorizationRepository.getPermissionsByCodes(conn, permissionCodes);
    const foundCodes = new Set(
        permissionRows.map((permission: any) =>
            String(permission.permissionCode ?? permission.PERMISSIONCODE).toUpperCase()
        ),
    );
    const missingCodes = permissionCodes.filter((permissionCode) => !foundCodes.has(permissionCode));
    if (missingCodes.length) {
        throw new Error(`Unknown permission codes: ${missingCodes.join(", ")}`);
    }

    await conn.query(`DELETE FROM ${SCHEMA}."RolePermission" WHERE "roleId" = ?`, [roleId]);

    for (const permissionCode of permissionCodes) {
        await conn.query(
            `INSERT INTO ${SCHEMA}."RolePermission" ("roleId", "permissionCode", "grantedBy", "createdAt") VALUES (?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE))`,
            [roleId, permissionCode, actorUserId] as any[],
        );
    }
}

async function replaceParentRoleLinks(conn: Connection, roleId: number, source: RoleSourceRecord, actorUserId: number): Promise<void> {
    await conn.query(`DELETE FROM ${SCHEMA}."RoleHierarchyLink" WHERE "childRoleId" = ?`, [roleId]);

    for (const parentRoleId of source.parentRoleIds) {
        if (parentRoleId === roleId) throw new Error(`Role "${source.name}" cannot be its own parent`);

        const parentRole = await authorizationRepository.getRoleById(conn, parentRoleId);
        if (!parentRole || parentRole.status !== "ACTIVE" || parentRole.roleKind !== source.roleKind) {
            throw new Error(`Parent role ${parentRoleId} for "${source.name}" is missing, inactive, or has a different role kind`);
        }

        await conn.query(
            `INSERT INTO ${SCHEMA}."RoleHierarchyLink" ("parentRoleId", "childRoleId", "createdBy", "createdAt") VALUES (?, ?, ?, (CURRENT_TIMESTAMP - CURRENT_TIMEZONE))`,
            [parentRoleId, roleId, actorUserId] as any[],
        );
    }
}

export async function dumpRoleData(): Promise<void> {
    const roles = readRoleSource();
    const validationErrors = validateRoles(roles);
    if (validationErrors.length > 0) {
        validationErrors.forEach((message) => console.error(`[Role import] Validation error: ${message}`));
        throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
    }

    const conn = await db();
    let transactionStarted = false;

    try {
        await conn.beginTransaction();
        transactionStarted = true;
        const systemUser = await authorizationRepository.getUserByName(conn, "SYSTEM")
            ?? await authorizationRepository.getUserByName(conn, "ADMIN");
        if (!systemUser) {
            throw new Error('SYSTEM or ADMIN user not found; import users before importing roles');
        }
        const actorUserId = systemUser.userId;

        for (const [index, source] of roles.entries()) {
            let roleId = -1;
            let result: "inserted" | "updated";
            let stage = "role upsert";
            try {
                ({ roleId, result } = await upsertRole(conn, source, actorUserId));

                stage = "permission replacement";
                const permissionCodes = source.permissionCodes.map((code) => code.trim().toUpperCase());
                await replaceRolePermissions(conn, roleId, permissionCodes, actorUserId);

                stage = "parent-role replacement";
                await replaceParentRoleLinks(conn, roleId, source, actorUserId);
            } catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                const wrapped = new Error(`Failed while processing role "${source.name}" (roleId=${roleId === -1 ? "not created" : roleId}, stage=${stage}): ${detail}`);
                (wrapped as Error & { cause?: unknown }).cause = error;
                throw wrapped;
            }
            console.log(`[Role import] ${index + 1}/${roles.length}: ${source.name} ${result}`);
        }

        await conn.commit();
        console.log(`[Role import] Complete: ${roles.length} roles processed`);
    } catch (error) {
        if (transactionStarted) {
            await conn.rollback();
            console.error("[Role import] Rolled back all role data");
        }
        throw error;
    } finally {
        await conn.close();
    }
}

if (require.main === module) {
    dumpRoleData().catch((error: unknown) => {
        console.error("[Role import] Failed:", error instanceof Error ? error.message : error);
        if (error && typeof error === "object") {
            const odbcError = error as {
                odbcErrors?: Array<{ sqlState?: string; message?: string }>;
                stack?: string;
            };
            odbcError.odbcErrors?.forEach((detail, index) => {
                console.error(`[Role import] ODBC ${index + 1}: SQLSTATE=${detail.sqlState ?? "UNKNOWN"} ${detail.message ?? ""}`);
            });
            if (error instanceof Error) {
                const cause = (error as Error & { cause?: unknown }).cause;
                if (cause) console.error("[Role import] Root cause:", cause);
            }
            console.error("[Role import] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            if (odbcError.stack) console.error(odbcError.stack);
        }
        process.exitCode = 1;
    });
}