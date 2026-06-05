import { Connection } from 'odbc';
import { NetworkShipmentShipperInfo } from '../../entities/shipment';
import { SCHEMA } from '../../config/db2';


export async function getShipperInfoDropdown(conn: Connection, searchTerm: string): Promise<NetworkShipmentShipperInfo[]> {
    let query = `
    SELECT *
    FROM ${SCHEMA}."Network_Shipment_Shipper_Info"
    ORDER BY "shipperName"
  `;
    const params: any[] = [];

    if (searchTerm && searchTerm.trim() !== '') {
        query += ` WHERE LOWER("shipperName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }


    const result = await conn.query(query, params) as any[];
    return result as NetworkShipmentShipperInfo[];
}