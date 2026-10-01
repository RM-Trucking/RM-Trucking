import "../config/env";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Connection } from "odbc";
import { CreateUserRequest } from "../entities/maintenance";
import * as userDB from "../database/maintenance/user";
import { db } from "../config/db2";
import { createPasswordHash } from "./password";

interface UserSourceRecord extends CreateUserRequest {
    loginPassword: string;
}

const sourcePath = resolve(process.argv[2] || resolve(__dirname, "../source/user.json"));
let adminId = 1;
const configuredAdminId = process.argv[3] || process.env.USER_IMPORT_ADMIN_ID;
if (configuredAdminId) {
    adminId = Number(configuredAdminId);
}

function readUserSource(): UserSourceRecord[] {
    if (!existsSync(sourcePath)) {
        throw new Error(`User source file not found: ${sourcePath}`);
    }

    const source = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    if (!Array.isArray(source)) {
        throw new Error("User source must contain an array of user records");
    }

    return source as UserSourceRecord[];
}

function required(value: unknown): boolean {
    return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function validateUsers(users: UserSourceRecord[]): string[] {
    const errors: string[] = [];
    const loginUserNames = new Set<string>();

    users.forEach((user, userIndex) => {
        const userLabel = `User ${userIndex + 1}${user?.userName ? ` (${user.userName})` : ""}`;
        for (const field of ["userName", "loginUserName", "email", "loginPassword", "userType"] as const) {
            if (!required(user?.[field])) {
                errors.push(`${userLabel}.${field} is required`);
            }
        }

        if (required(user?.userType) && !["EMPLOYEE", "CUSTOMER"].includes(user.userType)) {
            errors.push(`${userLabel}.userType must be EMPLOYEE or CUSTOMER`);
        }

        if (required(user?.loginUserName)) {
            const normalizedLoginUserName = user.loginUserName.trim().toUpperCase();
            if (loginUserNames.has(normalizedLoginUserName)) {
                errors.push(`${userLabel}.loginUserName is duplicated in the source data`);
            }
            loginUserNames.add(normalizedLoginUserName);
        }
    });

    return errors;
}

async function createUserRecord(conn: Connection, source: UserSourceRecord): Promise<number> {
    const loginUserName = source.loginUserName.trim().toUpperCase();
    const existingUser = await userDB.getUserByLoginUsername(conn, loginUserName);
    if (existingUser) {
        throw new Error(`Login username "${loginUserName}" already exists`);
    }

    // Source files contain plaintext passwords; only the bcrypt hash is sent to the database.
    const passwordHash = createPasswordHash(source.loginPassword);
    const userId = await userDB.createUser(
        conn,
        source.userName.trim(),
        loginUserName,
        source.email.trim(),
        passwordHash,
        source.roleId ?? null,
        source.userType,
        adminId,
        source.customerId ?? null
    );

    if (!userId) {
        throw new Error(`User insert failed for "${source.userName}"`);
    }

    return userId;
}

export async function dumpUserData(): Promise<void> {
    if (!Number.isInteger(adminId) || adminId < 1) {
        throw new Error(`Invalid admin user ID: ${adminId}`);
    }

    const users = readUserSource();
    const validationErrors = validateUsers(users);
    if (validationErrors.length > 0) {
        validationErrors.forEach((message) => console.error(`[User import] Validation error: ${message}`));
        throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
    }

    const conn = await db();
    let transactionStarted = false;

    try {
        await conn.beginTransaction();
        transactionStarted = true;

        for (const [index, user] of users.entries()) {
            await createUserRecord(conn, user);
            console.log(`[User import] ${index + 1}/${users.length}: ${user.userName}`);
        }

        await conn.commit();
        console.log(`[User import] Complete: ${users.length} users`);
    } catch (error) {
        if (transactionStarted) {
            await conn.rollback();
            console.error("[User import] Rolled back all user data");
        }
        throw error;
    } finally {
        await conn.close();
    }
}

if (require.main === module) {
    dumpUserData().catch((error: unknown) => {
        console.error("[User import] Failed:", error);
        process.exitCode = 1;
    });
}
