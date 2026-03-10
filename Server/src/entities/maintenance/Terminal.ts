import { AddressRequest, AddressUpdateRequest } from "./Address";

export interface Terminal {
    terminalId: number;
    carrierId: number;          // FK → Carrier
    entityId: number;           // link to global Entity table
    terminalName: string;
    rmAccountNumber: string;    // unique per terminal
    airportCode: string;
    email?: string | null;
    phoneNumber?: string | null;
    faxNumber?: string | null;
    openTime: string | null;    // HH:mm:ss
    closeTime: string | null;   // HH:mm:ss
    hours?: string | null;
    activeStatus: 'Y' | 'N';
    createdAt: Date;
    createdBy: number;
    updatedAt?: Date;
    updatedBy?: number;
    noteThreadId?: number | null;
}

export interface CreateTerminalRequest {
    carrierId: number;
    terminalName: string;
    rmAccountNumber: string;
    airportCode: string;
    email?: string;
    phoneNumber?: string;
    faxNumber?: string;
    openTime?: string;
    closeTime?: string;
    hours?: string;
    addresses: AddressRequest[];   // terminal requires one primary address
    note?: { messageText: string };
}

export interface UpdateTerminalRequest {
    terminalName?: string;
    rmAccountNumber?: string;
    airportCode?: string;
    email?: string;
    phoneNumber?: string;
    faxNumber?: string;
    openTime?: string;
    closeTime?: string;
    hours?: string;
    addresses?: AddressUpdateRequest[];
}

export interface TerminalResponse extends Terminal {
    carrierName: string;
    addresses: AddressRequest[];
    notes: {
        noteMessageId: number;
        noteThreadId: number;
        messageText: string;
        createdAt: Date;
        createdBy: number;
    }[];
}
