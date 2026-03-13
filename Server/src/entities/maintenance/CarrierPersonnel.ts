export interface CarrierPersonnel {
    personnelId: number;          // Unique identifier (PK)
    terminalId: number;            // FK → Station
    name: string;                 // Full name of the personnel
    personType: string;                // Enum (Driver, Dispatcher, etc.)
    email: string;                // Personnel’s email address (unique)
    officePhoneNumber?: string;   // Office phone number
    cellPhoneNumber?: string;     // Mobile phone number
    createdAt: Date;              // Record creation timestamp
    createdBy: number;            // FK → User.userId
    updatedAt?: Date;             // Record last update timestamp
    updatedBy?: number;           // FK → User.userId
    activeStatus: 'Y' | 'N';      // Enum (Y/N) indicates if personnel is active
    noteThreadId?: number | null;
    entityId: number;
}

// Request payload for creating personnel
export interface CreateCarrierPersonnelRequest {
    terminalId: number;
    name: string;
    personType: string;
    email: string;
    officePhoneNumber?: string;
    cellPhoneNumber?: string;
    note?: { messageText: string };
}

// Request payload for updating personnel
export interface UpdateCarrierPersonnelRequest {
    terminalId?: number;
    name?: string;
    personType?: string;
    email?: string;
    officePhoneNumber?: string;
    cellPhoneNumber?: string;
}

// Response payload
export interface CarrierPersonnelResponse extends CarrierPersonnel {
    terminalName: string;
    notes: {
        noteMessageId: number;
        noteThreadId: number;
        messageText: string;
        createdAt: Date;
        createdBy: number;
    }[];
}
