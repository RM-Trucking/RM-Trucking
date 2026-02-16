import { NoteMessageResponse } from "./Note";

// -------------------- Zone Entities --------------------
export interface Zone {
    zoneId: number;              // PK
    zoneName: string;            // Name of the zone
    noteThreadId: number;        // FK → Note_Thread
    entityId: number;            // FK → Entity
    createdAt: Date;             // Record creation timestamp
    createdBy: number;           // FK → User.userId
    updatedAt?: Date;            // Record last update timestamp
    updatedBy?: number;          // FK → User.userId
    activeStatus: 'Y' | 'N';     // Enum (Y/N)
}

export interface ZoneZip {
    zoneZipId: number;           // PK
    zoneId: number;              // FK → Zone
    zipCode?: string | null;     // Individual zip code
    rangeStart?: string | null;  // Starting zip code in range
    rangeEnd?: string | null;    // Ending zip code in range
}

// -------------------- API Contracts --------------------
export interface CreateZoneRequest {
    zoneName: string;
    zipCodes?: string[];              // e.g. ["560001", "560002"]
    ranges?: string[];                // e.g. ["560050-560099"]
    note?: { messageText: string };   // optional note
}

export interface UpdateZoneRequest {
    zoneName?: string;
    activeStatus?: 'Y' | 'N';
}

// -------------------- Normalized Response --------------------
export interface ZoneResponse {
    zoneId: number;
    noteThreadId: number;
    entityId: number;
    zoneName: string;
    zipCodes: string[];
    ranges: string[];
    notes?: NoteMessageResponse[];
    activeStatus: 'Y' | 'N';
    createdAt: Date;
    createdBy: string;   // userName instead of userId
    updatedAt?: Date;
    updatedBy?: string;  // userName instead of userId
    rateCount?: number; // number of transport rates associated with this zone
}

export interface ZoneInfo {
    zoneId: number;
    zoneName: string;
    zipCodes: string[];
    ranges: string[];
}
