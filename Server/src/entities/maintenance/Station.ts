import { AddressRequest, AddressUpdateRequest } from "./Address";

export interface Station {
    stationId: number;
    customerId: number;
    entityId: number;
    stationName: string;
    rmAccountNumber: string;
    airportCode: string;
    phoneNumber: string;
    faxNumber: string;
    openTime: string | null;
    closeTime: string | null;
    hours: string;
    warehouse: 'Y' | 'N';
    warehouseDetail: string;
    hasWarehouseService: 'Y' | 'N';
    warehouseEmails: string | null;
    activeStatus: 'Y' | 'N';
    createdAt: Date | null;
    createdBy: number;
    updatedAt: Date | null;
    updatedBy: number;
    noteThreadId?: number | null;
}

export interface CreateStationRequest {
    customerId: number;
    stationName: string;
    rmAccountNumber: string;
    airportCode: string;
    phoneNumber: string;
    faxNumber: string;
    openTime: string;
    closeTime: string;
    hours: string;
    warehouse: 'Y' | 'N';
    warehouseDetail?: string;
    hasWarehouseService: 'Y' | 'N';
    warehouseEmails?: string[] | null;
    addresses?: AddressRequest[];
    note?: { messageText: string };
}

export interface UpdateStationRequest {
    stationName?: string;
    rmAccountNumber?: string;
    airportCode?: string;
    phoneNumber?: string;
    faxNumber?: string;
    openTime?: string;
    closeTime?: string;
    hours?: string;
    warehouse?: 'Y' | 'N';
    warehouseDetail?: string;
    hasWarehouseService?: 'Y' | 'N';
    warehouseEmails?: string[] | null;
    addresses?: AddressUpdateRequest[];
}

export interface StationResponse extends Station {
    customerName: string;
    addresses: AddressRequest[];
    notes: {
        noteMessageId: number;
        noteThreadId: number;
        messageText: string;
        createdAt: Date | null;
        createdBy: number;
    }[];
}
