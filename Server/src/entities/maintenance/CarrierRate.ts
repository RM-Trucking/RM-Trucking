import { NoteMessageRequest, NoteMessageResponse } from "./Note";
import { ZoneInfo } from "./Zone";

// -------------------- Warehouse Rate --------------------
export interface CarrierRateWarehouse {
    rateId: number;
    carrierRateId: number;
    minRate: number;
    ratePerPound: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Request object for creating a warehouse rate
export interface CreateCarrierWarehouseRateRequest {
    minRate: number;
    ratePerPound: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Request object for updating a warehouse rate
export interface UpdateCarrierWarehouseRateRequest {
    minRate?: number;
    ratePerPound?: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Response object
export interface CarrierWarehouseRateResponse extends CarrierRateWarehouse { }
// --------------------------------------------------------


// -------------------- Transport Rate --------------------
export interface CarrierRate {
    rateId: number;
    carrierRateId: number;
    originZoneId: number;
    destinationZoneId: number;
    createdAt: string;        // TIMESTAMP
    createdBy: number;        // FK → User.userId
    updatedAt?: string;       // TIMESTAMP, nullable
    updatedBy?: number;       // FK → User.userId, nullable
    activeStatus?: 'Y' | 'N'; // Enum (Y/N), default 'Y'
    expiryDate?: string | null; // TIMESTAMP, nullable
    entityId: number;
    noteThreadId: number | null;
}

export interface CarrierRateDetail {
    rateDetailId: number;
    rateId: number;
    rateField: string;
    chargeValue: number;
    perUnitFlag: 'Y' | 'N';
}

// Request object for creating a transport rate
export interface CreateCarrierTransportRateRequest {
    originZoneId: number;
    destinationZoneId: number;
    details?: {
        rateField: string;
        chargeValue: number;
        perUnitFlag: 'Y' | 'N';
    }[];
    note?: NoteMessageRequest;
}

// Request object for updating a transport rate
export interface UpdateCarrierTransportRateRequest {
    originZoneId?: number;
    destinationZoneId?: number;
    details?: {
        rateField: string;
        chargeValue: number;
        perUnitFlag: 'Y' | 'N';
    }[];
    noteThreadId?: number | null;
    note?: NoteMessageRequest;
}

// Response object
export interface CarrierTransportRateResponse {
    rateId: number;
    carrierRateId: number;
    originZone: ZoneInfo | null;
    destinationZone: ZoneInfo | null;
    details: CarrierRateDetail[];
    activeStatus?: 'Y' | 'N';
    expiryDate?: string | null;
    createdAt: Date | null;
    createdByName: string;
    updatedAt?: Date | null;
    updatedByName?: string;
    carrierCount?: number;
    entityId?: number;
    noteThreadId?: number | null;
    notes?: NoteMessageResponse[];
}

// --------------------------------------------------------


// -------------------- Station Rate Map --------------------
export interface TerminalRateMap {
    terminalRateId: number;
    terminalId: number;
    rateId: number;
    rateType: 'WAREHOUSE' | 'TRANSPORT';
    assignedBy: number;
    assignedAt: Date;
}

// Request object for assigning a rate to a terminal
export interface AssignRateToTerminalRequest {
    terminalId: number;
    rateId: number;
    rateType: 'WAREHOUSE' | 'TRANSPORT';
}

// Response object
export interface TerminalRateMapResponse extends TerminalRateMap { }
// ----------------------------------------------------------


export interface CarrierTransportRateSearch {
    originZoneId?: number;
    originZipOrRange?: string;       // either a zip or "start-end"
    destinationZoneId?: number;
    destinationZipOrRange?: string;  // either a zip or "start-end"
}
