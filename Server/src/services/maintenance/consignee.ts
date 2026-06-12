import * as consigneeDB from '../../database/maintenance/consignee';
import { Connection } from 'odbc';
import { NetworkShipmentConsigneeInfo } from '../../entities/shipment';

export async function getConsigneeInfoDropdown(conn: Connection, searchTerm: string): Promise<NetworkShipmentConsigneeInfo[]> {
    return await consigneeDB.getConsigneeInfoDropdown(conn, searchTerm);
}