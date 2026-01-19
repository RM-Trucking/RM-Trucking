import { Connection } from 'odbc';
import { Zone, ZoneZip } from '../../entities/maintenance/Zone';
import {
    createZone,
    getAllZones,
    getZoneById,
    addZoneZip,
    getZoneZipsByZone,
    getAllZoneZips
} from '../../database/maintenance/zone';

export async function createZoneService(conn: Connection, zoneName: string): Promise<number> {
    return createZone(conn, zoneName);
}

export async function getAllZonesService(conn: Connection): Promise<Zone[]> {
    return getAllZones(conn);
}

export async function getZoneByIdService(conn: Connection, zoneId: number): Promise<Zone | null> {
    return getZoneById(conn, zoneId);
}

export async function addZoneZipService(
    conn: Connection,
    zoneId: number,
    zipCode?: string,
    rangeStart?: string,
    rangeEnd?: string
): Promise<number> {
    return addZoneZip(conn, zoneId, zipCode, rangeStart, rangeEnd);
}

export async function getZoneZipsByZoneService(conn: Connection, zoneId: number): Promise<ZoneZip[]> {
    return getZoneZipsByZone(conn, zoneId);
}

export async function getAllZoneZipsService(conn: Connection): Promise<ZoneZip[]> {
    return getAllZoneZips(conn);
}
