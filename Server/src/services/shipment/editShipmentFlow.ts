import { Connection } from "odbc";
import {
    UpdateShipmentPayload,
    UpdateShipmentDetails,
    UpdateCustomerDetails,
    UpdateCustomerReferenceNumber,
    UpdateShipperDetails,
    UpdateConsigneeDetails,
    UpdateAirlineDetails,
    UpdateCommodityDetails,
    UpdateHandlingUnitDetails,
    UpdateAddressDetail,
    UpdatePickupDetails,
    UpdateLinehaulDetails,
    UpdateDeliveryDetails,
    UpdateCarrierDetails,
} from "../../entities/shipment";
import * as shipmentDB from "../../database/shipment/editShipment";
import * as shipmentIndexDB from "../../database/shipment";
import * as entityDB from "../../database/maintenance";
import * as noteDB from "../../database/maintenance/note";

export interface UpdatedShipmentFlowResult {
    shipmentId?: number;
}

export async function editShipmentRecord(
    conn: Connection,
    shipmentId: number,
    shipmentDetails: UpdateShipmentDetails,
    userId: number
) {
    console.log("[editShipmentFlow] editShipmentRecord start", { shipmentId, userId, shipmentDetails });

    if (!shipmentId) throw new Error("Shipment ID is required");
    if (!shipmentDetails.typeOfShipment && !shipmentDetails.serviceLevel && !shipmentDetails.status && !shipmentDetails.shipmentDate && !shipmentDetails.shipmentTime) {
        console.log("[editShipmentFlow] editShipmentRecord validation failed", { shipmentId, shipmentDetails });
        throw new Error("At least one shipment field is required for update");
    }

    const payload: Record<string, any> = {
        ...shipmentDetails,
        updatedBy: userId,
    };

    console.log("[editShipmentFlow] updating network shipment", { shipmentId, payload });
    await shipmentDB.updateNetworkShipment(conn, shipmentId, payload);
    console.log("[editShipmentFlow] editShipmentRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editCustomerInfoRecord(
    conn: Connection,
    shipmentId: number,
    customerDetails: UpdateCustomerDetails
) {
    console.log("[editShipmentFlow] editCustomerInfoRecord start", { shipmentId, customerDetails });

    if (!shipmentId) throw new Error("Shipment ID is required");
    const payload: Record<string, any> = {
        customerId: customerDetails.customerId,
        stationId: customerDetails.stationId,
        airportPickupService: customerDetails.airportPickupService,
        originAirportCode: customerDetails.originAirportCode,
        airportDeliveryService: customerDetails.airportDeliveryService,
        destinationAirportCode: customerDetails.destinationAirportCode,
    };

    console.log("[editShipmentFlow] upserting customer info", { shipmentId, payload });
    await shipmentDB.upsertCustomerInfo(conn, shipmentId, payload);
    console.log("[editShipmentFlow] editCustomerInfoRecord complete", { shipmentId });
    return { shipmentId };
}

type DeleteableRecord = { id?: number; delete?: boolean };

function normalizeDeleteableRecords<T extends DeleteableRecord>(items: T[] = []): T[] {
    return items.filter((item) => !(item.delete === true));
}

function getCustomerReferenceNumbers(customerDetails: UpdateCustomerDetails): UpdateCustomerReferenceNumber[] {
    const values = ((customerDetails as any)?.customerReferenceNumbers ?? (customerDetails as any)?.referenceNumbers ?? []) as Array<UpdateCustomerReferenceNumber & DeleteableRecord>;
    return normalizeDeleteableRecords(values) as UpdateCustomerReferenceNumber[];
}

function getShipperDetail(customerDetails: UpdateCustomerDetails): (UpdateShipperDetails & { delete?: boolean }) | undefined {
    return ((customerDetails as any)?.shipperDetails ?? (customerDetails as any)?.shipper) as (UpdateShipperDetails & { delete?: boolean }) | undefined;
}

function getConsigneeDetail(customerDetails: UpdateCustomerDetails): (UpdateConsigneeDetails & { delete?: boolean }) | undefined {
    return ((customerDetails as any)?.consigneeDetails ?? (customerDetails as any)?.consignee) as (UpdateConsigneeDetails & { delete?: boolean }) | undefined;
}

export async function editCustomerReferenceNumberRecord(
    conn: Connection,
    shipmentId: number,
    referenceNumbers: UpdateCustomerReferenceNumber[] = []
) {
    console.log("[editShipmentFlow] editCustomerReferenceNumberRecord start", { shipmentId, referenceNumbers });
    const payload = normalizeDeleteableRecords(referenceNumbers);
    console.log("[editShipmentFlow] filtered customer reference numbers", { shipmentId, payload });
    await shipmentDB.replaceCustomerReferenceNumbers(conn, shipmentId, payload as any[]);
    console.log("[editShipmentFlow] editCustomerReferenceNumberRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editShipperInfoRecord(
    conn: Connection,
    shipmentId: number,
    shipperDetails: UpdateShipperDetails & { delete?: boolean }
) {
    console.log("[editShipmentFlow] editShipperInfoRecord start", { shipmentId, shipperDetails });

    if (shipperDetails.delete === true) {
        console.log("[editShipmentFlow] deleting shipper mapping", { shipmentId, entityId: shipperDetails.entityId ?? shipperDetails.shipperId });
        await shipmentDB.deleteShipmentEntityMapping(conn, shipmentId, shipperDetails.entityId ?? shipperDetails.shipperId, "SHIPPER");
        return { shipmentId, deleted: true };
    }

    if (!shipperDetails.entityId && !shipperDetails.shipperId && !shipperDetails.shipperName) {
        console.log("[editShipmentFlow] shipper validation failed", { shipmentId, shipperDetails });
        throw new Error("Shipper ID, entity ID, or name is required");
    }

    let entityId = shipperDetails.entityId;

    if (!entityId && shipperDetails.shipperId) {
        const existingShipper = await shipmentIndexDB.getShipperById(conn, shipperDetails.shipperId);
        if (!existingShipper) {
            throw new Error("Invalid shipperId provided");
        }
        entityId = existingShipper.entityId;
        console.log("[editShipmentFlow] resolved shipper entityId from shipperId", { shipmentId, shipperId: shipperDetails.shipperId, entityId });
    }

    if (!entityId && shipperDetails.shipperName) {
        entityId = await createRelatedEntityRecord(conn, "SHIPPER", shipperDetails.shipperName);
        console.log("[editShipmentFlow] created new shipper entity", { shipmentId, entityId, shipperName: shipperDetails.shipperName });

        await shipmentDB.upsertShipperInfo(conn, {
            ...shipperDetails,
            shipmentId,
            entityId,
        });
        console.log("[editShipmentFlow] created new shipper info row", { shipmentId, entityId, shipperName: shipperDetails.shipperName });
    }

    if (!entityId) {
        console.log("[editShipmentFlow] shipper entity not resolved", { shipmentId, shipperDetails });
        throw new Error("Unable to resolve shipper entity");
    }

    const mappedEntityId = await shipmentDB.replaceShipmentEntityMapping(
        conn,
        shipmentId,
        entityId,
        "SHIPPER",
        shipperDetails.shipperName ?? "SHIPPER"
    );

    console.log("[editShipmentFlow] shipper mapping updated", { shipmentId, mappedEntityId, entityId });
    return { shipmentId, entityId: mappedEntityId ?? entityId };
}

export async function editConsigneeInfoRecord(
    conn: Connection,
    shipmentId: number,
    consigneeDetails: UpdateConsigneeDetails & { delete?: boolean }
) {
    console.log("[editShipmentFlow] editConsigneeInfoRecord start", { shipmentId, consigneeDetails });

    if (consigneeDetails.delete === true) {
        console.log("[editShipmentFlow] deleting consignee mapping", { shipmentId, entityId: consigneeDetails.entityId ?? consigneeDetails.consigneeId });
        await shipmentDB.deleteShipmentEntityMapping(conn, shipmentId, consigneeDetails.entityId ?? consigneeDetails.consigneeId, "CONSIGNEE");
        return { shipmentId, deleted: true };
    }

    if (!consigneeDetails.entityId && !consigneeDetails.consigneeId && !consigneeDetails.consigneeName) {
        console.log("[editShipmentFlow] consignee validation failed", { shipmentId, consigneeDetails });
        throw new Error("Consignee ID, entity ID, or name is required");
    }

    let entityId = consigneeDetails.entityId;

    if (!entityId && consigneeDetails.consigneeId) {
        const existingConsignee = await shipmentIndexDB.getConsigneeById(conn, consigneeDetails.consigneeId);
        if (!existingConsignee) {
            throw new Error("Invalid consigneeId provided");
        }
        entityId = existingConsignee.entityId;
        console.log("[editShipmentFlow] resolved consignee entityId from consigneeId", { shipmentId, consigneeId: consigneeDetails.consigneeId, entityId });
    }

    if (!entityId && consigneeDetails.consigneeName) {
        entityId = await createRelatedEntityRecord(conn, "CONSIGNEE", consigneeDetails.consigneeName);
        console.log("[editShipmentFlow] created new consignee entity", { shipmentId, entityId, consigneeName: consigneeDetails.consigneeName });

        await shipmentDB.upsertConsigneeInfo(conn, {
            ...consigneeDetails,
            shipmentId,
            entityId,
        });
        console.log("[editShipmentFlow] created new consignee info row", { shipmentId, entityId, consigneeName: consigneeDetails.consigneeName });
    }

    if (!entityId) {
        console.log("[editShipmentFlow] consignee entity not resolved", { shipmentId, consigneeDetails });
        throw new Error("Unable to resolve consignee entity");
    }

    const mappedEntityId = await shipmentDB.replaceShipmentEntityMapping(
        conn,
        shipmentId,
        entityId,
        "CONSIGNEE",
        consigneeDetails.consigneeName ?? "CONSIGNEE"
    );

    console.log("[editShipmentFlow] consignee mapping updated", { shipmentId, mappedEntityId, entityId });
    return { shipmentId, entityId: mappedEntityId ?? entityId };
}

export async function editAirlineRecord(
    conn: Connection,
    shipmentId: number,
    airlineDetails: UpdateAirlineDetails
) {
    console.log("[editShipmentFlow] editAirlineRecord start", { shipmentId, airlineDetails });

    if (!airlineDetails.entityId && !airlineDetails.airlineName) {
        console.log("[editShipmentFlow] airline validation failed", { shipmentId, airlineDetails });
        throw new Error("Airline entity ID or airline name is required");
    }

    let entityId = airlineDetails.entityId;

    if (!entityId && airlineDetails.airlineId) {
        const existingAirline = await shipmentIndexDB.getAirlineById(conn, airlineDetails.airlineId);
        if (!existingAirline) {
            throw new Error("Invalid airlineId provided");
        }
        entityId = existingAirline.entityId;
        console.log("[editShipmentFlow] resolved airline entityId from airlineId", { shipmentId, airlineId: airlineDetails.airlineId, entityId });
    }

    if (!entityId && airlineDetails.airlineName) {
        entityId = await createRelatedEntityRecord(conn, "AIRLINE", airlineDetails.airlineName);
        console.log("[editShipmentFlow] created new airline entity", { shipmentId, entityId, airlineName: airlineDetails.airlineName });
    }

    const result = await shipmentDB.upsertAirlineInfo(conn, {
        ...airlineDetails,
        shipmentId,
        entityId,
    });
    console.log("[editShipmentFlow] airline upsert result", { shipmentId, result, entityId });

    const mappedEntityId = result?.entityId ?? entityId;
    if (mappedEntityId) {
        await shipmentDB.replaceShipmentEntityMapping(conn, shipmentId, mappedEntityId, "AIRLINE", airlineDetails.airlineName ?? "AIRLINE");
    }

    console.log("[editShipmentFlow] editAirlineRecord complete", { shipmentId, result, entityId: mappedEntityId });
    return result ?? { entityId: mappedEntityId };
}

export async function editCommodityInfoRecord(
    conn: Connection,
    shipmentId: number,
    commodityDetails: UpdateCommodityDetails
) {
    console.log("[editShipmentFlow] editCommodityInfoRecord start", { shipmentId, commodityDetails });

    if (!shipmentId) throw new Error("Shipment ID is required");
    await shipmentDB.upsertCommodityInfo(conn, shipmentId, commodityDetails as Record<string, any>);
    console.log("[editShipmentFlow] editCommodityInfoRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editHandlingUnitsRecord(
    conn: Connection,
    shipmentId: number,
    handlingUnits: UpdateHandlingUnitDetails[] = []
) {
    console.log("[editShipmentFlow] editHandlingUnitsRecord start", { shipmentId, handlingUnits });
    await shipmentDB.replaceHandlingUnits(conn, shipmentId, handlingUnits as any[]);
    console.log("[editShipmentFlow] editHandlingUnitsRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editPickupInfoRecord(
    conn: Connection,
    shipmentId: number,
    pickupDetails: UpdatePickupDetails & { entityId?: number },
    userId: number
) {
    console.log("[editShipmentFlow] editPickupInfoRecord start", { shipmentId, userId, pickupDetails });
    if (!shipmentId) throw new Error("Shipment ID is required");

    const existingEntityId = await shipmentDB.getExistingPickupEntityId(conn, shipmentId);
    const entityId = pickupDetails.entityId ?? pickupDetails.fromLocationEntityId ?? existingEntityId;
    if (!entityId) {
        throw new Error("Pickup entityId is required. Provide entityId/fromLocationEntityId or ensure the shipment has an existing pickup record.");
    }

    const accessorials = pickupDetails.pickupAccessorialDetails?.accessorials ?? [];
    const accessorialsWithNoteThreads = await Promise.all(
        accessorials.map(async (accessorial: any) => ({
            ...accessorial,
            entityId: accessorial.entityId ?? entityId,
            noteThreadId: accessorial.noteThreadId ?? await createNoteThreadRecord(conn, accessorial.entityId ?? entityId, userId),
        }))
    );

    const resolvedPickupDetails = {
        ...pickupDetails,
        entityId,
        pickupAccessorialDetails: pickupDetails.pickupAccessorialDetails
            ? { ...pickupDetails.pickupAccessorialDetails, accessorials: accessorialsWithNoteThreads }
            : undefined,
    };

    console.log("[editShipmentFlow] resolved pickup identifiers", {
        shipmentId,
        entityId,
        existingEntityId,
        accessorialCount: accessorialsWithNoteThreads.length,
        noteThreadIds: accessorialsWithNoteThreads.map((accessorial) => accessorial.noteThreadId),
    });
    await shipmentDB.replacePickupInfo(conn, shipmentId, resolvedPickupDetails as Record<string, any>);
    console.log("[editShipmentFlow] editPickupInfoRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editLinehaulInfoRecord(
    conn: Connection,
    shipmentId: number,
    linehaulDetails: UpdateLinehaulDetails,
    userId: number
) {
    console.log("[editShipmentFlow] editLinehaulInfoRecord start", { shipmentId, userId, linehaulDetails });
    if (!shipmentId) throw new Error("Shipment ID is required");

    const primary = linehaulDetails.linehaulPrimaryInfo;
    const existingEntityId = await shipmentDB.getExistingLinehaulEntityId(conn, shipmentId);
    const entityId = primary?.entityId ?? existingEntityId ?? (
        primary
            ? await createRelatedEntityRecord(conn, "LINEHAUL", `Linehaul for shipment ${shipmentId}`)
            : undefined
    );
    const accessorials = linehaulDetails.linehaulCommonInfo?.linehaulAccessorialDetails?.accessorials ?? [];
    if (!entityId && (primary || accessorials.length > 0)) {
        throw new Error("Linehaul entityId is required. Provide it or ensure the shipment has an existing linehaul record.");
    }

    if (primary || accessorials.length > 0) {
        const accessorialsWithNoteThreads = await Promise.all(
            accessorials.map(async (accessorial: any) => ({
                ...accessorial,
                entityId: accessorial.entityId ?? entityId,
                noteThreadId: accessorial.noteThreadId ?? await createNoteThreadRecord(conn, accessorial.entityId ?? entityId, userId),
            }))
        );

        linehaulDetails = {
            ...linehaulDetails,
            linehaulPrimaryInfo: primary ? { ...primary, entityId } : undefined,
            linehaulCommonInfo: linehaulDetails.linehaulCommonInfo
                ? {
                    ...linehaulDetails.linehaulCommonInfo,
                    linehaulAccessorialDetails: linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails
                        ? { ...linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails, accessorials: accessorialsWithNoteThreads }
                        : undefined,
                }
                : undefined,
        };

        console.log("[editShipmentFlow] resolved linehaul identifiers", {
            shipmentId,
            userId,
            entityId,
            existingEntityId,
            accessorialCount: accessorialsWithNoteThreads.length,
            noteThreadIds: accessorialsWithNoteThreads.map((accessorial) => accessorial.noteThreadId),
        });
    }

    await shipmentDB.replaceLinehaulInfo(conn, shipmentId, linehaulDetails as Record<string, any>);
    console.log("[editShipmentFlow] editLinehaulInfoRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editDeliveryInfoRecord(
    conn: Connection,
    shipmentId: number,
    deliveryDetails: UpdateDeliveryDetails,
    userId: number
) {
    console.log("[editShipmentFlow] editDeliveryInfoRecord start", { shipmentId, userId, deliveryDetails });
    if (!shipmentId) throw new Error("Shipment ID is required");

    const primary = deliveryDetails.deliveryPrimaryInfo;
    const existingEntityId = await shipmentDB.getExistingDeliveryEntityId(conn, shipmentId);
    const entityId = primary?.entityId ?? existingEntityId ?? (
        primary
            ? await createRelatedEntityRecord(conn, "DELIVERY", `Delivery for shipment ${shipmentId}`)
            : undefined
    );
    const accessorials = deliveryDetails.deliveryCommonInfo?.deliveryAccessorialDetails?.accessorials ?? [];
    if (!entityId && (primary || accessorials.length > 0)) {
        throw new Error("Delivery entityId is required. Provide it or ensure the shipment has an existing delivery record.");
    }

    if (primary || accessorials.length > 0) {
        const accessorialsWithNoteThreads = await Promise.all(
            accessorials.map(async (accessorial: any) => ({
                ...accessorial,
                entityId: accessorial.entityId ?? entityId,
                noteThreadId: accessorial.noteThreadId ?? await createNoteThreadRecord(conn, accessorial.entityId ?? entityId, userId),
            }))
        );

        deliveryDetails = {
            ...deliveryDetails,
            deliveryPrimaryInfo: primary ? { ...primary, entityId } : undefined,
            deliveryCommonInfo: deliveryDetails.deliveryCommonInfo
                ? {
                    ...deliveryDetails.deliveryCommonInfo,
                    deliveryAccessorialDetails: deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails
                        ? { ...deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails, accessorials: accessorialsWithNoteThreads }
                        : undefined,
                }
                : undefined,
        };
        console.log("[editShipmentFlow] resolved delivery identifiers", {
            shipmentId,
            userId,
            entityId,
            existingEntityId,
            accessorialCount: accessorialsWithNoteThreads.length,
            noteThreadIds: accessorialsWithNoteThreads.map((accessorial) => accessorial.noteThreadId),
        });
    }

    await shipmentDB.replaceDeliveryInfo(conn, shipmentId, deliveryDetails as Record<string, any>);
    console.log("[editShipmentFlow] editDeliveryInfoRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editRateInfoRecord(
    conn: Connection,
    shipmentId: number,
    rateDetails: Record<string, any>
) {
    console.log("[editShipmentFlow] editRateInfoRecord start", { shipmentId, rateDetails });
    if (!shipmentId) throw new Error("Shipment ID is required");
    await shipmentDB.replaceRateDetails(conn, shipmentId, rateDetails);
    console.log("[editShipmentFlow] editRateInfoRecord complete", { shipmentId });
    return { shipmentId };
}

export async function editAddressRecord(
    conn: Connection,
    entityId: number,
    address: UpdateAddressDetail,
    addressType: "FROM" | "TO",
    locationType: "PICKUP" | "LINE_HAUL" | "DELIVERY"
) {
    if (!entityId) throw new Error("Entity ID is required");
    if (!address.addressLine1) throw new Error("Address line 1 is required");
    if (!address.city) throw new Error("City is required");
    if (!address.state) throw new Error("State is required");
    if (!address.zipCode) throw new Error("Zip code is required");

    const createdAddress = await shipmentDB.createNetworkShipmentAddress(conn, address as any);
    await shipmentDB.createNetworkShipmentEntityAddressMapping(conn, entityId, createdAddress.addressId, addressType, locationType);
    return createdAddress;
}

export async function createRelatedEntityRecord(
    conn: Connection,
    entityType: Parameters<typeof entityDB.createEntity>[1],
    entityName: string
): Promise<number> {
    if (!entityType) throw new Error("Entity type is required");
    if (!entityName) throw new Error("Entity name is required");

    return entityDB.createEntity(conn, entityType, entityName);
}

export async function createNoteThreadRecord(
    conn: Connection,
    entityId: number,
    createdBy: number
): Promise<number> {
    if (!entityId) throw new Error("Entity ID is required");
    return noteDB.createNoteThread(conn, entityId, createdBy);
}

export async function editShipmentFlow(
    conn: Connection,
    shipmentId: number,
    payload: UpdateShipmentPayload,
    userId: number
): Promise<UpdatedShipmentFlowResult> {
    console.log("[editShipmentFlow] start", { shipmentId, userId, payload });
    await conn.beginTransaction();

    try {
        if (!payload.shipmentDetails && !payload.customerDetails && !payload.commodityDetails && !payload.carrierDetails && !payload.shipmentRateDetails) {
            console.log("[editShipmentFlow] no update data provided", { shipmentId, payload });
            throw new Error("No shipment update data provided");
        }

        if (payload.shipmentDetails) {
            console.log("[editShipmentFlow] processing shipmentDetails");
            await editShipmentRecord(conn, shipmentId, payload.shipmentDetails as UpdateShipmentDetails, userId);
        }

        const customerDetails = payload.customerDetails as UpdateCustomerDetails | undefined;
        if (customerDetails) {
            console.log("[editShipmentFlow] processing customerDetails", { shipmentId, customerDetails });
            await editCustomerInfoRecord(conn, shipmentId, customerDetails);
            const customerReferenceNumbers = getCustomerReferenceNumbers(customerDetails);
            console.log("[editShipmentFlow] customerReferenceNumbers", { shipmentId, customerReferenceNumbers, customerDetails });
            if (customerReferenceNumbers.length || (customerDetails as any)?.customerReferenceNumbers || (customerDetails as any)?.referenceNumbers) {
                await editCustomerReferenceNumberRecord(conn, shipmentId, customerReferenceNumbers);
            }
        }

        const isPickupAirlineFlow = customerDetails?.airportPickupService === "Y";
        const isDeliveryAirlineFlow = customerDetails?.airportDeliveryService === "Y";
        const shipperDetails = customerDetails && !isPickupAirlineFlow ? getShipperDetail(customerDetails) : undefined;
        const consigneeDetails = customerDetails && !isDeliveryAirlineFlow ? getConsigneeDetail(customerDetails) : undefined;
        const pickupAirlineDetails = customerDetails && isPickupAirlineFlow ? customerDetails.pickupAirlineDetails : undefined;
        const deliveryAirlineDetails = customerDetails && isDeliveryAirlineFlow ? customerDetails.deliveryAirlineDetails : undefined;

        if (isPickupAirlineFlow) {
            console.log("[editShipmentFlow] removing old shipper mapping for airline-only pickup flow", { shipmentId });
            await shipmentDB.deleteShipmentEntityMappingsByType(conn, shipmentId, "SHIPPER");
        }

        if (!isPickupAirlineFlow) {
            console.log("[editShipmentFlow] removing old pickup airline mapping when switching to shipper", {
                shipmentId,
                originAirportCode: customerDetails?.originAirportCode ?? null,
            });
            await shipmentDB.deleteShipmentAirlineMappingsByAirportCode(conn, shipmentId, customerDetails?.originAirportCode ?? null);
        }

        if (isDeliveryAirlineFlow) {
            console.log("[editShipmentFlow] removing old consignee mapping for airline-only delivery flow", { shipmentId });
            await shipmentDB.deleteShipmentEntityMappingsByType(conn, shipmentId, "CONSIGNEE");
        }

        if (!isDeliveryAirlineFlow) {
            console.log("[editShipmentFlow] removing old delivery airline mapping when switching to consignee", {
                shipmentId,
                destinationAirportCode: customerDetails?.destinationAirportCode ?? null,
            });
            await shipmentDB.deleteShipmentAirlineMappingsByAirportCode(conn, shipmentId, customerDetails?.destinationAirportCode ?? null);
        }

        if (shipperDetails) {
            console.log("[editShipmentFlow] processing shipperDetails", { shipmentId, shipperDetails });
            await editShipperInfoRecord(conn, shipmentId, shipperDetails);
        }

        if (consigneeDetails) {
            console.log("[editShipmentFlow] processing consigneeDetails", { shipmentId, consigneeDetails });
            await editConsigneeInfoRecord(conn, shipmentId, consigneeDetails);
        }

        if (pickupAirlineDetails) {
            console.log("[editShipmentFlow] processing pickup airline details", { shipmentId, pickupAirlineDetails });
            await editAirlineRecord(conn, shipmentId, pickupAirlineDetails);
        }

        if (deliveryAirlineDetails) {
            console.log("[editShipmentFlow] processing delivery airline details", { shipmentId, deliveryAirlineDetails });
            await editAirlineRecord(conn, shipmentId, deliveryAirlineDetails);
        }

        const commodityDetails = payload.commodityDetails as UpdateCommodityDetails | undefined;
        if (commodityDetails) {
            console.log("[editShipmentFlow] processing commodityDetails", { shipmentId, commodityDetails });
            await editCommodityInfoRecord(conn, shipmentId, commodityDetails);
            if (commodityDetails.handlingUnits?.length) {
                console.log("[editShipmentFlow] processing handlingUnits", { shipmentId, handlingUnits: commodityDetails.handlingUnits });
                await editHandlingUnitsRecord(conn, shipmentId, commodityDetails.handlingUnits);
            }
        }

        const carrierDetails = payload.carrierDetails as UpdateCarrierDetails | undefined;
        if (carrierDetails?.pickupDetails) {
            console.log("[editShipmentFlow] processing pickupDetails", { shipmentId, pickupDetails: carrierDetails.pickupDetails });
            await editPickupInfoRecord(conn, shipmentId, carrierDetails.pickupDetails as UpdatePickupDetails & { entityId?: number }, userId);
        }

        if (carrierDetails?.linehaulDetails) {
            console.log("[editShipmentFlow] processing linehaulDetails", { shipmentId, linehaulDetails: carrierDetails.linehaulDetails });
            await editLinehaulInfoRecord(conn, shipmentId, carrierDetails.linehaulDetails as UpdateLinehaulDetails, userId);
        }

        if (carrierDetails?.deliveryDetails) {
            console.log("[editShipmentFlow] processing deliveryDetails", { shipmentId, deliveryDetails: carrierDetails.deliveryDetails });
            await editDeliveryInfoRecord(conn, shipmentId, carrierDetails.deliveryDetails as UpdateDeliveryDetails, userId);
        }

        if (payload.shipmentRateDetails) {
            console.log("[editShipmentFlow] processing shipmentRateDetails", { shipmentId, shipmentRateDetails: payload.shipmentRateDetails });
            await editRateInfoRecord(conn, shipmentId, payload.shipmentRateDetails as Record<string, any>);
        }

        console.log("[editShipmentFlow] committing transaction", { shipmentId });
        await conn.commit();
        console.log("[editShipmentFlow] complete", { shipmentId });
        return { shipmentId };
    } catch (error) {
        console.error("[editShipmentFlow] error caught, rolling back", { shipmentId, error });
        await conn.rollback();
        throw error;
    }
}
