import { Connection } from "odbc";
import {
    CreateShipmentPayload,
    CreateShipmentDetails,
    CreateCustomerDetails,
    CreateCustomerReferenceNumber,
    CreateShipperDetails,
    CreateConsigneeDetails,
    CreateAirlineDetails,
    CreateCommodityDetails,
    CreateHandlingUnitDetails,
    CreatePalletDetails,
    CreateHazmatDetails,
    CreateAddressDetail,
    CreatePickupDetails,
    CreateLinehaulPrimaryInfo,
    CreateLinehaulCommonInfo,
    CreateDeliveryPrimaryInfo,
    CreateDeliveryCommonInfo,
    CreateCarrierDetails,
    CreateRateDetails,
    CreateInvoiceDetails,
    CreateAccessorial,
} from "../../entities/shipment";
import * as shipmentDB from "../../database/shipment/createShipment";
import * as entityDB from "../../database/maintenance";
import * as noteDB from "../../database/maintenance/note";

export interface CreatedShipmentFlowResult {
    shipmentId?: number;
}

export async function createShipmentRecord(
    conn: Connection,
    shipmentDetails: CreateShipmentDetails,
    userId: number
) {

    if (!shipmentDetails.typeOfShipment)
        throw new Error("Type of shipment is required");
    if (!shipmentDetails.serviceLevel)
        throw new Error("Service level is required");
    if (!shipmentDetails.status)
        throw new Error("Shipment status is required");

    return shipmentDB.createNetworkShipment(conn, shipmentDetails as any, userId);
}

export async function createCustomerInfoRecord(
    conn: Connection,
    customerDetails: CreateCustomerDetails,
    shipmentId: number
) {
    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!customerDetails.customerId)
        throw new Error("Customer ID is required");
    if (!customerDetails.stationId)
        throw new Error("Station ID is required");
    if (!customerDetails.airportPickupService)
        throw new Error("Airport pickup service is required");
    if (!customerDetails.airportDeliveryService)
        throw new Error("Airport delivery service is required");

    return shipmentDB.createCustomerInfo(conn, customerDetails as any, shipmentId);
}

export async function createCustomerReferenceNumberRecord(
    conn: Connection,
    shipmentId: number,
    referenceNumberDetails: CreateCustomerReferenceNumber
) {
    return shipmentDB.createNetworkShipmentCustomerReferenceNumber(
        conn,
        shipmentId,
        referenceNumberDetails as any
    );
}

export async function createShipperInfoRecord(
    conn: Connection,
    shipperDetails: CreateShipperDetails
) {

    if (!shipperDetails.shipperName)
        throw new Error("Shipper name is required");
    if (!shipperDetails.addressLine1)
        throw new Error("Shipper address line 1 is required");
    if (!shipperDetails.city)
        throw new Error("Shipper city is required");
    if (!shipperDetails.state)
        throw new Error("Shipper state is required");
    if (!shipperDetails.zipCode)
        throw new Error("Shipper zip code is required");
    if (!shipperDetails.entityId)
        throw new Error("Shipper entity ID is required");

    const shipperConflict = await shipmentDB.checkShipperUniqueFields(conn, {
        shipperName: shipperDetails.shipperName
    });

    if (shipperConflict) {
        throw new Error(`Shipper with name "${shipperDetails.shipperName}" already exists`);
    }

    return shipmentDB.createShipperInfo(conn, shipperDetails as any);
}

export async function createConsigneeInfoRecord(
    conn: Connection,
    consigneeDetails: CreateConsigneeDetails
) {
    if (!consigneeDetails.consigneeName)
        throw new Error("Consignee name is required");
    if (!consigneeDetails.addressLine1)
        throw new Error("Consignee address line 1 is required");
    if (!consigneeDetails.city)
        throw new Error("Consignee city is required");
    if (!consigneeDetails.state)
        throw new Error("Consignee state is required");
    if (!consigneeDetails.zipCode)
        throw new Error("Consignee zip code is required");
    if (!consigneeDetails.entityId)
        throw new Error("Consignee entity ID is required");

    const consigneeConflict = await shipmentDB.checkConsigneeUniqueFields(conn, {
        consigneeName: consigneeDetails.consigneeName
    });

    if (consigneeConflict) {
        throw new Error(`Consignee with name "${consigneeDetails.consigneeName}" already exists`);
    }

    return shipmentDB.createConsigneeInfo(conn, consigneeDetails as any);
}

export async function createAirlineRecord(
    conn: Connection,
    airlineDetails: CreateAirlineDetails
) {

    if (!airlineDetails.airlineNumber)
        throw new Error("Airline number is required");
    if (!airlineDetails.airlineCode)
        throw new Error("Airline code is required");
    if (!airlineDetails.airportCode)
        throw new Error("Airport code is required");
    if (!airlineDetails.airlineName)
        throw new Error("Airline name is required");
    if (!airlineDetails.addressLine1)
        throw new Error("Airline address line 1 is required");
    if (!airlineDetails.city)
        throw new Error("Airline city is required");
    if (!airlineDetails.state)
        throw new Error("Airline state is required");
    if (!airlineDetails.zipCode)
        throw new Error("Airline zip code is required");
    if (!airlineDetails.entityId)
        throw new Error("Airline entity ID is required");
    if (!airlineDetails.scenarioType)
        throw new Error("Airline scenario type is required");

    const airlineConflict = await shipmentDB.checkAirlineUniqueFields(
        conn,
        airlineDetails.airlineNumber,
        airlineDetails.airlineCode,
        airlineDetails.scenarioType
    );

    if (airlineConflict) {
        throw new Error(`Airline already exists with duplicate ${airlineConflict}`);
    }

    return shipmentDB.createAirlineInfo(conn, airlineDetails as any);
}

export async function createCommodityInfoRecord(
    conn: Connection,
    commodityDetails: CreateCommodityDetails,
    shipmentId: number
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");

    return shipmentDB.createCommodityInfo(conn, commodityDetails as any, shipmentId);
}

export async function createHandlingUnitRecord(
    conn: Connection,
    handlingUnitDetails: CreateHandlingUnitDetails,
    shipmentId: number
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!handlingUnitDetails.handlingUnitUOM)
        throw new Error("Handling unit UOM is required");
    if (!handlingUnitDetails.handlingUnits)
        throw new Error("Handling units count is required");
    if (!handlingUnitDetails.unit)
        throw new Error("Handling unit type is required");

    return shipmentDB.createHandlingUnitInfo(conn, handlingUnitDetails as any, shipmentId);
}

export async function createHandlingUnitItemRecord(
    conn: Connection,
    palletDetails: CreatePalletDetails,
    handlingUnitId: number
) {
    if (!handlingUnitId)
        throw new Error("Handling unit ID is required");
    if (!palletDetails.pieces)
        throw new Error("Pallet pieces count is required");
    if (!palletDetails.piecesUOM)
        throw new Error("Pallet pieces UOM is required");
    if (!palletDetails.description)
        throw new Error("Pallet description is required");
    if (!palletDetails.hazmat)
        throw new Error("Pallet hazmat information is required");

    return shipmentDB.createHandlingUnitItemInfo(conn, palletDetails as any, handlingUnitId);
}

export async function createHazmatRecord(
    conn: Connection,
    hazmatDetails: CreateHazmatDetails,
    itemId: number
) {

    if (!itemId)
        throw new Error("Handling unit item ID is required");
    if (!hazmatDetails.unNumber)
        throw new Error("Hazmat UN number is required");
    if (!hazmatDetails.properShippingName)
        throw new Error("Hazmat proper shipping name is required");
    if (!hazmatDetails.hazardClass)
        throw new Error("Hazmat hazard class is required");
    if (!hazmatDetails.packingGroup)
        throw new Error("Hazmat packing group is required");
    if (!hazmatDetails.weight)
        throw new Error("Hazmat weight is required");
    if (!hazmatDetails.weightUnit)
        throw new Error("Hazmat weight unit is required");
    if (!hazmatDetails.contactPhoneNumber)
        throw new Error("Hazmat contact phone number is required");
    if (!hazmatDetails.limitedQuantity)
        throw new Error("Hazmat limited quantity is required");
    if (!hazmatDetails.marinePollutant)
        throw new Error("Hazmat marine pollutant information is required");
    if (!hazmatDetails.residueLastContained)
        throw new Error("Hazmat residue last contained information is required");
    if (!hazmatDetails.reportableQuantity)
        throw new Error("Hazmat reportable quantity information is required");
    if (!hazmatDetails.dotExemption)
        throw new Error("Hazmat DOT exemption information is required");

    return shipmentDB.createHandlingUnitItemHazmatInfo(conn, hazmatDetails as any, itemId);
}

export async function createAddressRecord(
    conn: Connection,
    address: CreateAddressDetail
) {

    if (!address.addressLine1)
        throw new Error("Address line 1 is required");
    if (!address.city)
        throw new Error("City is required");
    if (!address.state)
        throw new Error("State is required");
    if (!address.zipCode)
        throw new Error("Zip code is required");

    return shipmentDB.createNetworkShipmentAddress(conn, address as any);
}

export async function createEntityAddressMappingRecord(
    conn: Connection,
    entityId: number,
    addressId: number,
    addressType: "FROM" | "TO",
    locationType: "PICKUP" | "LINE_HAUL" | "DELIVERY"
) {

    if (!entityId)
        throw new Error("Entity ID is required");
    if (!addressId)
        throw new Error("Address ID is required");
    if (!addressType)
        throw new Error("Address type is required");
    if (!locationType)
        throw new Error("Location type is required");

    return shipmentDB.createNetworkShipmentEntityAddressMapping(
        conn,
        entityId,
        addressId,
        addressType,
        locationType
    );
}

export async function createPickupInfoRecord(
    conn: Connection,
    pickupDetails: CreatePickupDetails & { entityId: number },
    shipmentId: number
) {
    if (!pickupDetails.entityId)
        throw new Error("Entity ID is required");
    if (!shipmentId)
        throw new Error("Shipment ID is required");

    return shipmentDB.createNetworkShipmentPickupInfo(conn, pickupDetails as any, shipmentId);
}

export async function createPickupAgentTerminalRecord(
    conn: Connection,
    shipmentId: number,
    pickupAgentTerminalDetails: CreatePickupDetails["pickupAgentTerminalDetails"]
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");

    return shipmentDB.createNetworkShipmentPickupAgentTerminalInfo(
        conn,
        shipmentId,
        pickupAgentTerminalDetails as any
    );
}

export async function createPickupAlertRecord(
    conn: Connection,
    shipmentId: number,
    pickupAlertDetails: CreatePickupDetails["pickupAlertDetails"]
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");

    return shipmentDB.createNetworkShipmentPickupAlertInfo(conn, shipmentId, pickupAlertDetails as any);
}

export async function createPickupAccessorialRecord(
    conn: Connection,
    shipmentId: number,
    accessorial: CreateAccessorial & { entityId: number; noteThreadId?: number | null }
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!accessorial.accessorialId)
        throw new Error("Accessorial ID is required");
    if (!accessorial.accessorialName)
        throw new Error("Accessorial name is required");
    if (!accessorial.chargeType)
        throw new Error("Charge type is required");
    if (!accessorial.chargeValue)
        throw new Error("Charge value is required");
    if (!accessorial.entityId)
        throw new Error("Entity ID is required");

    return shipmentDB.createNetworkShipmentPickupAccessorial(conn, shipmentId, accessorial as any);
}

export async function createLinehaulPrimaryInfoRecord(
    conn: Connection,
    shipmentId: number,
    linehaulPrimaryInfo: CreateLinehaulPrimaryInfo & { entityId: number }
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!linehaulPrimaryInfo.entityId)
        throw new Error("Entity ID is required");
    if (!linehaulPrimaryInfo.linehaulRouting)
        throw new Error("Linehaul routing is required");

    return shipmentDB.createNetworkShipmentLinehaulPrimaryInfo(
        conn,
        shipmentId,
        linehaulPrimaryInfo as any
    );
}

export async function createLinehaulCommonInfoRecord(
    conn: Connection,
    shipmentId: number,
    linehaulCommonInfo: CreateLinehaulCommonInfo
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!linehaulCommonInfo.linehaulAccessorial)
        throw new Error("Linehaul accessorial is required");

    return shipmentDB.createNetworkLinehaulCommonInfo(conn, shipmentId, linehaulCommonInfo as any);
}

export async function createLinehaulAccessorialRecord(
    conn: Connection,
    shipmentId: number,
    accessorial: CreateAccessorial & { entityId: number; noteThreadId?: number | null }
) {
    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!accessorial.accessorialId)
        throw new Error("Accessorial ID is required");
    if (!accessorial.accessorialName)
        throw new Error("Accessorial name is required");
    if (!accessorial.chargeType)
        throw new Error("Charge type is required");
    if (!accessorial.chargeValue)
        throw new Error("Charge value is required");
    if (!accessorial.entityId)
        throw new Error("Entity ID is required");

    return shipmentDB.createNetworkShipmentLinehaulAccessorial(conn, shipmentId, accessorial as any);
}

export async function createDeliveryPrimaryInfoRecord(
    conn: Connection,
    shipmentId: number,
    deliveryPrimaryInfo: CreateDeliveryPrimaryInfo & { entityId: number }
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!deliveryPrimaryInfo.entityId)
        throw new Error("Entity ID is required");

    return shipmentDB.createNetworkShipmentDeliveryPrimaryInfo(
        conn,
        shipmentId,
        deliveryPrimaryInfo as any
    );
}

export async function createDeliveryCommonInfoRecord(
    conn: Connection,
    shipmentId: number,
    deliveryCommonInfo: CreateDeliveryCommonInfo
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!deliveryCommonInfo.deliveryAccessorial)
        throw new Error("Delivery accessorial is required");
    if (!deliveryCommonInfo.airportTransfer)
        throw new Error("Airport transfer information is required");
    if (!deliveryCommonInfo.deliveryAlert)
        throw new Error("Delivery alert information is required");

    return shipmentDB.createNetworkShipmentDeliveryCommonInfo(
        conn,
        shipmentId,
        deliveryCommonInfo as any
    );
}

export async function createDeliveryAccessorialRecord(
    conn: Connection,
    shipmentId: number,
    accessorial: CreateAccessorial & { entityId: number; noteThreadId?: number | null }
) {
    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!accessorial.accessorialId)
        throw new Error("Accessorial ID is required");
    if (!accessorial.accessorialName)
        throw new Error("Accessorial name is required");
    if (!accessorial.chargeType)
        throw new Error("Charge type is required");
    if (!accessorial.chargeValue)
        throw new Error("Charge value is required");
    if (!accessorial.entityId)
        throw new Error("Entity ID is required");

    return shipmentDB.createNetworkShipmentDeliveryAccessorial(conn, shipmentId, accessorial as any);
}

export async function createDeliveryAlertRecord(
    conn: Connection,
    shipmentId: number,
    deliveryAlertDetails: CreateDeliveryCommonInfo["deliveryAlertDetails"]
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");

    return shipmentDB.createNetworkShipementDeliveryAlertInfo(conn, shipmentId, deliveryAlertDetails as any);
}

export async function createRateInfoRecord(
    conn: Connection,
    rateDetails: CreateRateDetails
) {

    if (!rateDetails.rateType)
        throw new Error("Rate type is required");
    if (!rateDetails.rateValue)
        throw new Error("Rate value is required");
    if (!rateDetails.totalRate)
        throw new Error("Total rate is required");

    return shipmentDB.createNetworkShipmentRateInfo(conn, rateDetails as any);
}

export async function createInvoiceInfoRecord(
    conn: Connection,
    invoiceDetails: CreateInvoiceDetails
) {

    if (!invoiceDetails.shipmentId)
        throw new Error("Shipment ID is required");
    if (!invoiceDetails.subTotalRate)
        throw new Error("Invoice subtotal rate is required");
    if (!invoiceDetails.approvalStatus)
        throw new Error("Invoice approval status is required");

    return shipmentDB.createNetworkShipmentInvoiceInfo(conn, invoiceDetails as any);
}

export async function createInvoiceRateMappingRecord(
    conn: Connection,
    invoiceId: number,
    rateId: number
) {

    if (!invoiceId)
        throw new Error("Invoice ID is required");
    if (!rateId)
        throw new Error("Rate ID is required");

    return shipmentDB.createNetworkShipmentInvoiceRateMapping(conn, invoiceId, rateId);
}

export async function createCarrierRateInfoRecord(
    conn: Connection,
    shipmentId: number,
    pickupInvoiceId: number | null,
    linehaulInvoiceId: number | null,
    deliveryInvoiceId: number | null,
    totalCarrierRate: number
) {

    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (pickupInvoiceId === null && linehaulInvoiceId === null && deliveryInvoiceId === null)
        throw new Error("At least one invoice ID (pickup, linehaul, or delivery) is required");
    if (!totalCarrierRate)
        throw new Error("Total carrier rate is required");

    return shipmentDB.createNetworkShipmentCarrierRateInfo(
        conn,
        shipmentId,
        pickupInvoiceId,
        linehaulInvoiceId,
        deliveryInvoiceId,
        totalCarrierRate
    );
}

export async function createCustomerRateInfoRecord(
    conn: Connection,
    shipmentId: number,
    totalCustomerRate: number
) {
    if (!shipmentId)
        throw new Error("Shipment ID is required");
    if (!totalCustomerRate)
        throw new Error("Total customer rate is required");

    return shipmentDB.createNetworkShipmentCustomerRateInfo(conn, shipmentId, totalCustomerRate);
}

export async function createCustomerRateMappingRecord(
    conn: Connection,
    customerRateId: number,
    rateId: number
) {

    if (!customerRateId)
        throw new Error("Customer rate ID is required");
    if (!rateId)
        throw new Error("Rate ID is required");

    return shipmentDB.createNetworkShipmentCustomerRateMapping(conn, customerRateId, rateId);
}

export async function createRelatedEntityRecord(
    conn: Connection,
    entityType: Parameters<typeof entityDB.createEntity>[1],
    entityName: string
): Promise<number> {

    if (!entityType)
        throw new Error("Entity type is required");
    if (!entityName)
        throw new Error("Entity name is required");

    return entityDB.createEntity(conn, entityType, entityName);
}

export async function createNoteThreadRecord(
    conn: Connection,
    entityId: number,
    createdBy: number
): Promise<number> {

    if (!entityId)
        throw new Error("Entity ID is required");

    return noteDB.createNoteThread(conn, entityId, createdBy);
}

export async function createShipmentFlow(
    conn: Connection,
    payload: CreateShipmentPayload,
    userId: number
): Promise<CreatedShipmentFlowResult> {
    await conn.beginTransaction();

    try {
        console.log("[createShipmentFlow] Starting shipment creation flow");

        if (!payload.shipmentDetails) {
            console.log("[createShipmentFlow] No shipmentDetails provided; exiting");
            return {};
        }

        const shipmentDetails = payload.shipmentDetails as CreateShipmentDetails;
        console.log("[createShipmentFlow] Creating base shipment record", { shipmentDetails });
        const shipment = await createShipmentRecord(conn, shipmentDetails, userId);
        const shipmentId = shipment.shipmentId;
        console.log("[createShipmentFlow] Base shipment created", { shipmentId });

        const mapShipmentEntity = async (
            entityId: number | undefined,
            entityType: "SHIPPER" | "CONSIGNEE" | "AIRLINE",
            createRecord: (resolvedEntityId: number) => Promise<{ entityId?: number | null } | undefined>,
            entityLabel: string,
            entityName?: string
        ) => {
            const resolvedEntityId = entityId;
            if (resolvedEntityId) {
                console.log(`[createShipmentFlow] Mapping existing ${entityLabel} entity`, { shipmentId, entityId: resolvedEntityId });
                await shipmentDB.createShipperConsigneeAirlineMapping(conn, shipmentId, resolvedEntityId);
                return;
            }

            if (!entityName) {
                throw new Error(`Entity name is required to create ${entityLabel}`);
            }

            console.log(`[createShipmentFlow] Creating ${entityLabel} entity before record creation`, { entityName });
            const createdEntityId = await createRelatedEntityRecord(conn, entityType, entityName);

            if (!createdEntityId) {
                throw new Error(`Unable to create ${entityLabel} entity`);
            }

            console.log(`[createShipmentFlow] Creating ${entityLabel} record before mapping`, { entityId: createdEntityId });
            const createdRecord = await createRecord(createdEntityId);
            const finalEntityId = createdRecord?.entityId ?? createdEntityId;

            if (finalEntityId) {
                console.log(`[createShipmentFlow] Mapping created ${entityLabel} entity`, { shipmentId, entityId: finalEntityId });
                await shipmentDB.createShipperConsigneeAirlineMapping(conn, shipmentId, finalEntityId);
            }
        };

        const customerDetails = payload.customerDetails as CreateCustomerDetails | undefined;
        if (customerDetails) {
            console.log("[createShipmentFlow] Creating customer info", { shipmentId });
            await createCustomerInfoRecord(conn, customerDetails, shipmentId);

            if (customerDetails.customerReferenceNumbers?.length) {
                console.log("[createShipmentFlow] Creating customer reference numbers", { shipmentId, count: customerDetails.customerReferenceNumbers.length });
                for (const referenceNumber of customerDetails.customerReferenceNumbers) {
                    await createCustomerReferenceNumberRecord(conn, shipmentId, referenceNumber);
                }
            }
        }

        if (customerDetails?.airportPickupService === "N" && customerDetails.shipperDetails) {
            const shipperDetails = customerDetails.shipperDetails;
            console.log("[createShipmentFlow] Creating shipper info for airport pickup service N");
            await mapShipmentEntity(
                shipperDetails.entityId,
                "SHIPPER",
                (resolvedEntityId) => createShipperInfoRecord(conn, { ...shipperDetails, entityId: resolvedEntityId }),
                "Shipper",
                shipperDetails.shipperName
            );
        }

        if (customerDetails?.airportDeliveryService === "N" && customerDetails.consigneeDetails) {
            const consigneeDetails = customerDetails.consigneeDetails;
            console.log("[createShipmentFlow] Creating consignee info for airport delivery service N");
            await mapShipmentEntity(
                consigneeDetails.entityId,
                "CONSIGNEE",
                (resolvedEntityId) => createConsigneeInfoRecord(conn, { ...consigneeDetails, entityId: resolvedEntityId }),
                "Consignee",
                consigneeDetails.consigneeName
            );
        }

        if (customerDetails?.airportPickupService === "Y" && customerDetails.pickupAirlineDetails) {
            const pickupAirlineDetails = customerDetails.pickupAirlineDetails;
            console.log("[createShipmentFlow] Creating pickup airline info");
            await mapShipmentEntity(
                pickupAirlineDetails.entityId,
                "AIRLINE",
                (resolvedEntityId) => createAirlineRecord(conn, { ...pickupAirlineDetails, entityId: resolvedEntityId }),
                "pickup airline",
                pickupAirlineDetails.airlineName
            );
        }

        if (customerDetails?.airportDeliveryService === "Y" && customerDetails.deliveryAirlineDetails) {
            const deliveryAirlineDetails = customerDetails.deliveryAirlineDetails;
            console.log("[createShipmentFlow] Creating delivery airline info");
            await mapShipmentEntity(
                deliveryAirlineDetails.entityId,
                "AIRLINE",
                (resolvedEntityId) => createAirlineRecord(conn, { ...deliveryAirlineDetails, entityId: resolvedEntityId }),
                "delivery airline",
                deliveryAirlineDetails.airlineName
            );
        }

        const commodityDetails = payload.commodityDetails as CreateCommodityDetails | undefined;
        if (commodityDetails) {
            console.log("[createShipmentFlow] Creating commodity info", { shipmentId });
            await createCommodityInfoRecord(conn, commodityDetails, shipmentId);

            if (commodityDetails.handlingUnits?.length) {
                console.log("[createShipmentFlow] Creating handling units", { count: commodityDetails.handlingUnits.length });
                for (const handlingUnit of commodityDetails.handlingUnits) {
                    const createdHandlingUnit = await createHandlingUnitRecord(conn, handlingUnit, shipmentId);
                    console.log("[createShipmentFlow] Handling unit created", { handlingUnitId: createdHandlingUnit.handlingUnitId });

                    for (const palletDetail of handlingUnit.palletDetails ?? []) {
                        const createdItem = await createHandlingUnitItemRecord(conn, palletDetail, createdHandlingUnit.handlingUnitId);
                        console.log("[createShipmentFlow] Handling unit item created", { itemId: createdItem.itemId });

                        if (palletDetail.hazmat === "Y" && palletDetail.hazmatDetails) {
                            console.log("[createShipmentFlow] Creating hazmat info for item", { itemId: createdItem.itemId });
                            await createHazmatRecord(conn, palletDetail.hazmatDetails, createdItem.itemId);
                        }
                    }
                }
            }
        }

        const carrierDetails = payload.carrierDetails as CreateCarrierDetails | undefined;
        if (carrierDetails?.pickupDetails) {
            console.log("[createShipmentFlow] Processing pickup carrier details");
            const pickupDetails = carrierDetails.pickupDetails;
            const pickupEntityId = pickupDetails.fromLocationEntityId ??
                await createRelatedEntityRecord(conn, "PICKUP", `Pickup for shipment ${shipmentId}`);

            console.log("[createShipmentFlow] Creating pickup info", { shipmentId, pickupEntityId });
            await createPickupInfoRecord(
                conn,
                { ...pickupDetails, entityId: pickupEntityId } as CreatePickupDetails & { entityId: number },
                shipmentId
            );

            if (pickupDetails.editFromLocationDetails) {
                console.log("[createShipmentFlow] Creating pickup from address");
                const createdFromAddress = await createAddressRecord(conn, pickupDetails.editFromLocationDetails as any);
                await createEntityAddressMappingRecord(conn, pickupEntityId, createdFromAddress.addressId, "FROM", "PICKUP");
            }

            if (pickupDetails.pickupAgentTerminalDetails) {
                console.log("[createShipmentFlow] Creating pickup agent terminal info");
                await createPickupAgentTerminalRecord(
                    conn,
                    shipmentId,
                    pickupDetails.pickupAgentTerminalDetails
                );

                if (pickupDetails.pickupAgentTerminalDetails.editToLocationDetails) {
                    console.log("[createShipmentFlow] Creating pickup to address");
                    const createdToAddress = await createAddressRecord(conn, pickupDetails.pickupAgentTerminalDetails.editToLocationDetails as any);
                    const toLocationEntityId = pickupDetails.pickupAgentTerminalDetails.toLocationEntityId ?? pickupEntityId;
                    await createEntityAddressMappingRecord(conn, toLocationEntityId, createdToAddress.addressId, "TO", "PICKUP");
                }
            }

            if (pickupDetails.pickupAlert === "Y" && pickupDetails.pickupAlertDetails) {
                console.log("[createShipmentFlow] Creating pickup alert info");
                await createPickupAlertRecord(
                    conn,
                    shipmentId,
                    pickupDetails.pickupAlertDetails
                );
            }

            if (pickupDetails.pickupAccessorialDetails?.accessorials?.length) {
                console.log("[createShipmentFlow] Creating pickup accessorials", { count: pickupDetails.pickupAccessorialDetails.accessorials.length });
                for (const accessorial of pickupDetails.pickupAccessorialDetails.accessorials) {
                    const noteThreadId = await createNoteThreadRecord(conn, pickupEntityId, userId);
                    await createPickupAccessorialRecord(conn, shipmentId, {
                        ...accessorial,
                        entityId: pickupEntityId,
                        noteThreadId,
                    } as CreateAccessorial & { entityId: number; noteThreadId: number });
                }
            }
        }

        if (payload.carrierDetails?.linehaulDetails) {
            console.log("[createShipmentFlow] Processing linehaul details");
            const linehaulDetails = payload.carrierDetails.linehaulDetails;

            if ("linehaulPrimaryInfo" in linehaulDetails && linehaulDetails.linehaulPrimaryInfo) {
                console.log("[createShipmentFlow] Creating linehaul primary info");
                const linehaulEntityId = await createRelatedEntityRecord(conn, "LINEHAUL", `Linehaul for shipment ${shipmentId}`);
                const primaryInfo = linehaulDetails.linehaulPrimaryInfo as CreateLinehaulPrimaryInfo;
                await createLinehaulPrimaryInfoRecord(conn, shipmentId, {
                    ...primaryInfo,
                    entityId: linehaulEntityId,
                });

                if (linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails) {
                    console.log("[createShipmentFlow] Creating linehaul from address");
                    const createdFromAddress = await createAddressRecord(conn, linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails as any);
                    const fromEntityId = linehaulDetails.linehaulPrimaryInfo.fromLocationEntityId ?? linehaulEntityId;
                    await createEntityAddressMappingRecord(conn, fromEntityId, createdFromAddress.addressId, "FROM", "LINE_HAUL");
                }

                if (linehaulDetails.linehaulPrimaryInfo.editToLocationDetails) {
                    console.log("[createShipmentFlow] Creating linehaul to address");
                    const createdToAddress = await createAddressRecord(conn, linehaulDetails.linehaulPrimaryInfo.editToLocationDetails as any);
                    const toEntityId = linehaulDetails.linehaulPrimaryInfo.toLocationEntityId ?? linehaulEntityId;
                    await createEntityAddressMappingRecord(conn, toEntityId, createdToAddress.addressId, "TO", "LINE_HAUL");
                }
            }

            if (linehaulDetails.linehaulCommonInfo) {
                console.log("[createShipmentFlow] Creating linehaul common info");
                await createLinehaulCommonInfoRecord(
                    conn,
                    shipmentId,
                    linehaulDetails.linehaulCommonInfo as CreateLinehaulCommonInfo
                );

                const linehaulEntityId = await createRelatedEntityRecord(conn, "LINEHAUL", `Linehaul accessorials for shipment ${shipmentId}`);
                if (linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails?.accessorials?.length) {
                    console.log("[createShipmentFlow] Creating linehaul accessorials", { count: linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails.accessorials.length });
                }
                for (const accessorial of linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails?.accessorials ?? []) {
                    const noteThreadId = await createNoteThreadRecord(conn, linehaulEntityId, userId);
                    await createLinehaulAccessorialRecord(conn, shipmentId, {
                        ...accessorial,
                        entityId: linehaulEntityId,
                        noteThreadId,
                    } as CreateAccessorial & { entityId: number; noteThreadId: number });
                }
            }
        }

        if (payload.carrierDetails?.deliveryDetails) {
            console.log("[createShipmentFlow] Processing delivery details");
            const deliveryDetails = payload.carrierDetails.deliveryDetails;

            if ("deliveryPrimaryInfo" in deliveryDetails && deliveryDetails.deliveryPrimaryInfo) {
                console.log("[createShipmentFlow] Creating delivery primary info");
                const deliveryEntityId = await createRelatedEntityRecord(conn, "DELIVERY", `Delivery for shipment ${shipmentId}`);
                const primaryInfo = deliveryDetails.deliveryPrimaryInfo as CreateDeliveryPrimaryInfo;
                await createDeliveryPrimaryInfoRecord(conn, shipmentId, {
                    ...primaryInfo,
                    entityId: deliveryEntityId,
                });

                if (deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails) {
                    console.log("[createShipmentFlow] Creating delivery from address");
                    const createdFromAddress = await createAddressRecord(conn, deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails as any);
                    const fromEntityId = deliveryDetails.deliveryPrimaryInfo.fromLocationEntityId ?? deliveryEntityId;
                    await createEntityAddressMappingRecord(conn, fromEntityId, createdFromAddress.addressId, "FROM", "DELIVERY");
                }

                if (deliveryDetails.deliveryPrimaryInfo.editToLocationDetails) {
                    console.log("[createShipmentFlow] Creating delivery to address");
                    const createdToAddress = await createAddressRecord(conn, deliveryDetails.deliveryPrimaryInfo.editToLocationDetails as any);
                    const toEntityId = deliveryDetails.deliveryPrimaryInfo.toLocationEntityId ?? deliveryEntityId;
                    await createEntityAddressMappingRecord(conn, toEntityId, createdToAddress.addressId, "TO", "DELIVERY");
                }
            }

            if (deliveryDetails.deliveryCommonInfo) {
                console.log("[createShipmentFlow] Creating delivery common info");
                await createDeliveryCommonInfoRecord(
                    conn,
                    shipmentId,
                    deliveryDetails.deliveryCommonInfo as CreateDeliveryCommonInfo
                );

                const deliveryEntityId = await createRelatedEntityRecord(conn, "DELIVERY", `Delivery accessorials for shipment ${shipmentId}`);
                if (deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails?.accessorials?.length) {
                    console.log("[createShipmentFlow] Creating delivery accessorials", { count: deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails.accessorials.length });
                }
                for (const accessorial of deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails?.accessorials ?? []) {
                    const noteThreadId = await createNoteThreadRecord(conn, deliveryEntityId, userId);
                    await createDeliveryAccessorialRecord(conn, shipmentId, {
                        ...accessorial,
                        entityId: deliveryEntityId,
                        noteThreadId,
                    } as CreateAccessorial & { entityId: number; noteThreadId: number });
                }

                if (deliveryDetails.deliveryCommonInfo.deliveryAlert === "Y" && deliveryDetails.deliveryCommonInfo.deliveryAlertDetails) {
                    console.log("[createShipmentFlow] Creating delivery alert info");
                    await createDeliveryAlertRecord(
                        conn,
                        shipmentId,
                        deliveryDetails.deliveryCommonInfo.deliveryAlertDetails as CreateDeliveryCommonInfo["deliveryAlertDetails"]
                    );
                }
            }
        }

        if (payload.shipmentRateDetails) {
            console.log("[createShipmentFlow] Processing shipment rate details");
            if (payload.shipmentRateDetails?.carrierRateDetails) {
                const carrierRateDetails = payload.shipmentRateDetails.carrierRateDetails;
                console.log("[createShipmentFlow] Creating carrier rate invoices");

                const pickupInvoice = carrierRateDetails.pickupRateDetails
                    ? await createInvoiceInfoRecord(conn, {
                        shipmentId,
                        invoiceNumber: carrierRateDetails.pickupRateDetails.invoiceNumber as string,
                        invoiceType: "PICKUP",
                        subTotalRate: carrierRateDetails.pickupRateDetails.pickupSubTotalRate as number,
                        approvalStatus: carrierRateDetails.pickupRateDetails.invoiceApprovalStatus as 'Y' | 'N',
                        approvedBy: carrierRateDetails.pickupRateDetails.approvedBy,
                        approvedDate: carrierRateDetails.pickupRateDetails.approvedDate as Date | undefined,
                    } as CreateInvoiceDetails)
                    : null;

                if (pickupInvoice && carrierRateDetails.pickupRateDetails?.rateDetails?.length) {
                    console.log("[createShipmentFlow] Creating pickup rate details");
                    for (const rateDetail of carrierRateDetails.pickupRateDetails.rateDetails) {
                        const createdRate = await createRateInfoRecord(conn, rateDetail as CreateRateDetails);
                        await createInvoiceRateMappingRecord(conn, pickupInvoice.invoiceId, createdRate.rateId);
                    }
                }

                const linehaulInvoice = carrierRateDetails.linehaulRateDetails
                    ? await createInvoiceInfoRecord(conn, {
                        shipmentId,
                        invoiceNumber: carrierRateDetails.linehaulRateDetails.invoiceNumber as string,
                        invoiceType: "LINE_HAUL",
                        subTotalRate: carrierRateDetails.linehaulRateDetails.linehaulSubTotalRate as number,
                        approvalStatus: carrierRateDetails.linehaulRateDetails.invoiceApprovalStatus as 'Y' | 'N',
                        approvedBy: carrierRateDetails.linehaulRateDetails.approvedBy,
                        approvedDate: carrierRateDetails.linehaulRateDetails.approvedDate as Date | undefined,
                    } as CreateInvoiceDetails)
                    : null;

                if (linehaulInvoice && carrierRateDetails.linehaulRateDetails?.rateDetails?.length) {
                    console.log("[createShipmentFlow] Creating linehaul rate details");
                    for (const rateDetail of carrierRateDetails.linehaulRateDetails.rateDetails) {
                        const createdRate = await createRateInfoRecord(conn, rateDetail as CreateRateDetails);
                        await createInvoiceRateMappingRecord(conn, linehaulInvoice.invoiceId, createdRate.rateId);
                    }
                }

                const deliveryInvoice = carrierRateDetails.deliveryRateDetails
                    ? await createInvoiceInfoRecord(conn, {
                        shipmentId,
                        invoiceNumber: carrierRateDetails.deliveryRateDetails.invoiceNumber as string,
                        invoiceType: "DELIVERY",
                        subTotalRate: carrierRateDetails.deliveryRateDetails.deliverySubTotalRate as number,
                        approvalStatus: carrierRateDetails.deliveryRateDetails.invoiceApprovalStatus as 'Y' | 'N',
                        approvedBy: carrierRateDetails.deliveryRateDetails.approvedBy,
                        approvedDate: carrierRateDetails.deliveryRateDetails.approvedDate as Date | undefined,
                    } as CreateInvoiceDetails)
                    : null;

                if (deliveryInvoice && carrierRateDetails.deliveryRateDetails?.rateDetails?.length) {
                    console.log("[createShipmentFlow] Creating delivery rate details");
                    for (const rateDetail of carrierRateDetails.deliveryRateDetails.rateDetails) {
                        const createdRate = await createRateInfoRecord(conn, rateDetail as CreateRateDetails);
                        await createInvoiceRateMappingRecord(conn, deliveryInvoice.invoiceId, createdRate.rateId);
                    }
                }

                if (carrierRateDetails.totalCarrierRate !== undefined) {
                    console.log("[createShipmentFlow] Creating carrier rate summary");
                    await createCarrierRateInfoRecord(
                        conn,
                        shipmentId,
                        pickupInvoice?.invoiceId ?? null,
                        linehaulInvoice?.invoiceId ?? null,
                        deliveryInvoice?.invoiceId ?? null,
                        carrierRateDetails.totalCarrierRate as number
                    );
                }
            }

            if (payload.shipmentRateDetails.customerRateDetails) {
                const customerRate = payload.shipmentRateDetails.customerRateDetails;
                console.log("[createShipmentFlow] Creating customer rate summary");
                const createdCustomerRate = await createCustomerRateInfoRecord(conn, shipmentId, customerRate.totalCustomerRate as number);

                if (customerRate.rateDetails?.length) {
                    console.log("[createShipmentFlow] Creating customer rate details");
                    for (const rateDetail of customerRate.rateDetails) {
                        const createdRate = await createRateInfoRecord(conn, rateDetail as CreateRateDetails);
                        await createCustomerRateMappingRecord(conn, createdCustomerRate.customerRateId, createdRate.rateId);
                    }
                }
            }
        }

        console.log("[createShipmentFlow] Shipment creation flow completed", { shipmentId });

        await conn.commit();
        return { shipmentId };
    }
    catch (error) {
        await conn.rollback();
        throw error;
    }
}
