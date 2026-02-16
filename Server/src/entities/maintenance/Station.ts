import { AddressRequest, AddressUpdateRequest } from "./Address";

export interface Station {
    stationId: number;
    customerId: number;
    entityId: number;          // link to global Entity table
    stationName: string;
    rmAccountNumber: string;
    airportCode: string;
    phoneNumber: string;
    faxNumber: string;
    openTime: string | null;          // HH:mm:ss
    closeTime: string | null;         // HH:mm:ss
    hours: string;
    warehouse: 'Y' | 'N';
    warehouseDetail: string;
    activeStatus: 'Y' | 'N';
    createdAt: Date;
    createdBy: number;
    updatedAt: Date;
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
    addresses?: AddressUpdateRequest[];
}

export interface StationResponse extends Station {
    customerName: string;
    addresses: AddressRequest[];
    notes: {
        noteMessageId: number;
        noteThreadId: number;
        messageText: string;
        createdAt: Date;
        createdBy: number;
    }[];
}
