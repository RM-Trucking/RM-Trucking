import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";
import { NetworkShipment, NetworkShipmentCustomerInfo, NetworkShipmentShipperInfo, NetworkCommodityInfo, NetworkShipmentConsigneeInfo, NetworkHandlingUnitInfo, NetworkHandlingUnitItemInfo, NetworkHandlingUnitItemHazmatInfo, NetworkShipmentShipperConsigneeAirlineMapping } from "../../entities/shipment";
import { AddressDetail, AirlineDetails, CommodityDetails, ConsigneeDetails, CustomerDetails, HandlingUnitDetails, HazmatDetails, PalletDetails, PickupDetails, ShipmentDetails, ShipperDetails, Accessorial, LinehaulDetails, LinehaulPrimaryInfo, LinehaulCommonInfo, DeliveryPrimaryInfo, DeliveryCommonInfo, RateDetails, InvoiceDetails } from "../../entities/shipment/shipmentTypes";

function normalizeDateTimeValue(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return value as string | null;
}

export async function createNetworkShipment(
  conn: Connection,
  shipmentDetails: ShipmentDetails,
  userId: number
): Promise<NetworkShipment> {
  const query = `
    SELECT * FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Network_Shipment"
        ("typeOfShipment", "serviceLevel", "shipmentDate", "shipmentTime", "status", "createdBy", "createdAt")
      VALUES (?, ?, ?, ?, ?, ?, (CURRENT_TIMESTAMP - CURRENT TIMEZONE))
    )
  `;

  const shipmentDateValue = normalizeDateTimeValue(shipmentDetails.shipmentDate);
  const shipmentTimeValue = normalizeDateTimeValue(shipmentDetails.shipmentTime);

  const result = (await conn.query(query, [
    shipmentDetails.typeOfShipment,
    shipmentDetails.serviceLevel,
    shipmentDateValue,
    shipmentTimeValue,
    shipmentDetails.status,
    userId,
  ] as any[])) as unknown as NetworkShipment[];

  return result[0];
}

export async function createCustomerInfo(conn: Connection, customerDetails: CustomerDetails, shipmentId: number): Promise<NetworkShipmentCustomerInfo> {
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

export async function createShipperInfo(conn: Connection, shipperDetails: ShipperDetails): Promise<NetworkShipmentShipperInfo> {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Shipper_Info"
          ("shipperName", "addressLine1", "addressLine2", "city", "state", "zipCode", "contactPersonName", "phoneNumber","entityId")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    shipperDetails.shipperName.toLocaleUpperCase(),
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

export async function getShipperById(conn: Connection, shipperId: number): Promise<NetworkShipmentShipperInfo> {
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

export async function createConsigneeInfo(conn: Connection, consigneeDetails: ConsigneeDetails) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Consignee_Info"
          ("consigneeName", "addressLine1", "addressLine2", "city", "state", "zipCode", "contactPersonName", "phoneNumber","entityId")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    consigneeDetails.consigneeName.toLocaleUpperCase(),
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

export async function createAirlineInfo(conn: Connection, airlineDetails: AirlineDetails) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Airline"
          ("airlineNumber", "airlineCode", "airportCode", "airlineName", "addressLine1", "addressLine2", "city", "state", "zipCode", "contactPersonName", "phoneNumber", "entityId", "scenarioType")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    airlineDetails.phoneNumber ?? '',
    airlineDetails.contactPersonName ?? '',
    airlineDetails.entityId,
    airlineDetails.scenarioType
  ] as any) as unknown as any[];
  return result[0];
}

export async function createCommodityInfo(conn: Connection, commodityDetails: CommodityDetails, shipmentId: number) {
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

export async function createHandlingUnitInfo(conn: Connection, handlingUnitDetails: HandlingUnitDetails, shipmentId: number) {
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

export async function createHandlingUnitItemInfo(conn: Connection, itemDetails: PalletDetails, handlingUnitId: number) {
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

export async function createHandlingUnitItemHazmatInfo(conn: Connection, hazmatDetails: HazmatDetails, itemId: number) {
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


export async function createNetworkShipmentAddress(conn: Connection, addressDetails: AddressDetail) {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Network_Shipment_Address"
          ( "line1", "line2", "city", "state", "zipCode")
        VALUES (?, ?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    addressDetails.addressLine1,
    addressDetails.addressLine2 ?? '',
    addressDetails.city,
    addressDetails.state,
    addressDetails.zipCode
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentEntityAddressMapping(conn: Connection, entityId: number, addressId: number, addressType: 'FROM' | 'TO', locationType: 'PICKUP' | 'LINE_HAUL' | 'DELIVERY') {
  const query = `
       SELECT * FROM FINAL TABLE (
        INSERT INTO ${SCHEMA}."Entity_Network_Shipment_Address_Map"
          ( "entityId", "addressId", "addressType", "locationType")
        VALUES (?, ?, ?, ?)
       )
    `;
  const result = await conn.query(query, [
    entityId,
    addressId,
    addressType,
    locationType
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentPickupInfo(conn: Connection, pickupDetails: PickupDetails & { entityId: number }, shipmentId: number) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Pickup_Info"
      (
        "shipmentId",
        "entityId",
        "pickupRouting",
        "airportTransfer",
        "carrierId",
        "terminalId",
        "fromLocationType",
        "fromLocation",
        "fromLocationEntityId",
        "editFromLocation",
        "pickupAgentTerminal",
        "pickupAccessorial",
        "pickupAlert"
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  )`

  const result = await conn.query(query, [
    shipmentId,
    pickupDetails.entityId,
    pickupDetails.pickupRouting,
    pickupDetails.airportTransfer,
    pickupDetails.carrierId,
    pickupDetails.terminalId,
    pickupDetails.fromLocationType,
    pickupDetails.fromLocation,
    pickupDetails.fromLocationEntityId ?? null,
    pickupDetails.editFromLocation,
    pickupDetails.pickupAgentTerminal,
    pickupDetails.pickupAccessorial,
    pickupDetails.pickupAlert
  ] as any) as unknown as any[];

  return result[0];
}

export async function createNetworkShipmentPickupAgentTerminalInfo(conn: Connection, shipmentId: number, pickupAgentTerminalDetails: PickupDetails['pickupAgentTerminalDetails']) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Pickup_Agent_Terminal_Info"
      (
        "shipmentId",
        "toLocationType",
        "toLocation",
        "toLocationEntityId",
        "editToLocation"
      )
    VALUES (?, ?, ?, ?, ?)
  )`
  const result = await conn.query(query, [
    shipmentId,
    pickupAgentTerminalDetails?.toLocationType ?? null,
    pickupAgentTerminalDetails?.toLocation ?? null,
    pickupAgentTerminalDetails?.toLocationEntityId ?? null,
    pickupAgentTerminalDetails?.editToLocation ?? null
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentPickupAlertInfo(conn: Connection, shipmentId: number, pickupAlertDetails: PickupDetails['pickupAlertDetails']) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Pickup_Alert_Info"
      (
        "shipmentId",
        "inboundNotes",
        "primaryEmail",
        "additionalEmail"
      )
    VALUES (?, ?, ?, ?)
  )`
  const result = await conn.query(query, [
    shipmentId,
    pickupAlertDetails?.inboundNotes ?? null,
    pickupAlertDetails?.emailInfo?.primaryEmail ?? null,
    pickupAlertDetails?.emailInfo?.additionalEmails ? JSON.stringify(pickupAlertDetails.emailInfo.additionalEmails) : null
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentPickupAccessorial(conn: Connection, shipmentId: number, accessorial: Accessorial & { entityId: number, noteThreadId?: number | null }) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Pickup_Accessorial"
      (
        "shipmentId",
        "accessorialId",
        "accessorialName",
        "chargeType",
        "chargeValue",
        "entityId",
        "noteThreadId"
      )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  )`
  const result = await conn.query(query, [
    shipmentId,
    accessorial?.accessorialId ?? null,
    accessorial?.accessorialName ?? null,
    accessorial?.chargeType ?? null,
    accessorial?.chargeValue ?? null,
    accessorial?.entityId ?? null,
    accessorial?.noteThreadId ?? null
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentLinehaulPrimaryInfo(
  conn: Connection,
  shipmentId: number,
  linehaulInfo: LinehaulPrimaryInfo & { entityId: number }
) {

  console.log(linehaulInfo);
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Linehaul_Info"
      (
        "shipmentId",
        "entityId",
        "linehaulRouting",
        "carrierId",
        "terminalId",
        "carrierBillNumber",
        "editFromLocation",
        "fromLocationType",
        "fromLocation",
        "fromLocationEntityId",
        "editToLocation",
        "toLocationType",
        "toLocation",
        "toLocationEntityId",
        "etaDate",
        "etaTime",
        "pieces",
        "weight"
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  )`;

  const result = await conn.query(query, [
    shipmentId,
    linehaulInfo?.entityId ?? null,
    linehaulInfo?.linehaulRouting ?? null,
    linehaulInfo?.carrierId ?? null,
    linehaulInfo?.terminalId ?? null,
    linehaulInfo?.carrierBillNumber ?? null,
    linehaulInfo?.editFromLocation ?? null,
    linehaulInfo?.fromLocationType ?? null,
    linehaulInfo?.fromLocation ?? null,
    linehaulInfo?.fromLocationEntityId ?? null,
    linehaulInfo?.editToLocation ?? null,
    linehaulInfo?.toLocationType ?? null,
    linehaulInfo?.toLocation ?? null,
    linehaulInfo?.toLocationEntityId ?? null,
    linehaulInfo?.etaDate ?? null,
    linehaulInfo?.etaTime ?? null,
    linehaulInfo?.pieces ?? null,
    linehaulInfo?.weight ?? null
  ] as any) as unknown as any[];

  return result[0];
}


export async function createNetworkLinehaulCommonInfo(conn: Connection, shipmentId: number, linehaulCommonInfo: LinehaulCommonInfo) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Linehaul_Common_Info"
      (
        "shipmentId",
        "linehaulAccessorial",
        "linehaulNotes"
      )
    VALUES (?, ?, ?)
  )`;

  const result = await conn.query(query, [
    shipmentId,
    linehaulCommonInfo?.linehaulAccessorial ?? null,
    linehaulCommonInfo?.linehaulNotes ?? null
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentLinehaulAccessorial(conn: Connection, shipmentId: number, accessorial: Accessorial & { entityId: number, noteThreadId?: number | null }) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Linehaul_Accessorial"
      (
        "shipmentId",
        "accessorialId",
        "accessorialName",
        "chargeType",
        "chargeValue",
        "entityId",
        "noteThreadId"
      )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  )`
  const result = await conn.query(query, [
    shipmentId,
    accessorial?.accessorialId ?? null,
    accessorial?.accessorialName ?? null,
    accessorial?.chargeType ?? null,
    accessorial?.chargeValue ?? null,
    accessorial?.entityId ?? null,
    accessorial?.noteThreadId ?? null
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentDeliveryPrimaryInfo(
  conn: Connection,
  shipmentId: number,
  deliveryInfo: DeliveryPrimaryInfo & { entityId: number }
) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Delivery_Info"
      (
        "shipmentId",
        "entityId",
        "carrierId",
        "terminalId",
        "carrierBillNumber",
        "editFromLocation",
        "fromLocationType",
        "fromLocation",
        "fromLocationEntityId",
        "editToLocation",
        "toLocationType",
        "toLocation",
        "toLocationEntityId",
        "etaDate",
        "etaTime",
        "pieces",
        "weight"
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  )`;

  const result = await conn.query(query, [
    shipmentId,
    deliveryInfo?.entityId ?? null,
    deliveryInfo?.carrierId ?? null,
    deliveryInfo?.terminalId ?? null,
    deliveryInfo?.carrierBillNumber ?? null,
    deliveryInfo?.editFromLocation ?? null,
    deliveryInfo?.fromLocationType ?? null,
    deliveryInfo?.fromLocation ?? null,
    deliveryInfo?.fromLocationEntityId ?? null,
    deliveryInfo?.editToLocation ?? null,
    deliveryInfo?.toLocationType ?? null,
    deliveryInfo?.toLocation ?? null,
    deliveryInfo?.toLocationEntityId ?? null,
    deliveryInfo?.etaDate ?? null,
    deliveryInfo?.etaTime ?? null,
    deliveryInfo?.pieces ?? null,
    deliveryInfo?.weight ?? null
  ] as any) as unknown as any[];

  return result[0];
}

export async function createNetworkShipmentDeliveryCommonInfo(conn: Connection, shipmentId: number, deliveryCommonInfo: DeliveryCommonInfo) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Delivery_Common_Info"
      (
        "shipmentId",
        "deliveryAccessorial",
        "airportTransfer",
        "deliveryAlert"
      )
    VALUES (?, ?, ?, ?)
  )`;
  const result = await conn.query(query, [
    shipmentId,
    deliveryCommonInfo?.deliveryAccessorial ?? null,
    deliveryCommonInfo?.airportTransfer ?? null,
    deliveryCommonInfo?.deliveryAlert ?? null
  ] as any) as unknown as any[];
  return result[0];
}


export async function createNetworkShipmentDeliveryAccessorial(conn: Connection, shipmentId: number, accessorial: Accessorial & { entityId: number, noteThreadId?: number | null }) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Delivery_Accessorial"
      (
        "shipmentId",
        "accessorialId",
        "accessorialName",
        "chargeType",
        "chargeValue",
        "entityId",
        "noteThreadId"
      )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  )`
  const result = await conn.query(query, [
    shipmentId,
    accessorial?.accessorialId ?? null,
    accessorial?.accessorialName ?? null,
    accessorial?.chargeType ?? null,
    accessorial?.chargeValue ?? null,
    accessorial?.entityId ?? null,
    accessorial?.noteThreadId ?? null
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipementDeliveryAlertInfo(conn: Connection, shipmentId: number, deliveryAlertDetails: DeliveryCommonInfo['deliveryAlertDetails']) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Delivery_Alert_Info"
      (
        "shipmentId",
        "linehaulNotes",
        "deliveryNotes",
        "primaryEmail",
        "additionalEmail"
      )
    VALUES (?, ?, ?, ?, ?)
  )`;
  const result = await conn.query(query, [
    shipmentId,
    deliveryAlertDetails?.linehaulNotes ?? null,
    deliveryAlertDetails?.deliveryNotes ?? null,
    deliveryAlertDetails?.emailInfo?.primaryEmail ?? null,
    deliveryAlertDetails?.emailInfo?.additionalEmails ? JSON.stringify(deliveryAlertDetails.emailInfo.additionalEmails) : null
  ] as any) as unknown as any[];
  return result[0];
}

//Rate Details Creation Functions
export async function createNetworkShipmentRateInfo(conn: Connection, rateDetails: RateDetails) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Rate_Info"
      (
        "rateType",
        "multiplicationFactor",
        "multiplicationFactorUOM",
        "rateValue",
        "totalRate"
      )
    VALUES (?, ?, ?, ?, ?)
  )`;
  const result = await conn.query(query, [
    rateDetails.rateType,
    rateDetails.multiplicationFactor,
    rateDetails.multiplicationFactorUOM,
    rateDetails.rateValue,
    rateDetails.totalRate
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentInvoiceInfo(conn: Connection, invoiceDetails: InvoiceDetails) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Invoice_Info"
      (
        "shipmentId",
        "invoiceNumber",
        "invoiceType",
        "subTotalRate",
        "approvalStatus",
        "approvedBy",
        "approvedDate"
      )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  )`;
  const result = await conn.query(query, [
    invoiceDetails.shipmentId,
    invoiceDetails.invoiceNumber,
    invoiceDetails.invoiceType,
    invoiceDetails.subTotalRate,
    invoiceDetails.approvalStatus,
    invoiceDetails.approvedBy ?? null,
    invoiceDetails.approvedDate ?? null
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentInvoiceRateMapping(conn: Connection, invoiceId: number, rateId: number) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Invoice_Rate_Map"
      ("invoiceId",
       "rateId")
    VALUES (?, ?)
  )`;
  const result = await conn.query(query, [
    invoiceId,
    rateId
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentCarrierRateInfo(conn: Connection, shipmentId: number, pickupInvoiceId: number | null, linehaulInvoiceId: number | null, deliveryInvoiceId: number | null, totalCarrierRate: number) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Carrier_Rate_Info"
      ("shipmentId",
       "pickupInvoiceId",
       "linehaulInvoiceId",
       "deliveryInvoiceId",
       "totalCarrierRate")
    VALUES (?, ?, ?, ?, ?)
  )`;
  const result = await conn.query(query, [
    shipmentId,
    pickupInvoiceId,
    linehaulInvoiceId,
    deliveryInvoiceId,
    totalCarrierRate
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentCustomerRateInfo(conn: Connection, shipmentId: number, totalCustomerRate: number) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Customer_Rate_Info"
      ("shipmentId",
       "totalCustomerRate")
    VALUES (?, ?)
  )`;
  const result = await conn.query(query, [
    shipmentId,
    totalCustomerRate
  ] as any) as unknown as any[];
  return result[0];
}

export async function createNetworkShipmentCustomerRateMapping(conn: Connection, customerRateId: number, rateId: number) {
  const query = `
  SELECT * FROM FINAL TABLE (
    INSERT INTO ${SCHEMA}."Network_Shipment_Customer_Rate_Map"
      ("customerRateId",
       "rateId")
    VALUES (?, ?)
  )`;
  const result = await conn.query(query, [
    customerRateId,
    rateId
  ] as any) as unknown as any[];
  return result[0];
}

export async function getNetworkShipmentById(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment"
    WHERE "shipmentId" = ?
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentCustomerInfo(conn: Connection, shipmentId: number) {
  const query = `
    SELECT "nsci".*, "c"."customerName" , "s"."stationName"
    FROM ${SCHEMA}."Network_Shipment_Customer_Info" as "nsci"
    LEFT JOIN ${SCHEMA}."Customer" "c" ON "c"."customerId" = "nsci"."customerId"
    LEFT JOIN ${SCHEMA}."Station" "s" ON "s"."stationId" = "nsci"."stationId"
    WHERE "nsci"."shipmentId" = ?
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentShipperInfoByShipmentId(conn: Connection, shipmentId: number) {
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

export async function getNetworkShipmentConsigneeInfoByShipmentId(conn: Connection, shipmentId: number) {
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

export async function getNetworkShipmentAirlinesByShipmentId(conn: Connection, shipmentId: number) {
  const query = `
    SELECT a.* FROM ${SCHEMA}."Airline" a
    JOIN ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping" m
      ON m."entityId" = a."entityId"
    WHERE m."shipmentId" = ?
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result;
}

export async function getNetworkShipmentCommodityInfo(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Commodity_Info"
    WHERE "shipmentId" = ?
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
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

export async function getNetworkShipmentPickupInfoByShipmentId(conn: Connection, shipmentId: number) {
  const query = `
    SELECT "nspi".*, "c"."carrierName", "t"."terminalName"
    FROM ${SCHEMA}."Network_Shipment_Pickup_Info" as "nspi"
    LEFT JOIN ${SCHEMA}."Carrier" "c" ON "c"."carrierId" = "nspi"."carrierId"
    LEFT JOIN ${SCHEMA}."Terminal" "t" ON "t"."terminalId" = "nspi"."terminalId"
    WHERE "nspi"."shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentPickupAgentTerminalInfo(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Pickup_Agent_Terminal_Info"
    WHERE "shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentPickupAlertInfo(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Pickup_Alert_Info"
    WHERE "shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentPickupAccessorials(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Pickup_Accessorial"
    WHERE "shipmentId" = ?
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result;
}

export async function getNetworkShipmentLinehaulInfoByShipmentId(conn: Connection, shipmentId: number) {
  const query = `
    SELECT "nslhi".*, "c"."carrierName", "t"."terminalName"
    FROM ${SCHEMA}."Network_Shipment_Linehaul_Info" as "nslhi"
    LEFT JOIN ${SCHEMA}."Carrier" "c" ON "c"."carrierId" = "nslhi"."carrierId"
    LEFT JOIN ${SCHEMA}."Terminal" "t" ON "t"."terminalId" = "nslhi"."terminalId"
    WHERE "nslhi"."shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentLinehaulCommonInfo(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Linehaul_Common_Info"
    WHERE "shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentLinehaulAccessorials(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Linehaul_Accessorial"
    WHERE "shipmentId" = ?
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result;
}

export async function getNetworkShipmentDeliveryInfoByShipmentId(conn: Connection, shipmentId: number) {
  const query = `
    SELECT "nsdi".*, "c"."carrierName", "t"."terminalName" 
    FROM ${SCHEMA}."Network_Shipment_Delivery_Info" as "nsdi"
    LEFT JOIN ${SCHEMA}."Carrier" "c" ON "c"."carrierId" = "nsdi"."carrierId"
    LEFT JOIN ${SCHEMA}."Terminal" "t" ON "t"."terminalId" = "nsdi"."terminalId"
    WHERE "nsdi"."shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentDeliveryCommonInfo(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Delivery_Common_Info"
    WHERE "shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentDeliveryAccessorials(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Delivery_Accessorial"
    WHERE "shipmentId" = ?
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result;
}

export async function getNetworkShipmentDeliveryAlertInfo(conn: Connection, shipmentId: number) {
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
  locationType: 'PICKUP' | 'LINE_HAUL' | 'DELIVERY',
  addressType: 'FROM' | 'TO'
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
    zipCode: row.zipCode
  };
}

export async function getNetworkShipmentInvoiceInfoByShipmentIdAndType(conn: Connection, shipmentId: number, invoiceType: 'PICKUP' | 'LINE_HAUL' | 'DELIVERY') {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Invoice_Info"
    WHERE "shipmentId" = ?
      AND "invoiceType" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId, invoiceType]) as any[];
  return result[0];
}

export async function getNetworkShipmentInvoiceRateMapByInvoiceId(conn: Connection, invoiceId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Invoice_Rate_Map"
    WHERE "invoiceId" = ?
  `;
  const result = await conn.query(query, [invoiceId]) as any[];
  return result;
}

export async function getNetworkShipmentRateInfoByRateId(conn: Connection, rateId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Rate_Info"
    WHERE "rateId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [rateId]) as any[];
  return result[0];
}

export async function getNetworkShipmentCarrierRateInfoByShipmentId(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Carrier_Rate_Info"
    WHERE "shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentCustomerRateInfoByShipmentId(conn: Connection, shipmentId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Customer_Rate_Info"
    WHERE "shipmentId" = ?
    FETCH FIRST 1 ROW ONLY
  `;
  const result = await conn.query(query, [shipmentId]) as any[];
  return result[0];
}

export async function getNetworkShipmentCustomerRateMapByCustomerRateId(conn: Connection, customerRateId: number) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment_Customer_Rate_Map"
    WHERE "customerRateId" = ?
  `;
  const result = await conn.query(query, [customerRateId]) as any[];
  return result;
}

export async function getNetworkShipmentForms(conn: Connection) {
  const query = `
    SELECT * FROM ${SCHEMA}."Network_Shipment"
    ORDER BY "shipmentId" DESC
  `;
  const result = await conn.query(query) as any[];
  return result;
}

export async function getNetworkShipmentList(conn: Connection, page: number, limit: number) {
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

//Update Functions
export async function updateNetworkShipment(conn: Connection, shipmentId: number, shipmentDetails: Partial<ShipmentDetails>) {
  const fieldsToUpdate: string[] = [];
  const params: any[] = [];

  const validColumnName = /^[A-Za-z0-9_]+$/;

  for (const [key, value] of Object.entries(shipmentDetails)) {
    if (value === undefined) continue;

    if (key === 'shipmentId') continue;

    if (!validColumnName.test(key)) {
      throw new Error(`Invalid column name: ${key}`);
    }

    fieldsToUpdate.push(`"${key}" = ?`);

    const normalizedValue = (key === 'shipmentDate' || key === 'shipmentTime')
      ? normalizeDateTimeValue(value)
      : value;

    if (normalizedValue === null) {
      params.push(null);
    } else if (normalizedValue instanceof Date) {
      params.push(normalizedValue.toISOString());
    } else if (typeof normalizedValue === 'object') {
      params.push(JSON.stringify(normalizedValue));
    } else {
      params.push(normalizedValue);
    }
  }

  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields provided for update.');
  }

  params.push(shipmentId);

  const query = `
    UPDATE ${SCHEMA}."Network_Shipment"
    SET ${fieldsToUpdate.join(', ')}
    WHERE "shipmentId" = ?
  `;

  await conn.query(query, params);
}


export async function updateNetworkShipmentCustomerInfo(conn: Connection, shipmentId: number, customerDetails: Partial<CustomerDetails>) {
  const fieldsToUpdate: string[] = [];
  const params: any[] = [];

  const validColumnName = /^[A-Za-z0-9_]+$/;

  for (const [key, value] of Object.entries(customerDetails)) {
    if (value === undefined) continue;

    if (!validColumnName.test(key)) {
      throw new Error(`Invalid column name: ${key}`);
    }

    fieldsToUpdate.push(`"${key}" = ?`);

    if (value === null) {
      params.push(null);
    }
    else if (value instanceof Date) {
      params.push(value.toISOString());
    }
    else if (typeof value === 'object') {
      params.push(JSON.stringify(value));
    }
    else {
      params.push(value);
    }
  }

  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields provided for update.');
  }

  params.push(shipmentId);

  const query = `
    UPDATE ${SCHEMA}."Network_Shipment_Customer_Info"
    SET ${fieldsToUpdate.join(', ')}
    WHERE "shipmentId" = ?
  `;
  await conn.query(query, params);
}



// ✅ Check for unique fields in Shipper, Consignee, and Airline tables
export async function checkShipperUniqueFields(
  conn: Connection,
  { shipperName }:
    { shipperName?: string },
): Promise<string | null> {
  const queries: string[] = [];
  const params: (string | number)[] = [];

  if (shipperName) {
    queries.push(`SELECT 'shipperName' AS "conflictField" FROM "${SCHEMA}"."Network_Shipment_Shipper_Info" WHERE "shipperName" = ?`);
    params.push(shipperName.toLocaleUpperCase());
  }

  if (queries.length === 0) return null;

  const query = queries.join(' UNION ALL ');

  const result = await conn.query(query, params) as { conflictField: string }[];
  return result.length ? result[0].conflictField : null;
}

export async function checkConsigneeUniqueFields(
  conn: Connection,
  { consigneeName }:
    { consigneeName?: string },
): Promise<string | null> {
  const queries: string[] = [];
  const params: (string | number)[] = [];

  if (consigneeName) {
    queries.push(`SELECT 'consigneeName' AS "conflictField" FROM "${SCHEMA}"."Network_Shipment_Consignee_Info" WHERE "consigneeName" = ?`);
    params.push(consigneeName.toLocaleUpperCase());
  }

  if (queries.length === 0) return null;

  const query = queries.join(' UNION ALL ');

  const result = await conn.query(query, params) as { conflictField: string }[];
  return result.length ? result[0].conflictField : null;
}

export async function checkAirlineUniqueFields(
  conn: Connection,
  airlineNumber: number,
  airlineCode: string,
  scenarioType: string
): Promise<string | null> {
  const query = `
    SELECT 'airlineNumber' AS "conflictField" 
    FROM "${SCHEMA}"."Airline" 
    WHERE "airlineNumber" = ? AND "scenarioType" = ?
    UNION ALL
    SELECT 'airlineCode' AS "conflictField" 
    FROM "${SCHEMA}"."Airline" 
    WHERE "airlineCode" = ? AND "scenarioType" = ?
  `;

  const result = await conn.query(query, [airlineNumber, scenarioType, airlineCode, scenarioType]) as { conflictField: string }[];
  return result.length ? result[0].conflictField : null;
}

