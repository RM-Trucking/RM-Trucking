
export interface CustomerFuelSurcharge {
    customerFuelSurchargeId: number;  // PK
    customerId: number;               // FK → Customer
    customerName: string;             // stored for quick reference
    fuelPercentage: number;           // e.g. 10.0%
    effectiveDate: Date;            // ISO date string (YYYY-MM-DD)
    effectiveTime: string;            // HH:mm:ss
    expireDate?: Date | null;
    expireTime?: string | null;
    createdBy: number;
    createdAt: Date;
    updatedBy?: number | null;
    updatedAt?: Date | null;
    stations: CustomerFuelSurchargeStation[];
}

export interface CustomerFuelSurchargeStation {
    surchargeStationId: number;       // PK
    customerFuelSurchargeId: number;  // FK → CustomerFuelSurcharge
    stationId: number;                // FK → Station
    stationName: string;              // stored for quick reference
}


export interface CreateCustomerFuelSurchargeRequest {
    customerId: number;
    customerName: string;
    fuelPercentage: number;
    effectiveDate: Date;
    effectiveTime: string;
    stations: {
        stationId: number;
        stationName: string;
    }[];
}

export interface UpdateCustomerFuelSurchargeRequest {
    fuelPercentage?: number;
    effectiveDate?: Date;
    effectiveTime?: string;
    stations?: {
        stationId: number;
        stationName: string;
    }[];
}

export interface CustomerFuelSurchargeResponse extends CustomerFuelSurcharge { }
