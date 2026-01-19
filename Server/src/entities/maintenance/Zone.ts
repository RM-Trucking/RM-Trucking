export interface Zone {
    zoneId: number;
    zoneName: string;
}

export interface ZoneZip {
    zoneZipId: number;
    zoneId: number;
    zipCode?: string;
    rangeStart?: string;
    rangeEnd?: string;
}
