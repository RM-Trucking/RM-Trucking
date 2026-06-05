import { Connection } from "odbc";
import { NetworkShipmentConsigneeInfo } from "../../entities/shipment";
import { SCHEMA } from "../../config/db2";

export async function getConsigneeInfoDropdown(conn: Connection, searchTerm: string): Promise<NetworkShipmentConsigneeInfo[]> {
    let query = `
    SELECT *
    FROM ${SCHEMA}."Network_Shipment_Consignee_Info"
    ORDER BY "consigneeName"
  `;
    const params: any[] = [];
    if (searchTerm && searchTerm.trim() !== '') {
        query += ` WHERE LOWER("consigneeName") LIKE ?`;
        params.push(`%${searchTerm.toLowerCase()}%`);
    }
    const result = await conn.query(query, params) as any[];
    return result as NetworkShipmentConsigneeInfo[];
}