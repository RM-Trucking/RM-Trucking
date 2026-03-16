
export interface GeneralFuelSurcharge {
    fuelSurchargeId: number;          // PK
    fuelPercentage: number;           // e.g. 12.5%
    effectiveDate: Date;            // ISO date string (YYYY-MM-DD)
    effectiveTime: string;            // HH:mm:ss
    expireDate?: Date | null;       // optional ISO date
    expireTime?: string | null;       // optional HH:mm:ss
    createdBy: number;                // user id/name
    createdAt: Date;                // ISO timestamp
    updatedBy?: number | null;        // optional user id/name
    updatedAt?: Date | null;        // optional ISO timestamp
}

export interface CreateGeneralFuelSurchargeRequest {
    fuelPercentage: number;
    effectiveDate: Date;
    effectiveTime: string;
}


export interface UpdateGeneralFuelSurchargeRequest {
    fuelPercentage?: number;
    effectiveDate?: Date;
    effectiveTime?: string;
}

export interface GeneralFuelSurchargeResponse extends GeneralFuelSurcharge { }
