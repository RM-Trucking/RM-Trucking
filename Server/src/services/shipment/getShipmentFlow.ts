import { Connection } from "odbc";
import * as shipmentDB from "../../database/shipment/getShipment";

export interface ShipmentPaginationParams {
    page: number;
    limit: number;
}

export interface ShipmentPaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}

export function normalizePaginationParams(pageInput: any, limitInput: any): ShipmentPaginationParams {
    const parsedPage = Number.parseInt(String(pageInput ?? "1"), 10);
    const parsedLimit = Number.parseInt(String(limitInput ?? "10"), 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;

    return { page, limit };
}

export function buildPaginationMeta(totalItems: number, page: number, limit: number): ShipmentPaginationMeta {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));

    return {
        page: safePage,
        limit: safeLimit,
        totalItems,
        totalPages,
    };
}

async function getShipmentById(conn: Connection, shipmentId: number) {
    return shipmentDB.getShipmentById(conn, shipmentId);
}

async function getShipmentCustomerDetails(conn: Connection, shipmentId: number) {
    const customerInfo = await shipmentDB.getShipmentCustomerInfo(conn, shipmentId);
    if (!customerInfo) return null;

    return customerInfo;
}

async function getShipmentCommodityDetails(conn: Connection, shipmentId: number) {
    const commodityInfo = await shipmentDB.getShipmentCommodityInfo(conn, shipmentId);
    if (!commodityInfo) return null;

    return commodityInfo;
}

async function getShipmentCarrierDetails(conn: Connection, shipmentId: number) {
    const pickupInfo = await shipmentDB.getShipmentPickupInfoByShipmentId(conn, shipmentId);
    const pickupAgentTerminalInfo = pickupInfo ? await shipmentDB.getShipmentPickupAgentTerminalInfo(conn, shipmentId) : null;
    const pickupAlertInfo = pickupInfo ? await shipmentDB.getShipmentPickupAlertInfo(conn, shipmentId) : null;
    const pickupAccessorials = pickupInfo ? await shipmentDB.getShipmentPickupAccessorials(conn, shipmentId) : [];

    const linehaulInfo = await shipmentDB.getShipmentLinehaulInfoByShipmentId(conn, shipmentId);
    const linehaulCommonInfo = await shipmentDB.getShipmentLinehaulCommonInfo(conn, shipmentId);
    const linehaulAccessorials = await shipmentDB.getShipmentLinehaulAccessorials(conn, shipmentId);

    const deliveryInfo = await shipmentDB.getShipmentDeliveryInfoByShipmentId(conn, shipmentId);
    const deliveryCommonInfo = await shipmentDB.getShipmentDeliveryCommonInfo(conn, shipmentId);
    const deliveryAccessorials = await shipmentDB.getShipmentDeliveryAccessorials(conn, shipmentId);
    const deliveryAlertInfo = await shipmentDB.getShipmentDeliveryAlertInfo(conn, shipmentId);

    console.log("Pickup Terminal Info:", pickupAgentTerminalInfo);

    const pickupAgentTerminalDetailsResponse = pickupAgentTerminalInfo
        ? {
            pickupAgentTerminalId: pickupAgentTerminalInfo?.pickupAgentTerminalId,
            shipmentId: pickupInfo?.shipmentId ?? pickupAgentTerminalInfo?.shipmentId,
            entityId: pickupAgentTerminalInfo?.entityId,
            toLocationType: pickupAgentTerminalInfo?.toLocationType,
            toLocation: pickupAgentTerminalInfo?.toLocation,
            toLocationEntityId: pickupAgentTerminalInfo?.toLocationEntityId,
            editToLocation: pickupAgentTerminalInfo?.editToLocation ?? "N",
            editToLocationDetails: pickupAgentTerminalInfo?.toLocationEntityId
                ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, pickupAgentTerminalInfo.toLocationEntityId, "PICKUP", "TO")
                : undefined,
        }
        : undefined;

    const pickupDetailsResponse = pickupInfo ? {
        pickupInfoId: pickupInfo.pickupInfoId,
        shipmentId: pickupInfo.shipmentId,
        entityId: pickupInfo.entityId,
        pickupRouting: pickupInfo.pickupRouting,
        airportTransfer: pickupInfo.airportTransfer,
        carrierId: pickupInfo.carrierId,
        carrierName: pickupInfo.carrierName,
        terminalId: pickupInfo.terminalId,
        terminalName: pickupInfo.terminalName,
        fromLocationType: pickupInfo.fromLocationType,
        fromLocation: pickupInfo.fromLocation,
        fromLocationEntityId: pickupInfo.fromLocationEntityId,
        editFromLocation: pickupInfo.editFromLocation,
        pickupAgentTerminal: pickupInfo.pickupAgentTerminal,
        pickupAccessorial: pickupInfo.pickupAccessorial,
        pickupAlert: pickupInfo.pickupAlert,
        editFromLocationDetails: pickupInfo.fromLocationEntityId
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, pickupInfo.fromLocationEntityId ?? pickupInfo.entityId, "PICKUP", "FROM")
            : undefined,
        pickupAgentTerminalDetails: pickupAgentTerminalDetailsResponse,
        pickupAccessorialDetails: pickupAccessorials.length > 0 ? {
            accessorials: pickupAccessorials.map((row: any) => ({
                pickupAccessorialId: row.pickupAccessorialId,
                shipmentId: row.shipmentId,
                accessorialId: row.accessorialId,
                accessorialName: row.accessorialName,
                chargeType: row.chargeType,
                chargeValue: row.chargeValue,
                entityId: row.entityId,
                noteThreadId: row.noteThreadId,
            }))
        } : undefined,
        pickupAlertDetails: pickupAlertInfo ? {
            pickupAlertId: pickupAlertInfo.pickupAlertId,
            shipmentId: pickupAlertInfo.shipmentId,
            inboundNotes: pickupAlertInfo.inboundNotes,
            emailInfo: {
                primaryEmail: pickupAlertInfo.primaryEmail,
                additionalEmails: parseEmailArray(pickupAlertInfo.additionalEmail),
            },
        } : undefined,
    } : undefined;

    const linehaulDetailsResponse = linehaulInfo ? {
        linehaulInfoId: linehaulInfo.linehaulInfoId,
        shipmentId: linehaulInfo.shipmentId,
        entityId: linehaulInfo.entityId,
        linehaulRouting: linehaulInfo.linehaulRouting,
        carrierId: linehaulInfo.carrierId,
        terminalId: linehaulInfo.terminalId,
        carrierBillNumber: linehaulInfo.carrierBillNumber,
        editFromLocation: linehaulInfo.editFromLocation,
        fromLocationType: linehaulInfo.fromLocationType,
        fromLocation: linehaulInfo.fromLocation,
        fromLocationEntityId: linehaulInfo.fromLocationEntityId,
        editToLocation: linehaulInfo.editToLocation,
        toLocationType: linehaulInfo.toLocationType,
        toLocation: linehaulInfo.toLocation,
        toLocationEntityId: linehaulInfo.toLocationEntityId,
        etaDate: linehaulInfo.etaDate,
        etaTime: linehaulInfo.etaTime,
        pieces: linehaulInfo.pieces,
        weight: linehaulInfo.weight,
        editFromLocationDetails: linehaulInfo.fromLocationEntityId
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, linehaulInfo.fromLocationEntityId ?? linehaulInfo.entityId, "LINE_HAUL", "FROM")
            : undefined,
        editToLocationDetails: linehaulInfo.toLocationEntityId
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, linehaulInfo.toLocationEntityId ?? linehaulInfo.entityId, "LINE_HAUL", "TO")
            : undefined,
    } : undefined;

    const linehaulCommonInfoResponse = linehaulCommonInfo ? {
        linehaulCommonInfoId: linehaulCommonInfo.linehaulCommonInfoId,
        shipmentId: linehaulCommonInfo.shipmentId,
        linehaulAccessorial: linehaulCommonInfo.linehaulAccessorial,
        linehaulNotes: linehaulCommonInfo.linehaulNotes,
        linehaulAccessorialDetails: linehaulAccessorials.length > 0 ? {
            accessorials: linehaulAccessorials.map((row: any) => ({
                linehaulAccessorialId: row.linehaulAccessorialId,
                shipmentId: row.shipmentId,
                accessorialId: row.accessorialId,
                accessorialName: row.accessorialName,
                chargeType: row.chargeType,
                chargeValue: row.chargeValue,
                entityId: row.entityId,
                noteThreadId: row.noteThreadId,
            }))
        } : undefined,
    } : undefined;

    const deliveryDetailsResponse = deliveryInfo ? {
        deliveryInfoId: deliveryInfo.deliveryInfoId,
        shipmentId: deliveryInfo.shipmentId,
        entityId: deliveryInfo.entityId,
        carrierId: deliveryInfo.carrierId,
        terminalId: deliveryInfo.terminalId,
        carrierBillNumber: deliveryInfo.carrierBillNumber,
        editFromLocation: deliveryInfo.editFromLocation,
        fromLocationType: deliveryInfo.fromLocationType,
        fromLocation: deliveryInfo.fromLocation,
        fromLocationEntityId: deliveryInfo.fromLocationEntityId,
        editToLocation: deliveryInfo.editToLocation,
        toLocationType: deliveryInfo.toLocationType,
        toLocation: deliveryInfo.toLocation,
        toLocationEntityId: deliveryInfo.toLocationEntityId,
        etaDate: deliveryInfo.etaDate,
        etaTime: deliveryInfo.etaTime,
        pieces: deliveryInfo.pieces,
        weight: deliveryInfo.weight,
        editFromLocationDetails: deliveryInfo.fromLocationEntityId
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, deliveryInfo.fromLocationEntityId ?? deliveryInfo.entityId, "DELIVERY", "FROM")
            : undefined,
        editToLocationDetails: deliveryInfo.toLocationEntityId
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, deliveryInfo.toLocationEntityId ?? deliveryInfo.entityId, "DELIVERY", "TO")
            : undefined,
    } : undefined;

    const deliveryCommonInfoResponse = deliveryCommonInfo ? {
        deliveryCommonInfoId: deliveryCommonInfo.deliveryCommonInfoId,
        shipmentId: deliveryCommonInfo.shipmentId,
        deliveryAccessorial: deliveryCommonInfo.deliveryAccessorial,
        airportTransfer: deliveryCommonInfo.airportTransfer,
        deliveryAlert: deliveryCommonInfo.deliveryAlert,
        deliveryAccessorialDetails: deliveryAccessorials.length > 0 ? {
            accessorials: deliveryAccessorials.map((row: any) => ({
                deliveryAccessorialId: row.deliveryAccessorialId,
                shipmentId: row.shipmentId,
                accessorialId: row.accessorialId,
                accessorialName: row.accessorialName,
                chargeType: row.chargeType,
                chargeValue: row.chargeValue,
                entityId: row.entityId,
                noteThreadId: row.noteThreadId,
            }))
        } : undefined,
        deliveryAlertDetails: deliveryAlertInfo ? {
            deliveryAlertId: deliveryAlertInfo.deliveryAlertId,
            shipmentId: deliveryAlertInfo.shipmentId,
            linehaulNotes: deliveryAlertInfo.linehaulNotes,
            deliveryNotes: deliveryAlertInfo.deliveryNotes,
            emailInfo: {
                primaryEmail: deliveryAlertInfo.primaryEmail,
                additionalEmails: parseEmailArray(deliveryAlertInfo.additionalEmail),
            },
        } : undefined,
    } : undefined;

    const carrierDetails: any = {};
    if (pickupDetailsResponse) carrierDetails.pickupDetails = pickupDetailsResponse;
    if (linehaulDetailsResponse || linehaulCommonInfoResponse) carrierDetails.linehaulDetails = {
        linehaulPrimaryInfo: linehaulDetailsResponse,
        linehaulCommonInfo: linehaulCommonInfoResponse,
    };
    if (deliveryDetailsResponse || deliveryCommonInfoResponse) carrierDetails.deliveryDetails = {
        deliveryPrimaryInfo: deliveryDetailsResponse,
        deliveryCommonInfo: deliveryCommonInfoResponse,
    };

    return carrierDetails;
}

async function getShipmentRateDetails(conn: Connection, shipmentId: number) {
    const pickupRateInvoice = await shipmentDB.getShipmentInvoiceInfoByShipmentIdAndType(conn, shipmentId, "PICKUP");
    const linehaulRateInvoice = await shipmentDB.getShipmentInvoiceInfoByShipmentIdAndType(conn, shipmentId, "LINE_HAUL");
    const deliveryRateInvoice = await shipmentDB.getShipmentInvoiceInfoByShipmentIdAndType(conn, shipmentId, "DELIVERY");
    const customerRateInfo = await shipmentDB.getShipmentCustomerRateInfoByShipmentId(conn, shipmentId);
    const carrierRateInfo = await shipmentDB.getShipmentCarrierRateInfoByShipmentId(conn, shipmentId);

    const buildRateDetails = async (invoice: any) => {
        if (!invoice) return null;
        const mappings = await shipmentDB.getShipmentInvoiceRateMapByInvoiceId(conn, invoice.invoiceId);
        const rateDetails = await Promise.all(
            mappings.map(async (map: any) => {
                const rate = await shipmentDB.getShipmentRateInfoByRateId(conn, map.rateId);
                return {
                    rateId: rate.rateId,
                    rateType: rate.rateType,
                    multiplicationFactor: rate.multiplicationFactor,
                    multiplicationFactorUOM: rate.multiplicationFactorUOM,
                    rateValue: rate.rateValue,
                    totalRate: rate.totalRate,
                };
            })
        );

        return {
            invoiceId: invoice.invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            rateDetails,
            subTotalRate: invoice.subTotalRate,
            invoiceApprovalStatus: invoice.approvalStatus,
            approvedBy: invoice.approvedBy,
            approvedDate: invoice.approvedDate,
        };
    };

    const pickupRateDetails = await buildRateDetails(pickupRateInvoice);
    const linehaulRateDetails = await buildRateDetails(linehaulRateInvoice);
    const deliveryRateDetails = await buildRateDetails(deliveryRateInvoice);

    const customerRateDetails = customerRateInfo
        ? {
            customerRateId: customerRateInfo.customerRateId,
            totalCustomerRate: customerRateInfo.totalCustomerRate,
            rateDetails: await Promise.all(
                (await shipmentDB.getShipmentCustomerRateMapByCustomerRateId(conn, customerRateInfo.customerRateId)).map(async (map: any) => {
                    const rate = await shipmentDB.getShipmentRateInfoByRateId(conn, map.rateId);
                    return {
                        rateId: rate.rateId,
                        rateType: rate.rateType,
                        multiplicationFactor: rate.multiplicationFactor,
                        multiplicationFactorUOM: rate.multiplicationFactorUOM,
                        rateValue: rate.rateValue,
                        totalRate: rate.totalRate,
                    };
                })
            ),
        }
        : null;

    const carrierRateDetails: any = {};
    if (pickupRateDetails) carrierRateDetails.pickupRateDetails = pickupRateDetails;
    if (linehaulRateDetails) carrierRateDetails.linehaulRateDetails = linehaulRateDetails;
    if (deliveryRateDetails) carrierRateDetails.deliveryRateDetails = deliveryRateDetails;
    if (carrierRateInfo) {
        carrierRateDetails.carrierRateId = carrierRateInfo.carrierRateId;
        carrierRateDetails.totalCarrierRate = carrierRateInfo.totalCarrierRate;
    }

    const shipmentRateDetails: any = {};
    if (Object.keys(carrierRateDetails).length > 0) shipmentRateDetails.carrierRateDetails = carrierRateDetails;
    if (customerRateDetails) shipmentRateDetails.customerRateDetails = customerRateDetails;

    return shipmentRateDetails;
}

async function getShipmentCustomerResponse(conn: Connection, shipmentId: number) {
    const customerInfo = await getShipmentCustomerDetails(conn, shipmentId);
    const customerReferenceNumbers = await shipmentDB.getShipmentCustomerReferenceNumbers(conn, shipmentId);
    const shipperInfo = await shipmentDB.getShipmentShipperInfoByShipmentId(conn, shipmentId);
    const consigneeInfo = await shipmentDB.getShipmentConsigneeInfoByShipmentId(conn, shipmentId);
    const airlineRows = await shipmentDB.getShipmentAirlinesByShipmentId(conn, shipmentId);

    const pickupAirlineInfo = customerInfo?.airportPickupService === "Y"
        ? airlineRows.find((airline: any) => airline.airportCode === customerInfo.originAirportCode)
        : null;
    const deliveryAirlineInfo = customerInfo?.airportDeliveryService === "Y"
        ? airlineRows.find((airline: any) => airline.airportCode === customerInfo.destinationAirportCode)
        : null;

    const customerDetailsResponse: any = {
        ...customerInfo,
        shipperDetails: shipperInfo ? {
            shipperId: shipperInfo.shipperId,
            shipperName: shipperInfo.shipperName,
            addressLine1: shipperInfo.addressLine1,
            addressLine2: shipperInfo.addressLine2,
            city: shipperInfo.city,
            state: shipperInfo.state,
            zipCode: shipperInfo.zipCode,
            contactPersonName: shipperInfo.contactPersonName,
            phoneNumber: shipperInfo.phoneNumber,
            entityId: shipperInfo.entityId,
        } : undefined,
        consigneeDetails: consigneeInfo ? {
            consigneeId: consigneeInfo.consigneeId,
            consigneeName: consigneeInfo.consigneeName,
            addressLine1: consigneeInfo.addressLine1,
            addressLine2: consigneeInfo.addressLine2,
            city: consigneeInfo.city,
            state: consigneeInfo.state,
            zipCode: consigneeInfo.zipCode,
            contactPersonName: consigneeInfo.contactPersonName,
            phoneNumber: consigneeInfo.phoneNumber,
            entityId: consigneeInfo.entityId,
        } : undefined,
        pickupAirlineDetails: pickupAirlineInfo ? {
            airlineId: pickupAirlineInfo.airlineId,
            airlineNumber: pickupAirlineInfo.airlineNumber,
            airlineCode: pickupAirlineInfo.airlineCode,
            airportCode: pickupAirlineInfo.airportCode,
            airlineName: pickupAirlineInfo.airlineName,
            addressLine1: pickupAirlineInfo.addressLine1,
            addressLine2: pickupAirlineInfo.addressLine2,
            city: pickupAirlineInfo.city,
            state: pickupAirlineInfo.state,
            zipCode: pickupAirlineInfo.zipCode,
            handler: pickupAirlineInfo.handler,
            contactPersonName: pickupAirlineInfo.contactPersonName,
            phoneNumber: pickupAirlineInfo.phoneNumber,
            entityId: pickupAirlineInfo.entityId,
            scenarioType: pickupAirlineInfo.scenarioType,
        } : undefined,
        deliveryAirlineDetails: deliveryAirlineInfo ? {
            airlineId: deliveryAirlineInfo.airlineId,
            airlineNumber: deliveryAirlineInfo.airlineNumber,
            airlineCode: deliveryAirlineInfo.airlineCode,
            airportCode: deliveryAirlineInfo.airportCode,
            airlineName: deliveryAirlineInfo.airlineName,
            addressLine1: deliveryAirlineInfo.addressLine1,
            addressLine2: deliveryAirlineInfo.addressLine2,
            city: deliveryAirlineInfo.city,
            state: deliveryAirlineInfo.state,
            zipCode: deliveryAirlineInfo.zipCode,
            handler: deliveryAirlineInfo.handler,
            contactPersonName: deliveryAirlineInfo.contactPersonName,
            phoneNumber: deliveryAirlineInfo.phoneNumber,
            entityId: deliveryAirlineInfo.entityId,
            scenarioType: deliveryAirlineInfo.scenarioType,
        } : undefined,
        customerReferenceNumbers: customerReferenceNumbers?.length
            ? customerReferenceNumbers.map((row: any) => ({
                referenceNumberId: row.referenceNumberId,
                shipmentId: row.shipmentId,
                referenceType: row.referenceType,
                referenceNumber: row.referenceNumber,
            }))
            : undefined,
    };

    if (!customerDetailsResponse.shipperDetails) delete customerDetailsResponse.shipperDetails;
    if (!customerDetailsResponse.consigneeDetails) delete customerDetailsResponse.consigneeDetails;
    if (!customerDetailsResponse.pickupAirlineDetails) delete customerDetailsResponse.pickupAirlineDetails;
    if (!customerDetailsResponse.deliveryAirlineDetails) delete customerDetailsResponse.deliveryAirlineDetails;
    if (!customerDetailsResponse.customerReferenceNumbers) delete customerDetailsResponse.customerReferenceNumbers;

    return customerDetailsResponse;
}

async function getShipmentCommodityResponse(conn: Connection, shipmentId: number) {
    const commodityInfo = await getShipmentCommodityDetails(conn, shipmentId);
    const handlingUnits = await shipmentDB.getHandlingUnitsByShipmentId(conn, shipmentId);

    const handlingUnitsResponse = await Promise.all(
        handlingUnits.map(async (hu: any) => {
            const items = await shipmentDB.getHandlingUnitItemsByHandlingUnitId(conn, hu.handlingUnitId);
            const palletDetails = await Promise.all(
                items.map(async (item: any) => {
                    const hazmat = item.hazmat === "Y"
                        ? await shipmentDB.getHazmatInfoByItemId(conn, item.itemId)
                        : undefined;

                    return {
                        itemId: item.itemId,
                        handlingUnitId: item.handlingUnitId,
                        pieces: item.pieces,
                        piecesUOM: item.piecesUOM,
                        description: item.description,
                        hazmat: item.hazmat,
                        hazmatDetails: hazmat ? { ...hazmat } : undefined,
                    };
                })
            );

            return {
                handlingUnitId: hu.handlingUnitId,
                shipmentId: hu.shipmentId,
                handlingUnitUOM: hu.handlingUnitUOM,
                handlingUnits: hu.handlingUnits,
                unit: hu.unit,
                handlingLength: hu.handlingLength,
                handlingWidth: hu.handlingWidth,
                handlingHeight: hu.handlingHeight,
                handlingWeight: hu.handlingWeight,
                handlingWeightUnit: hu.handlingWeightUnit,
                class: hu.class,
                palletDetails,
            };
        })
    );

    return {
        commodityId: commodityInfo?.commodityId,
        emergencyContactName: commodityInfo?.emergencyContactName,
        emergencyContactPhone: commodityInfo?.emergencyContactPhone,
        handlingUnits: handlingUnitsResponse,
    };
}

export async function getNetworkShipmentView(conn: Connection, shipmentId: number): Promise<any> {
    const shipment = await getShipmentById(conn, shipmentId);
    if (!shipment) return null;

    const [customerDetails, commodityDetails, carrierDetails, shipmentRateDetails] = await Promise.all([
        getShipmentCustomerResponse(conn, shipmentId),
        getShipmentCommodityResponse(conn, shipmentId),
        getShipmentCarrierDetails(conn, shipmentId),
        getShipmentRateDetails(conn, shipmentId),
    ]);

    return {
        shipmentId: shipment.shipmentId,
        shipmentDetails: {
            typeOfShipment: shipment.typeOfShipment,
            serviceLevel: shipment.serviceLevel,
            shipmentDate: shipment.shipmentDate,
            shipmentTime: shipment.shipmentTime,
            orderReceivedPickupPending: (shipment as any).orderReceivedPickupPending,
            status: (shipment as any).status,
        },
        customerDetails,
        commodityDetails,
        carrierDetails: Object.keys(carrierDetails || {}).length ? carrierDetails : undefined,
        shipmentRateDetails: Object.keys(shipmentRateDetails || {}).length ? shipmentRateDetails : undefined,
    };
}

export async function getNetworkShipmentForms(
    conn: Connection,
    pagination: ShipmentPaginationParams = { page: 1, limit: 10 }
): Promise<{ items: Array<any>; pagination: ShipmentPaginationMeta }> {
    const normalized = normalizePaginationParams(pagination?.page, pagination?.limit);
    const { totalItems, rows } = await shipmentDB.getShipmentList(conn, normalized.page, normalized.limit);

    const items = await Promise.all(
        rows.map(async (row: any) => {
            if (!row?.shipmentId) return null;
            return getNetworkShipmentView(conn, row.shipmentId);
        })
    );

    return {
        items: items.filter(Boolean),
        pagination: buildPaginationMeta(totalItems, normalized.page, normalized.limit),
    };
}

function parseEmailArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch {
        return typeof value === "string"
            ? value.split(",").map((item) => item.trim()).filter(Boolean)
            : [];
    }
}
