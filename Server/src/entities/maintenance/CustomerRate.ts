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
export interface CreateWarehouseRateRequest {
    minRate: number;
    ratePerPound: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Request object for updating a warehouse rate
export interface UpdateWarehouseRateRequest {
    minRate?: number;
    ratePerPound?: number;
    maxRate?: number | null;
    department?: string | null;
    warehouse?: string | null;
}

// Response object
export interface WarehouseRateResponse extends CustomerRateWarehouse { }
// --------------------------------------------------------


// -------------------- Transport Rate --------------------
export interface CustomerRate {
    rateId: number;
    originZoneId: number;
    destinationZoneId: number;
    createdAt: string;        // TIMESTAMP
    createdBy: number;        // FK → User.userId
    updatedAt?: string;       // TIMESTAMP, nullable
    updatedBy?: number;       // FK → User.userId, nullable
    activeStatus?: 'Y' | 'N'; // Enum (Y/N), default 'Y'
    expiryDate?: string | null; // TIMESTAMP, nullable
}

export interface CustomerRateDetail {
    rateDetailId: number;
    rateId: number;
    rateField: string;
    chargeValue: number;
    perUnitFlag: 'Y' | 'N';
}



// Request object for creating a transport rate
export interface CreateTransportRateRequest {
    originZoneId: number;
    destinationZoneId: number;
    details?: {
        rateField: string;
        chargeValue: number;
        perUnitFlag: 'Y' | 'N';
    }[];
}

// Request object for updating a transport rate
export interface UpdateTransportRateRequest {
    originZoneId?: number;
    destinationZoneId?: number;
    details?: {
        rateField: string;
        chargeValue: number;
        perUnitFlag: 'Y' | 'N';
    }[];
}

// Response object
export interface TransportRateResponse {
    rateId: number;
    originZone: ZoneInfo | null;
    destinationZone: ZoneInfo | null;
    details: CustomerRateDetail[];
    activeStatus?: 'Y' | 'N';
    expiryDate?: string | null;
    createdAt: string;
    createdByName: string;
    updatedAt?: string;
    updatedByName?: string;
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


export interface TransportRateSearch {
    originZoneId?: number;
    originZipOrRange?: string;       // either a zip or "start-end"
    destinationZoneId?: number;
    destinationZipOrRange?: string;  // either a zip or "start-end"
}
