import { Connection } from "odbc";
import * as cargoAPIDB from "../../database/maintenance/cargoAPI";
import { CreateCargoAPIRequest, UpdateCargoAPIRequest, CargoAPIResponse } from "../../entities/maintenance/CargoAPI";

export async function createCargoAPIService(
    conn: Connection,
    createReq: CreateCargoAPIRequest
): Promise<{ cargoAPI: CargoAPIResponse }> {
    try {
        const apiId = await cargoAPIDB.createCargoAPI(conn, createReq);
        if (!apiId) throw new Error("Failed to create cargo API");

        const cargoAPI = await cargoAPIDB.getCargoAPIById(conn, apiId);
        if (!cargoAPI) throw new Error("Failed to retrieve created cargo API");

        return { cargoAPI };
    } catch (error) {
        throw error;
    }
}

export async function listCargoAPIsService(
    conn: Connection,
    page: number,
    pageSize: number,
    searchTerm?: string,
    status?: string
): Promise<{ data: CargoAPIResponse[]; total: number; page: number; pageSize: number }> {
    try {
        const offset = (page - 1) * pageSize;
        const cargoAPIs = await cargoAPIDB.listCargoAPIs(conn, pageSize, offset, searchTerm, status);
        const total = await cargoAPIDB.countCargoAPIs(conn, searchTerm, status);

        return {
            data: cargoAPIs || [],
            total,
            page,
            pageSize
        };
    } catch (error) {
        throw error;
    }
}

export async function getCargoAPIByIdService(conn: Connection, apiId: number): Promise<CargoAPIResponse | null> {
    try {
        const cargoAPI = await cargoAPIDB.getCargoAPIById(conn, apiId);
        return cargoAPI || null;
    } catch (error) {
        throw error;
    }
}

export async function updateCargoAPIService(
    conn: Connection,
    updateReq: UpdateCargoAPIRequest & { apiId: number }
): Promise<CargoAPIResponse> {
    try {
        const { apiId, ...updates } = updateReq;

        await cargoAPIDB.updateCargoAPI(conn, apiId, updates);

        const cargoAPI = await cargoAPIDB.getCargoAPIById(conn, apiId);
        if (!cargoAPI) throw new Error("Failed to retrieve updated cargo API");

        return cargoAPI;
    } catch (error) {
        throw error;
    }
}

export async function toggleCargoAPIStatusService(
    conn: Connection,
    apiId: number,
    status: 'Y' | 'N'
): Promise<void> {
    try {
        await cargoAPIDB.toggleCargoAPIStatus(conn, apiId, status);
    } catch (error) {
        throw error;
    }
}

export async function listCargoAPIDropdownService(conn: Connection): Promise<any[]> {
    try {
        const cargoAPIs = await cargoAPIDB.listCargoAPIs(conn, 999, 0, undefined, 'Y');
        return cargoAPIs.map(api => ({
            apiId: api.apiId,
            apiName: api.apiName
        }));
    } catch (error) {
        throw error;
    }
}
