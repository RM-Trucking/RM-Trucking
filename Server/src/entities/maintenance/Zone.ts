import { NoteMessage } from "./Note";

export interface Zone {
    zoneId: number;
    zoneName: string;
    noteThreadId: number;
    entityId: number;
    createdAt: Date;
    createdBy: number;
    updatedAt?: Date;
    updatedBy?: number;
    activeStatus: 'Y' | 'N';
}

export interface ZoneZip {
    zoneZipId: number;
    zoneId: number;
    zipCode?: string | null;
    rangeStart?: string | null;
    rangeEnd?: string | null;
}

export interface CreateZoneRequest {
    zoneName: string;
    zipCodes?: string[];
    ranges?: string[];
    note?: { messageText: string };
}

export interface UpdateZoneRequest {
    zoneName?: string;
    activeStatus?: 'Y' | 'N';
}

export interface ZoneResponse extends Zone {
    zips: ZoneZip[];
    notes?: NoteMessage[];
}
