import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";
import { NetworkShipment, CreateNetworkShipmentRequest, NetworkShipmentCustomerInfo, NetworkShipmentShipperInfo, NetworkCommodityInfo, NetworkShipmentConsigneeInfo, NetworkHandlingUnitInfo, NetworkHandlingUnitItemInfo, NetworkHandlingUnitItemHazmatInfo, CreateItemHazmatDetails, CreateItemDetails, CreateHandlingUnitDetails, CreateCommodityDetails, CreateShipperDetails, CreateConsigneeDetails, CreateCustomerDetails, CreateShipmentDetails, NetworkShipmentShipperConsigneeAirlineMapping } from "../../entities/shipment";

export async function createNetworkShipment(
  conn: Connection,
  shipmentDetails: CreateShipmentDetails,
  userId: number
): Promise<NetworkShipment> {
  const query = `
    SELECT * FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Network_Shipment"
        ("typeOfShipment", "serviceLevel", "shipmentDate", "shipmentTime", "createdBy", "createdAt")
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    )
  `;

  const result = (await conn.query(query, [
    shipmentDetails.typeOfShipment,
    shipmentDetails.serviceLevel,
    shipmentDetails.shipmentDate,
    shipmentDetails.shipmentTime,
    userId,
  ] as any[])) as unknown as NetworkShipment[];

  return result[0];
}

export async function createCustomerInfo(conn: Connection, customerDetails: CreateCustomerDetails, shipmentId: number): Promise<NetworkShipmentCustomerInfo> {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Customer_Info"
          ("shipmentId", "customerId", "stationId", "airportPickupService", "originAirportCode", "airportDeliveryService", "destinationAirportCode")
        VALUES (?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    shipmentId,
    customerDetails.customerId,
    customerDetails.stationId,
    customerDetails.airportPickupService,
    customerDetails.originAirportCode,
    customerDetails.airportDeliveryService,
    customerDetails.destinationAirportCode
  ]) as unknown as NetworkShipmentCustomerInfo[];

  return result[0];

}

export async function createShipperInfo(conn: Connection, shipperDetails: CreateShipperDetails) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Shipper_Info"
          ("shipperName", "addressLine1", "addressLine2", "city", "state", "zipCode", "contactPersonName", "phoneNumber","entityId")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    shipperDetails.shipperName,
    shipperDetails.addressLine1,
    shipperDetails.addressLine2 ?? '',
    shipperDetails.city,
    shipperDetails.state,
    shipperDetails.zipCode,
    shipperDetails.contactPersonName,
    shipperDetails.phoneNumber,
    shipperDetails.entityId
  ] as any) as unknown as NetworkShipmentShipperInfo[];
  return result[0];
}

export async function getShipperById(conn: Connection, shipperId: number) {
  const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Shipper_Info"
        WHERE "shipperId" = ?
    `;
  const result = await conn.query(query, [shipperId]) as any[];
  return result[0];
}

export async function createShipperConsigneeAirlineMapping(conn: Connection, shipmentId: number, entityId: number) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping"
          ("shipmentId", "entityId")
        VALUES (?, ?)
        )
    `;
  const result = await conn.query(query, [
    shipmentId,
    entityId
  ] as any) as unknown as NetworkShipmentShipperConsigneeAirlineMapping[];
  return result[0];
}

export async function createConsigneeInfo(conn: Connection, consigneeDetails: CreateConsigneeDetails) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Consignee_Info"
          ("consigneeName", "addressLine1", "addressLine2", "city", "state", "zipCode", "contactPersonName", "phoneNumber","entityId")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    consigneeDetails.consigneeName,
    consigneeDetails.addressLine1,
    consigneeDetails.addressLine2 ?? '',
    consigneeDetails.city,
    consigneeDetails.state,
    consigneeDetails.zipCode,
    consigneeDetails.contactPersonName,
    consigneeDetails.phoneNumber,
    consigneeDetails.entityId
  ] as any) as unknown as NetworkShipmentConsigneeInfo[];
  return result[0];
}

export async function getConsigneeById(conn: Connection, consigneeId: number) {
  const query = `
        SELECT * FROM ${SCHEMA}."Network_Shipment_Consignee_Info"
        WHERE "consigneeId" = ?
    `;
  const result = await conn.query(query, [consigneeId]) as any[];
  return result[0];
}

export async function createAirlineInfo(conn: Connection, airlineDetails: any) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Airline"
          ("airlineNumber", "airlineCode", "airportCode", "airlineName", "addressLine1", "addressLine2", "city", "state", "zipCode", "handler", "phoneNumber", "entityId")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    airlineDetails.airlineNumber,
    airlineDetails.airlineCode,
    airlineDetails.airportCode,
    airlineDetails.airlineName,
    airlineDetails.addressLine1 ?? '',
    airlineDetails.addressLine2 ?? '',
    airlineDetails.city,
    airlineDetails.state ?? '',
    airlineDetails.zipCode ?? '',
    airlineDetails.handler ?? '',
    airlineDetails.phoneNumber ?? '',
    airlineDetails.entityId
  ] as any) as unknown as any[];
  return result[0];
}

export async function createCommodityInfo(conn: Connection, commodityDetails: CreateCommodityDetails, shipmentId: number) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Commodity_Info"
          ("shipmentId", "emergencyContactName", "emergencyContactPhone")
        VALUES (?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    shipmentId,
    commodityDetails.emergencyContactName,
    commodityDetails.emergencyContactPhone
  ] as any) as unknown as NetworkCommodityInfo[];
  return result[0];
}

export async function createHandlingUnitInfo(conn: Connection, handlingUnitDetails: CreateHandlingUnitDetails, shipmentId: number) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Handling_Unit"
          ("shipmentId", "handlingUnitUOM", "handlingUnits", "unit", "handlingLength", "handlingWidth", "handlingHeight", "handlingWeight", "handlingWeightUnit", "class")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    shipmentId,
    handlingUnitDetails.handlingUnitUOM,
    handlingUnitDetails.handlingUnits,
    handlingUnitDetails.unit,
    handlingUnitDetails.handlingLength,
    handlingUnitDetails.handlingWidth,
    handlingUnitDetails.handlingHeight,
    handlingUnitDetails.handlingWeight,
    handlingUnitDetails.handlingWeightUnit,
    handlingUnitDetails.class
  ] as any) as unknown as NetworkHandlingUnitInfo[];
  return result[0];
}

export async function createHandlingUnitItemInfo(conn: Connection, itemDetails: CreateItemDetails, handlingUnitId: number) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Handling_Unit_Item"
          ("handlingUnitId", "pieces", "piecesUOM", "description", "hazmat")
        VALUES (?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    handlingUnitId,
    itemDetails.pieces,
    itemDetails.piecesUOM,
    itemDetails.description,
    itemDetails.hazmat
  ] as any) as unknown as NetworkHandlingUnitItemInfo[];
  return result[0];
}

export async function createHandlingUnitItemHazmatInfo(conn: Connection, hazmatDetails: CreateItemHazmatDetails, itemId: number) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Handling_Unit_Item_Hazmat_Info"
          ("itemId", "unNumber", "properShippingName", "hazardClass", "packingGroup", "weight", "technicalName", "contactPhoneNumber", "hazmatDescription", "limitedQuantity", "marinePollutant", "residueLastContained", "reportableQuantity", "dotExemption")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    itemId,
    hazmatDetails.unNumber,
    hazmatDetails.properShippingName,
    hazmatDetails.hazardClass,
    hazmatDetails.packingGroup,
    hazmatDetails.weight,
    hazmatDetails.technicalName,
    hazmatDetails.contactPhoneNumber,
    hazmatDetails.hazmatDescription,
    hazmatDetails.limitedQuantity,
    hazmatDetails.marinePollutant,
    hazmatDetails.residueLastContained,
    hazmatDetails.reportableQuantity,
    hazmatDetails.dotExemption
  ] as any) as unknown as NetworkHandlingUnitItemHazmatInfo[];
  return result[0];
}