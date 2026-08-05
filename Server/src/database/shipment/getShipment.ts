import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";

export async function getShipmentById(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentCustomerInfo(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Customer_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentCommodityInfo(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Commodity_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentShipperInfoByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT s.* FROM ${SCHEMA}."Network_Shipment_Shipper_Info" s
        JOIN ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping" m
          ON m."entityId" = s."entityId"
        WHERE m."shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentConsigneeInfoByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT c.* FROM ${SCHEMA}."Network_Shipment_Consignee_Info" c
        JOIN ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping" m
          ON m."entityId" = c."entityId"
        WHERE m."shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentAirlinesByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT a.* FROM ${SCHEMA}."Airline" a
        JOIN ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping" m
          ON m."entityId" = a."entityId"
        WHERE m."shipmentId" = ?
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result;
}

export async function getHandlingUnitsByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Handling_Unit"
        WHERE "shipmentId" = ?
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result;
}

export async function getHandlingUnitItemsByHandlingUnitId(conn: Connection, handlingUnitId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item"
        WHERE "handlingUnitId" = ?
    `;

    const result = await conn.query(query, [handlingUnitId]) as any[];
    return result;
}

export async function getHazmatInfoByItemId(conn: Connection, itemId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item_Hazmat_Info"
        WHERE "itemId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [itemId]) as any[];
    return result[0];
}

export async function getShipmentPickupInfoByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT "nspi".*, "c"."carrierName", "t"."terminalName"
        FROM ${SCHEMA}."Network_Shipment_Pickup_Info" AS "nspi"
        LEFT JOIN ${SCHEMA}."Carrier" "c" ON "c"."carrierId" = "nspi"."carrierId"
        LEFT JOIN ${SCHEMA}."Terminal" "t" ON "t"."terminalId" = "nspi"."terminalId"
        WHERE "nspi"."shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentPickupAgentTerminalInfo(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Pickup_Agent_Terminal_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentPickupAlertInfo(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Pickup_Alert_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentPickupAccessorials(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Pickup_Accessorial"
        WHERE "shipmentId" = ?
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result;
}

export async function getShipmentLinehaulInfoByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT "nslhi".*, "c"."carrierName", "t"."terminalName"
        FROM ${SCHEMA}."Network_Shipment_Linehaul_Info" AS "nslhi"
        LEFT JOIN ${SCHEMA}."Carrier" "c" ON "c"."carrierId" = "nslhi"."carrierId"
        LEFT JOIN ${SCHEMA}."Terminal" "t" ON "t"."terminalId" = "nslhi"."terminalId"
        WHERE "nslhi"."shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentLinehaulCommonInfo(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Linehaul_Common_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentLinehaulAccessorials(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Linehaul_Accessorial"
        WHERE "shipmentId" = ?
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result;
}

export async function getShipmentDeliveryInfoByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT "nsdi".*, "c"."carrierName", "t"."terminalName"
        FROM ${SCHEMA}."Network_Shipment_Delivery_Info" AS "nsdi"
        LEFT JOIN ${SCHEMA}."Carrier" "c" ON "c"."carrierId" = "nsdi"."carrierId"
        LEFT JOIN ${SCHEMA}."Terminal" "t" ON "t"."terminalId" = "nsdi"."terminalId"
        WHERE "nsdi"."shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentDeliveryCommonInfo(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Delivery_Common_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentDeliveryAccessorials(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Delivery_Accessorial"
        WHERE "shipmentId" = ?
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result;
}

export async function getShipmentDeliveryAlertInfo(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Delivery_Alert_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getAddressByShipmentIdLocationTypeAddressType(
    conn: Connection,
    entityId: number,
    locationType: "PICKUP" | "LINE_HAUL" | "DELIVERY",
    addressType: "FROM" | "TO"
) {
    const query = `
        SELECT a.* FROM ${SCHEMA}."Network_Shipment_Address" a
        JOIN ${SCHEMA}."Entity_Network_Shipment_Address_Map" m
          ON m."addressId" = a."addressId"
        WHERE m."entityId" = ?
          AND m."locationType" = ?
          AND m."addressType" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [entityId, locationType, addressType]) as any[];
    const row = result[0];
    if (!row) return null;

    return {
        addressLine1: row.line1,
        addressLine2: row.line2,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
    };
}

export async function getShipmentInvoiceInfoByShipmentIdAndType(
    conn: Connection,
    shipmentId: number,
    invoiceType: "PICKUP" | "LINE_HAUL" | "DELIVERY"
) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Invoice_Info"
        WHERE "shipmentId" = ?
          AND "invoiceType" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId, invoiceType]) as any[];
    return result[0];
}

export async function getShipmentInvoiceRateMapByInvoiceId(conn: Connection, invoiceId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Invoice_Rate_Map"
        WHERE "invoiceId" = ?
    `;

    const result = await conn.query(query, [invoiceId]) as any[];
    return result;
}

export async function getShipmentRateInfoByRateId(conn: Connection, rateId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Rate_Info"
        WHERE "rateId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [rateId]) as any[];
    return result[0];
}

export async function getShipmentCarrierRateInfoByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Carrier_Rate_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentCustomerRateInfoByShipmentId(conn: Connection, shipmentId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Customer_Rate_Info"
        WHERE "shipmentId" = ?
        FETCH FIRST 1 ROW ONLY
    `;

    const result = await conn.query(query, [shipmentId]) as any[];
    return result[0];
}

export async function getShipmentCustomerRateMapByCustomerRateId(conn: Connection, customerRateId: number) {
    const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Customer_Rate_Map"
        WHERE "customerRateId" = ?
    `;

    const result = await conn.query(query, [customerRateId]) as any[];
    return result;
}

export async function getShipmentList(conn: Connection, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const countQuery = `
        SELECT COUNT(*) AS "totalItems"
        FROM ${SCHEMA}."Network_Shipment"
    `;

    const countResult = await conn.query(countQuery) as any[];
    const totalItems = Number(countResult[0]?.totalItems ?? 0);

    const query = `
        SELECT
          "shipmentId",
          "typeOfShipment",
          "serviceLevel",
          "shipmentDate",
          "shipmentTime",
          "createdBy",
          "createdAt"
        FROM ${SCHEMA}."Network_Shipment"
        ORDER BY "shipmentId" DESC
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY
    `;

    const result = await conn.query(query, [offset, limit]) as any[];
    return { totalItems, rows: result };
}
