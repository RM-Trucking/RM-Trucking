import { NoteMessageRequest, NoteMessageResponse } from "./Note";
import { ZoneInfo } from "./Zone";

// -------------------- Warehouse Rate --------------------
export interface CustomerRateWarehouse {
    rateId: number;
    minRate: number;
    ratePerPound: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Request object for creating a warehouse rate
export interface CreateCustomerWarehouseRateRequest {
    minRate: number;
    ratePerPound: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Request object for updating a warehouse rate
export interface UpdateCustomerWarehouseRateRequest {
    minRate?: number;
    ratePerPound?: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Response object
export interface CustomerWarehouseRateResponse extends CustomerRateWarehouse { }
// --------------------------------------------------------


// -------------------- Transport Rate --------------------
export interface CustomerRate {
    rateId: number;
    customerRateId: number;
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

export interface CustomerRateDetail {
    rateDetailId: number;
    rateId: number;
    rateField: string;
    chargeValue: number;
    perUnitFlag: 'Y' | 'N';
}



// Request object for creating a transport rate
export interface CreateCustomerTransportRateRequest {
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
export interface UpdateCustomerTransportRateRequest {
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
export interface CustomerTransportRateResponse {
    rateId: number;
    customerRateId: number;
    originZone: ZoneInfo | null;
    destinationZone: ZoneInfo | null;
    details: CustomerRateDetail[];
    activeStatus?: 'Y' | 'N';
    expiryDate?: string | null;
    createdAt: Date | null;
    createdByName: string;
    updatedAt?: Date | null;
    updatedByName?: string;
    customerCount?: number;
    entityId?: number;
    noteThreadId?: number | null;
    notes?: NoteMessageResponse[];
}

// --------------------------------------------------------


// -------------------- Station Rate Map --------------------
export interface StationRateMap {
    stationRateId: number;
    stationId: number;
    rateId: number;
    rateType: 'WAREHOUSE' | 'TRANSPORT';
    assignedBy: number;
    assignedAt: Date;
}

// Request object for assigning a rate to a station
export interface AssignRateToStationRequest {
    stationId: number;
    rateId: number;
    rateType: 'WAREHOUSE' | 'TRANSPORT';
}

// Response object
export interface StationRateMapResponse extends StationRateMap { }
// ----------------------------------------------------------


export interface CustomerTransportRateSearch {
    originZoneId?: number;
    originZipOrRange?: string;       // either a zip or "start-end"
    destinationZoneId?: number;
    destinationZipOrRange?: string;  // either a zip or "start-end"
}
