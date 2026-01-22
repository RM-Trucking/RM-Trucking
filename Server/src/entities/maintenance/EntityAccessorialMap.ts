export type ChargeType = 'PER_POUND' | 'FLAT_VALUE' | 'HOURLY';

export interface EntityAccessorialMap {
    entityAccessorialId: number;   // PK
    entityId: number;              // Linked entity ID
    accessorialId: number;         // FK → Accessorial.accessorialId
    chargeType: ChargeType;        // Per Pound, Flat Value
    chargeValue: number;           // Decimal(12,2)
    noteThreadId?: number | null;
}

export interface CreateEntityAccessorialMapRequest {
    entityId: number;
    accessorialId: number;
    chargeType: ChargeType;
    chargeValue: number;
    note?: { messageText: string };
}

export interface UpdateEntityAccessorialMapRequest {
    entityId?: number;
    chargeType?: ChargeType;
    chargeValue?: number;
    note?: { messageText: string };
}


export interface EntityAccessorialMapResponse extends EntityAccessorialMap {
    accessorialName?: string;      // joined from Accessorial table for display
    notes: {
        noteMessageId: number;
        noteThreadId: number;
        messageText: string;
        createdAt: Date;
        createdBy: number;
        createdByName?: string;
    }[];
}
