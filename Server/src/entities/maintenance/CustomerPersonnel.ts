export interface CustomerPersonnel {
    personnelId: number;          // Unique identifier (PK)
    stationId: number;            // FK → Station
    departmentId: number;         // FK → Department
    name: string;                 // Full name of the personnel
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
export interface CreateCustomerPersonnelRequest {
    stationId: number;
    departmentId: number;
    name: string;
    email: string;
    officePhoneNumber?: string;
    cellPhoneNumber?: string;
    note?: { messageText: string };
}

// Request payload for updating personnel
export interface UpdateCustomerPersonnelRequest {
    stationId?: number;
    departmentId?: number;
    name?: string;
    email?: string;
    officePhoneNumber?: string;
    cellPhoneNumber?: string;
}

// Response payload
export interface CustomerPersonnelResponse extends CustomerPersonnel {
    stationName: string;
    departmentName: string;
    notes: {
        noteMessageId: number;
        noteThreadId: number;
        messageText: string;
        createdAt: Date;
        createdBy: number;
    }[];
}
