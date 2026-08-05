import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";
import {
    NetworkShipment,
    NetworkShipmentCustomerInfo, NetworkShipmentCutomerReferenceNumber, NetworkShipmentShipperInfo,
    NetworkCommodityInfo,
    NetworkShipmentConsigneeInfo,
    NetworkHandlingUnitInfo,
    NetworkHandlingUnitItemInfo,
    NetworkHandlingUnitItemHazmatInfo,
    NetworkShipmentShipperConsigneeAirlineMapping,
} from "../../entities/shipment";
import {
    AddressDetail,
    AirlineDetails,
    CommodityDetails,
    ConsigneeDetails,
    CustomerDetails,
    HandlingUnitDetails,
    HazmatDetails,
    PalletDetails,
    PickupDetails,
    ShipmentDetails,
    ShipperDetails,
    Accessorial,
    LinehaulPrimaryInfo,
    LinehaulCommonInfo,
    DeliveryPrimaryInfo,
    DeliveryCommonInfo,
    RateDetails,
    InvoiceDetails,
} from "../../entities/shipment/shipmentTypes";

type SqlValue = unknown | { raw: string };

function isSqlExpression(value: SqlValue): value is { raw: string } {
    return typeof value === "object" && value !== null && "raw" in value;
}

function normalizeDateTimeValue(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
    }
    return value as string | null;
}

async function insertWithReturning<T = any>(
    conn: Connection,
    tableName: string,
    data: Record<string, SqlValue>
): Promise<T> {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    const columnNames = entries.map(([column]) => `"${column}"`).join(", ");
    const placeholders = entries.map(([, value]) => (isSqlExpression(value) ? value.raw : "?")).join(", ");
    const query = `
    SELECT * FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}.${tableName}
        (${columnNames})
      VALUES (${placeholders})
    )
  `;

    const values = entries.map(([, value]) => (isSqlExpression(value) ? undefined : value));
    const result = (await conn.query(query, values.filter((value) => value !== undefined) as any[])) as unknown as T[];
    return result[0];
}

export async function createNetworkShipment(
    conn: Connection,
    shipmentDetails: ShipmentDetails,
    userId: number
): Promise<NetworkShipment> {
    const payload: Record<string, SqlValue> = {
        typeOfShipment: shipmentDetails.typeOfShipment,
        serviceLevel: shipmentDetails.serviceLevel,
        shipmentDate: normalizeDateTimeValue(shipmentDetails.shipmentDate),
        shipmentTime: normalizeDateTimeValue(shipmentDetails.shipmentTime),
        status: shipmentDetails.status,
        createdBy: userId,
        createdAt: { raw: "(CURRENT_TIMESTAMP - CURRENT TIMEZONE)" },
    };

    return insertWithReturning<NetworkShipment>(conn, '"Network_Shipment"', payload);
}

export async function createCustomerInfo(
    conn: Connection,
    customerDetails: CustomerDetails,
    shipmentId: number
): Promise<NetworkShipmentCustomerInfo> {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        customerId: customerDetails.customerId,
        stationId: customerDetails.stationId,
        airportPickupService: customerDetails.airportPickupService,
        originAirportCode: customerDetails.originAirportCode,
        airportDeliveryService: customerDetails.airportDeliveryService,
        destinationAirportCode: customerDetails.destinationAirportCode,
    };

    return insertWithReturning<NetworkShipmentCustomerInfo>(conn, '"Network_Shipment_Customer_Info"', payload);
}

export async function createNetworkShipmentCustomerReferenceNumber(
    conn: Connection,
    shipmentId: number,
    referenceNumberDetails: {
        referenceType?: string;
        referenceNumber?: string;
    }
): Promise<NetworkShipmentCutomerReferenceNumber> {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        referenceType: referenceNumberDetails.referenceType,
        referenceNumber: referenceNumberDetails.referenceNumber,
    };

    return insertWithReturning<NetworkShipmentCutomerReferenceNumber>(
        conn,
        '"Network_Shipment_Customer_Reference_Number"',
        payload
    );
}

export async function createShipperInfo(
    conn: Connection,
    shipperDetails: ShipperDetails
): Promise<NetworkShipmentShipperInfo> {
    const payload: Record<string, SqlValue> = {
        shipperName: shipperDetails.shipperName?.toLocaleUpperCase(),
        addressLine1: shipperDetails.addressLine1,
        addressLine2: shipperDetails.addressLine2 ?? "",
        city: shipperDetails.city,
        state: shipperDetails.state,
        zipCode: shipperDetails.zipCode,
        contactPersonName: shipperDetails.contactPersonName,
        phoneNumber: shipperDetails.phoneNumber,
        entityId: shipperDetails.entityId,
    };

    return insertWithReturning<NetworkShipmentShipperInfo>(conn, '"Network_Shipment_Shipper_Info"', payload);
}

export async function createShipperConsigneeAirlineMapping(
    conn: Connection,
    shipmentId: number,
    entityId: number
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        entityId,
    };

    return insertWithReturning<NetworkShipmentShipperConsigneeAirlineMapping>(
        conn,
        '"Network_Shipment_Shipper_Consignee_Airline_Mapping"',
        payload
    );
}

export async function createConsigneeInfo(conn: Connection, consigneeDetails: ConsigneeDetails) {
    const payload: Record<string, SqlValue> = {
        consigneeName: consigneeDetails.consigneeName?.toLocaleUpperCase(),
        addressLine1: consigneeDetails.addressLine1,
        addressLine2: consigneeDetails.addressLine2 ?? "",
        city: consigneeDetails.city,
        state: consigneeDetails.state,
        zipCode: consigneeDetails.zipCode,
        contactPersonName: consigneeDetails.contactPersonName,
        phoneNumber: consigneeDetails.phoneNumber,
        entityId: consigneeDetails.entityId,
    };

    return insertWithReturning<NetworkShipmentConsigneeInfo>(conn, '"Network_Shipment_Consignee_Info"', payload);
}

export async function createAirlineInfo(conn: Connection, airlineDetails: AirlineDetails) {
    const payload: Record<string, SqlValue> = {
        airlineNumber: airlineDetails.airlineNumber,
        airlineCode: airlineDetails.airlineCode,
        airportCode: airlineDetails.airportCode,
        airlineName: airlineDetails.airlineName,
        addressLine1: airlineDetails.addressLine1 ?? "",
        addressLine2: airlineDetails.addressLine2 ?? "",
        city: airlineDetails.city,
        state: airlineDetails.state ?? "",
        zipCode: airlineDetails.zipCode ?? "",
        contactPersonName: airlineDetails.phoneNumber ?? "",
        phoneNumber: airlineDetails.contactPersonName ?? "",
        entityId: airlineDetails.entityId,
        scenarioType: airlineDetails.scenarioType,
    };

    return insertWithReturning(conn, '"Airline"', payload);
}

export async function createCommodityInfo(conn: Connection, commodityDetails: CommodityDetails, shipmentId: number) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        emergencyContactName: commodityDetails.emergencyContactName,
        emergencyContactPhone: commodityDetails.emergencyContactPhone,
    };

    return insertWithReturning<NetworkCommodityInfo>(conn, '"Network_Shipment_Commodity_Info"', payload);
}

export async function createHandlingUnitInfo(conn: Connection, handlingUnitDetails: HandlingUnitDetails, shipmentId: number) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        handlingUnitUOM: handlingUnitDetails.handlingUnitUOM,
        handlingUnits: handlingUnitDetails.handlingUnits,
        unit: handlingUnitDetails.unit,
        handlingLength: handlingUnitDetails.handlingLength,
        handlingWidth: handlingUnitDetails.handlingWidth,
        handlingHeight: handlingUnitDetails.handlingHeight,
        handlingWeight: handlingUnitDetails.handlingWeight,
        handlingWeightUnit: handlingUnitDetails.handlingWeightUnit,
        class: handlingUnitDetails.class,
    };

    return insertWithReturning<NetworkHandlingUnitInfo>(conn, '"Network_Shipment_Handling_Unit"', payload);
}

export async function createHandlingUnitItemInfo(conn: Connection, itemDetails: PalletDetails, handlingUnitId: number) {
    const payload: Record<string, SqlValue> = {
        handlingUnitId,
        pieces: itemDetails.pieces,
        piecesUOM: itemDetails.piecesUOM,
        description: itemDetails.description,
        hazmat: itemDetails.hazmat,
    };

    return insertWithReturning<NetworkHandlingUnitItemInfo>(conn, '"Network_Shipment_Handling_Unit_Item"', payload);
}

export async function createHandlingUnitItemHazmatInfo(conn: Connection, hazmatDetails: HazmatDetails, itemId: number) {
    const payload: Record<string, SqlValue> = {
        itemId,
        unNumber: hazmatDetails.unNumber,
        properShippingName: hazmatDetails.properShippingName,
        hazardClass: hazmatDetails.hazardClass,
        packingGroup: hazmatDetails.packingGroup,
        weight: hazmatDetails.weight,
        technicalName: hazmatDetails.technicalName,
        contactPhoneNumber: hazmatDetails.contactPhoneNumber,
        hazmatDescription: hazmatDetails.hazmatDescription,
        limitedQuantity: hazmatDetails.limitedQuantity,
        marinePollutant: hazmatDetails.marinePollutant,
        residueLastContained: hazmatDetails.residueLastContained,
        reportableQuantity: hazmatDetails.reportableQuantity,
        dotExemption: hazmatDetails.dotExemption,
    };

    return insertWithReturning<NetworkHandlingUnitItemHazmatInfo>(conn, '"Network_Shipment_Handling_Unit_Item_Hazmat_Info"', payload);
}

export async function createNetworkShipmentAddress(conn: Connection, addressDetails: AddressDetail) {
    const payload: Record<string, SqlValue> = {
        line1: addressDetails.addressLine1,
        line2: addressDetails.addressLine2 ?? "",
        city: addressDetails.city,
        state: addressDetails.state,
        zipCode: addressDetails.zipCode,
    };

    return insertWithReturning(conn, '"Network_Shipment_Address"', payload);
}

export async function createNetworkShipmentEntityAddressMapping(
    conn: Connection,
    entityId: number,
    addressId: number,
    addressType: "FROM" | "TO",
    locationType: "PICKUP" | "LINE_HAUL" | "DELIVERY"
) {
    const payload: Record<string, SqlValue> = {
        entityId,
        addressId,
        addressType,
        locationType,
    };

    return insertWithReturning(conn, '"Entity_Network_Shipment_Address_Map"', payload);
}

export async function createNetworkShipmentPickupInfo(
    conn: Connection,
    pickupDetails: PickupDetails & { entityId: number },
    shipmentId: number
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        entityId: pickupDetails.entityId,
        pickupRouting: pickupDetails.pickupRouting,
        airportTransfer: pickupDetails.airportTransfer,
        carrierId: pickupDetails.carrierId,
        terminalId: pickupDetails.terminalId,
        fromLocationType: pickupDetails.fromLocationType,
        fromLocation: pickupDetails.fromLocation,
        fromLocationEntityId: pickupDetails.fromLocationEntityId ?? null,
        editFromLocation: pickupDetails.editFromLocation,
        pickupAgentTerminal: pickupDetails.pickupAgentTerminal,
        pickupAccessorial: pickupDetails.pickupAccessorial,
        pickupAlert: pickupDetails.pickupAlert,
    };

    return insertWithReturning(conn, '"Network_Shipment_Pickup_Info"', payload);
}

export async function createNetworkShipmentPickupAgentTerminalInfo(
    conn: Connection,
    shipmentId: number,
    pickupAgentTerminalDetails: PickupDetails["pickupAgentTerminalDetails"]
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        toLocationType: pickupAgentTerminalDetails?.toLocationType ?? null,
        toLocation: pickupAgentTerminalDetails?.toLocation ?? null,
        toLocationEntityId: pickupAgentTerminalDetails?.toLocationEntityId ?? null,
        editToLocation: pickupAgentTerminalDetails?.editToLocation ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Pickup_Agent_Terminal_Info"', payload);
}

export async function createNetworkShipmentPickupAlertInfo(
    conn: Connection,
    shipmentId: number,
    pickupAlertDetails: PickupDetails["pickupAlertDetails"]
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        inboundNotes: pickupAlertDetails?.inboundNotes ?? null,
        primaryEmail: pickupAlertDetails?.emailInfo?.primaryEmail ?? null,
        additionalEmail: pickupAlertDetails?.emailInfo?.additionalEmails ? JSON.stringify(pickupAlertDetails.emailInfo.additionalEmails) : null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Pickup_Alert_Info"', payload);
}

export async function createNetworkShipmentPickupAccessorial(
    conn: Connection,
    shipmentId: number,
    accessorial: Accessorial & { entityId: number; noteThreadId?: number | null }
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        accessorialId: accessorial?.accessorialId ?? null,
        accessorialName: accessorial?.accessorialName ?? null,
        chargeType: accessorial?.chargeType ?? null,
        chargeValue: accessorial?.chargeValue ?? null,
        entityId: accessorial?.entityId ?? null,
        noteThreadId: accessorial?.noteThreadId ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Pickup_Accessorial"', payload);
}

export async function createNetworkShipmentLinehaulPrimaryInfo(
    conn: Connection,
    shipmentId: number,
    linehaulInfo: LinehaulPrimaryInfo & { entityId: number }
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        entityId: linehaulInfo?.entityId ?? null,
        linehaulRouting: linehaulInfo?.linehaulRouting ?? null,
        carrierId: linehaulInfo?.carrierId ?? null,
        terminalId: linehaulInfo?.terminalId ?? null,
        carrierBillNumber: linehaulInfo?.carrierBillNumber ?? null,
        editFromLocation: linehaulInfo?.editFromLocation ?? null,
        fromLocationType: linehaulInfo?.fromLocationType ?? null,
        fromLocation: linehaulInfo?.fromLocation ?? null,
        fromLocationEntityId: linehaulInfo?.fromLocationEntityId ?? null,
        editToLocation: linehaulInfo?.editToLocation ?? null,
        toLocationType: linehaulInfo?.toLocationType ?? null,
        toLocation: linehaulInfo?.toLocation ?? null,
        toLocationEntityId: linehaulInfo?.toLocationEntityId ?? null,
        etaDate: linehaulInfo?.etaDate ?? null,
        etaTime: linehaulInfo?.etaTime ?? null,
        pieces: linehaulInfo?.pieces ?? null,
        weight: linehaulInfo?.weight ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Linehaul_Info"', payload);
}

export async function createNetworkLinehaulCommonInfo(conn: Connection, shipmentId: number, linehaulCommonInfo: LinehaulCommonInfo) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        linehaulAccessorial: linehaulCommonInfo?.linehaulAccessorial ?? null,
        linehaulNotes: linehaulCommonInfo?.linehaulNotes ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Linehaul_Common_Info"', payload);
}

export async function createNetworkShipmentLinehaulAccessorial(
    conn: Connection,
    shipmentId: number,
    accessorial: Accessorial & { entityId: number; noteThreadId?: number | null }
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        accessorialId: accessorial?.accessorialId ?? null,
        accessorialName: accessorial?.accessorialName ?? null,
        chargeType: accessorial?.chargeType ?? null,
        chargeValue: accessorial?.chargeValue ?? null,
        entityId: accessorial?.entityId ?? null,
        noteThreadId: accessorial?.noteThreadId ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Linehaul_Accessorial"', payload);
}

export async function createNetworkShipmentDeliveryPrimaryInfo(
    conn: Connection,
    shipmentId: number,
    deliveryInfo: DeliveryPrimaryInfo & { entityId: number }
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        entityId: deliveryInfo?.entityId ?? null,
        carrierId: deliveryInfo?.carrierId ?? null,
        terminalId: deliveryInfo?.terminalId ?? null,
        carrierBillNumber: deliveryInfo?.carrierBillNumber ?? null,
        editFromLocation: deliveryInfo?.editFromLocation ?? null,
        fromLocationType: deliveryInfo?.fromLocationType ?? null,
        fromLocation: deliveryInfo?.fromLocation ?? null,
        fromLocationEntityId: deliveryInfo?.fromLocationEntityId ?? null,
        editToLocation: deliveryInfo?.editToLocation ?? null,
        toLocationType: deliveryInfo?.toLocationType ?? null,
        toLocation: deliveryInfo?.toLocation ?? null,
        toLocationEntityId: deliveryInfo?.toLocationEntityId ?? null,
        etaDate: deliveryInfo?.etaDate ?? null,
        etaTime: deliveryInfo?.etaTime ?? null,
        pieces: deliveryInfo?.pieces ?? null,
        weight: deliveryInfo?.weight ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Delivery_Info"', payload);
}

export async function createNetworkShipmentDeliveryCommonInfo(conn: Connection, shipmentId: number, deliveryCommonInfo: DeliveryCommonInfo) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        deliveryAccessorial: deliveryCommonInfo?.deliveryAccessorial ?? null,
        airportTransfer: deliveryCommonInfo?.airportTransfer ?? null,
        deliveryAlert: deliveryCommonInfo?.deliveryAlert ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Delivery_Common_Info"', payload);
}

export async function createNetworkShipmentDeliveryAccessorial(
    conn: Connection,
    shipmentId: number,
    accessorial: Accessorial & { entityId: number; noteThreadId?: number | null }
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        accessorialId: accessorial?.accessorialId ?? null,
        accessorialName: accessorial?.accessorialName ?? null,
        chargeType: accessorial?.chargeType ?? null,
        chargeValue: accessorial?.chargeValue ?? null,
        entityId: accessorial?.entityId ?? null,
        noteThreadId: accessorial?.noteThreadId ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Delivery_Accessorial"', payload);
}

export async function createNetworkShipementDeliveryAlertInfo(
    conn: Connection,
    shipmentId: number,
    deliveryAlertDetails: DeliveryCommonInfo["deliveryAlertDetails"]
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        linehaulNotes: deliveryAlertDetails?.linehaulNotes ?? null,
        deliveryNotes: deliveryAlertDetails?.deliveryNotes ?? null,
        primaryEmail: deliveryAlertDetails?.emailInfo?.primaryEmail ?? null,
        additionalEmail: deliveryAlertDetails?.emailInfo?.additionalEmails ? JSON.stringify(deliveryAlertDetails.emailInfo.additionalEmails) : null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Delivery_Alert_Info"', payload);
}

export async function createNetworkShipmentRateInfo(conn: Connection, rateDetails: RateDetails) {
    const payload: Record<string, SqlValue> = {
        rateType: rateDetails.rateType,
        multiplicationFactor: rateDetails.multiplicationFactor,
        multiplicationFactorUOM: rateDetails.multiplicationFactorUOM,
        rateValue: rateDetails.rateValue,
        totalRate: rateDetails.totalRate,
    };

    return insertWithReturning(conn, '"Network_Shipment_Rate_Info"', payload);
}

export async function createNetworkShipmentInvoiceInfo(conn: Connection, invoiceDetails: InvoiceDetails) {
    const payload: Record<string, SqlValue> = {
        shipmentId: invoiceDetails.shipmentId,
        invoiceNumber: invoiceDetails.invoiceNumber,
        invoiceType: invoiceDetails.invoiceType,
        subTotalRate: invoiceDetails.subTotalRate,
        approvalStatus: invoiceDetails.approvalStatus,
        approvedBy: invoiceDetails.approvedBy ?? null,
        approvedDate: invoiceDetails.approvedDate ?? null,
    };

    return insertWithReturning(conn, '"Network_Shipment_Invoice_Info"', payload);
}

export async function createNetworkShipmentInvoiceRateMapping(conn: Connection, invoiceId: number, rateId: number) {
    const payload: Record<string, SqlValue> = {
        invoiceId,
        rateId,
    };

    return insertWithReturning(conn, '"Network_Shipment_Invoice_Rate_Map"', payload);
}

export async function createNetworkShipmentCarrierRateInfo(
    conn: Connection,
    shipmentId: number,
    pickupInvoiceId: number | null,
    linehaulInvoiceId: number | null,
    deliveryInvoiceId: number | null,
    totalCarrierRate: number
) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        pickupInvoiceId,
        linehaulInvoiceId,
        deliveryInvoiceId,
        totalCarrierRate,
    };

    return insertWithReturning(conn, '"Network_Shipment_Carrier_Rate_Info"', payload);
}

export async function createNetworkShipmentCustomerRateInfo(conn: Connection, shipmentId: number, totalCustomerRate: number) {
    const payload: Record<string, SqlValue> = {
        shipmentId,
        totalCustomerRate,
    };

    return insertWithReturning(conn, '"Network_Shipment_Customer_Rate_Info"', payload);
}

export async function createNetworkShipmentCustomerRateMapping(conn: Connection, customerRateId: number, rateId: number) {
    const payload: Record<string, SqlValue> = {
        customerRateId,
        rateId,
    };

    return insertWithReturning(conn, '"Network_Shipment_Customer_Rate_Map"', payload);
}

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
