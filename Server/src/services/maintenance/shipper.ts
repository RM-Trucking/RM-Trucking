import { Connection } from 'odbc';
import { NetworkShipmentShipperInfo } from '../../entities/shipment';
import * as shipperDB from '../../database/maintenance/shipper';

export async function getShipperInfoDropdown(conn: Connection, searchTerm: string): Promise<NetworkShipmentShipperInfo[]> {
    return await shipperDB.getShipperInfoDropdown(conn, searchTerm);
}