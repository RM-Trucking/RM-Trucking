import { Connection } from "odbc";
import {
    CreateNetworkShipmentRequest,
    DeliveryDetails,
    Accessorial,
    LinehaulPrimaryInfo,
    PickupDetails,
    LinehaulDetails,
    RateDetails,
    InvoiceDetails,
    PickupRateDetails,
    LinehaulRateDetails,
    DeliveryRateDetails,
    CarrierRateDetails,
    CustomerRateDetails,
} from "../../entities/shipment/shipmentTypes";
import * as shipmentDB from "../../database/shipment";
import * as entityDB from "../../database/maintenance";
import * as noteDB from "../../database/maintenance/note";

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

export async function createNetworkShipment(
    conn: Connection,
    shipment: CreateNetworkShipmentRequest,
    userId: number
): Promise<any> {
    try {
        conn.beginTransaction();
        console.log("[STEP 0] Validating customer airport rules");

        /** -----------------------------
         * 0. VALIDATE CUSTOMER AIRPORT RULES
         * ----------------------------- */
        const customerDetails = shipment.customerDetails;

        if (
            customerDetails.airportPickupService === "Y" &&
            (!customerDetails.originAirportCode ||
                customerDetails.originAirportCode.trim() === "")
        ) {
            throw new Error(
                "originAirportCode is mandatory when airportPickupService is 'Y'"
            );
        }

        if (
            customerDetails.airportDeliveryService === "Y" &&
            (!customerDetails.destinationAirportCode ||
                customerDetails.destinationAirportCode.trim() === "")
        ) {
            throw new Error(
                "destinationAirportCode is mandatory when airportDeliveryService is 'Y'"
            );
        }

        if (
            customerDetails.airportPickupService === "Y" &&
            !("pickupAirlineDetails" in customerDetails)
        ) {
            throw new Error(
                "pickupAirlineDetails is required when airportPickupService is 'Y'"
            );
        }

        if (
            customerDetails.airportPickupService === "N" &&
            !("shipperDetails" in customerDetails)
        ) {
            throw new Error(
                "shipperDetails is required when airportPickupService is 'N'"
            );
        }

        if (
            customerDetails.airportDeliveryService === "Y" &&
            !("deliveryAirlineDetails" in customerDetails)
        ) {
            throw new Error(
                "deliveryAirlineDetails is required when airportDeliveryService is 'Y'"
            );
        }

        if (
            customerDetails.airportDeliveryService === "N" &&
            !("consigneeDetails" in customerDetails)
        ) {
            throw new Error(
                "consigneeDetails is required when airportDeliveryService is 'N'"
            );
        }

        /** -----------------------------
         * 1. CREATE MAIN SHIPMENT
         * ----------------------------- */

        console.log("[STEP 1] Creating main shipment record");

        const createdShipment = await shipmentDB.createNetworkShipment(
            conn,
            shipment.shipmentDetails,
            userId
        );

        const shipmentId = createdShipment.shipmentId;

        /** -----------------------------
         * 2. VALIDATE / CREATE SHIPPER
         * ----------------------------- */
        let createdShipperInfo: any = null;
        let shipperEntityId: number | undefined;

        console.log("[STEP 2] Validating/Creating shipper info");

        if (customerDetails.airportPickupService === "N") {
            const shipperDetails = customerDetails.shipperDetails;

            if (shipperDetails.shipperId) {
                const existingShipper = await shipmentDB.getShipperById(
                    conn,
                    shipperDetails.shipperId
                );

                if (!existingShipper) {
                    throw new Error("Invalid shipperId provided");
                }

                validateMatch(existingShipper, shipperDetails, "shipper");
                shipperEntityId = existingShipper.entityId;
            } else {
                const entityId = await entityDB.createEntity(
                    conn,
                    "SHIPPER",
                    shipperDetails.shipperName
                );

                console.log("[STEP 2.1] Checking for duplicate shipper");

                const shipperConflict = await shipmentDB.checkShipperUniqueFields(conn, {
                    shipperName: shipperDetails.shipperName
                });

                if (shipperConflict) {
                    throw new Error(`Shipper with name "${shipperDetails.shipperName}" already exists`);
                }

                createdShipperInfo = await shipmentDB.createShipperInfo(
                    conn,
                    { ...shipperDetails, entityId }
                );
                shipperEntityId = entityId;

                console.log("[STEP 2.2] Created new shipper info with entityId:", entityId);
            }
        }

        /** -----------------------------
         * 3. VALIDATE / CREATE CONSIGNEE
         * ----------------------------- */
        let createdConsigneeInfo: any = null;
        let consigneeEntityId: number | undefined;

        console.log("[STEP 3] Validating/Creating consignee info");

        if (customerDetails.airportDeliveryService === "N") {
            const consigneeDetails = customerDetails.consigneeDetails;

            if (consigneeDetails.consigneeId) {
                const existingConsignee = await shipmentDB.getConsigneeById(
                    conn,
                    consigneeDetails.consigneeId
                );

                if (!existingConsignee) {
                    throw new Error("Invalid consigneeId provided");
                }

                validateMatch(existingConsignee, consigneeDetails, "consignee");
                consigneeEntityId = existingConsignee.entityId;
            } else {
                const entityId = await entityDB.createEntity(
                    conn,
                    "CONSIGNEE",
                    consigneeDetails.consigneeName
                );

                const consigneeConflict = await shipmentDB.checkConsigneeUniqueFields(conn, {
                    consigneeName: consigneeDetails.consigneeName
                });

                if (consigneeConflict) {
                    throw new Error(`Consignee with name "${consigneeDetails.consigneeName}" already exists`);
                }

                createdConsigneeInfo = await shipmentDB.createConsigneeInfo(
                    conn,
                    { ...consigneeDetails, entityId }
                );
                consigneeEntityId = entityId;
            }
        }

        /** -----------------------------
         * 4. CREATE / VALIDATE PICKUP AIRLINE
         * ----------------------------- */
        let pickupAirlineEntityId: number | undefined;

        console.log("[STEP 4] Validating/Creating pickup airline info");

        if (customerDetails.airportPickupService === "Y") {
            const pickupAirline = customerDetails.pickupAirlineDetails;

            if (pickupAirline.airlineId && pickupAirline.entityId) {
                // Existing airline
                pickupAirlineEntityId = pickupAirline.entityId;
            } else {
                // Create new airline - check for duplicates first
                console.log("[STEP 4.1] Checking for duplicate pickup airline");
                const conflictField = await shipmentDB.checkAirlineUniqueFields(
                    conn,
                    pickupAirline.airlineNumber,
                    pickupAirline.airlineCode,
                    pickupAirline.scenarioType
                );

                if (conflictField) {
                    throw new Error(`Pickup airline already exists with duplicate ${conflictField}`);
                }

                console.log("[STEP 4.2] Creating new pickup airline entity");
                const entityId = await entityDB.createEntity(
                    conn,
                    "AIRLINE",
                    pickupAirline.airlineName
                );

                await shipmentDB.createAirlineInfo(
                    conn,
                    { ...pickupAirline, entityId }
                );
                pickupAirlineEntityId = entityId;
            }
        }

        /** -----------------------------
         * 5. CREATE / VALIDATE DELIVERY AIRLINE
         * ----------------------------- */
        let deliveryAirlineEntityId: number | undefined;

        console.log("[STEP 5] Validating/Creating delivery airline info");

        if (customerDetails.airportDeliveryService === "Y") {
            const deliveryAirline = customerDetails.deliveryAirlineDetails;

            if (deliveryAirline.airlineId && deliveryAirline.entityId) {
                // Existing airline
                deliveryAirlineEntityId = deliveryAirline.entityId;
            } else {
                // Create new airline - check for duplicates first
                console.log("[STEP 5.1] Checking for duplicate delivery airline");
                const conflictField = await shipmentDB.checkAirlineUniqueFields(
                    conn,
                    deliveryAirline.airlineNumber,
                    deliveryAirline.airlineCode,
                    deliveryAirline.scenarioType
                );

                if (conflictField) {
                    throw new Error(`Delivery airline already exists with duplicate ${conflictField}`);
                }

                console.log("[STEP 5.2] Creating new delivery airline entity");
                const entityId = await entityDB.createEntity(
                    conn,
                    "AIRLINE",
                    deliveryAirline.airlineName
                );

                await shipmentDB.createAirlineInfo(
                    conn,
                    { ...deliveryAirline, entityId }
                );
                deliveryAirlineEntityId = entityId;
            }
        }

        /** -----------------------------
         * 6. CREATE CUSTOMER + COMMODITY
         * ----------------------------- */
        console.log("[STEP 6] Creating customer and commodity info");
        const [createdCustomerInfo, createdCommodityInfo] = await Promise.all([
            shipmentDB.createCustomerInfo(conn, shipment.customerDetails, shipmentId),

            shipmentDB.createCommodityInfo(
                conn,
                shipment.commodityDetails,
                shipmentId
            )
        ]);

        /** -----------------------------
         * 7. CREATE MAPPINGS
         * ----------------------------- */

        console.log("[STEP 7] Creating mappings between shipment and entities");
        const mappingTasks: Promise<any>[] = [];

        if (customerDetails.airportPickupService === "N" && shipperEntityId) {
            mappingTasks.push(
                shipmentDB.createShipperConsigneeAirlineMapping(
                    conn,
                    shipmentId,
                    shipperEntityId
                )
            );
        }

        if (customerDetails.airportDeliveryService === "N" && consigneeEntityId) {
            mappingTasks.push(
                shipmentDB.createShipperConsigneeAirlineMapping(
                    conn,
                    shipmentId,
                    consigneeEntityId
                )
            );
        }

        if (customerDetails.airportPickupService === "Y" && pickupAirlineEntityId) {
            mappingTasks.push(
                shipmentDB.createShipperConsigneeAirlineMapping(
                    conn,
                    shipmentId,
                    pickupAirlineEntityId
                )
            );
        }

        if (customerDetails.airportDeliveryService === "Y" && deliveryAirlineEntityId) {
            mappingTasks.push(
                shipmentDB.createShipperConsigneeAirlineMapping(
                    conn,
                    shipmentId,
                    deliveryAirlineEntityId
                )
            );
        }

        await Promise.all(mappingTasks);

        /** -----------------------------
         * 8. CREATE HANDLING UNITS
         * ----------------------------- */
        console.log("[STEP 8] Creating handling units");
        const createdHandlingUnits = await Promise.all(
            shipment.commodityDetails.handlingUnits.map((hu) =>
                shipmentDB.createHandlingUnitInfo(conn, hu, shipmentId)
            )
        );

        /** -----------------------------
         * 9. CREATE ITEMS
         * ----------------------------- */

        console.log("[STEP 9] Creating items for handling units");

        const itemTasks: Promise<any>[] = [];

        shipment.commodityDetails.handlingUnits.forEach((hu, huIndex) => {
            const handlingUnitId =
                createdHandlingUnits[huIndex].handlingUnitId;

            hu.palletDetails.forEach((item) => {
                itemTasks.push(
                    shipmentDB.createHandlingUnitItemInfo(
                        conn,
                        item,
                        handlingUnitId
                    )
                );
            });
        });

        const createdItems = await Promise.all(itemTasks);

        /** -----------------------------
         * 10. CREATE HAZMAT
         * ----------------------------- */
        console.log("[STEP 10] Creating hazmat details");
        const hazmatTasks: Promise<any>[] = [];
        let itemIndex = 0;

        shipment.commodityDetails.handlingUnits.forEach((hu) => {
            hu.palletDetails.forEach((item) => {
                const createdItem = createdItems[itemIndex];

                if (item.hazmat === "Y") {

                    if (!item.hazmatDetails) {
                        throw new Error("hazmatDetails is required when hazmat is 'Y'");
                    }

                    hazmatTasks.push(
                        shipmentDB.createHandlingUnitItemHazmatInfo(
                            conn,
                            item.hazmatDetails,
                            createdItem.itemId
                        )
                    );
                }

                itemIndex++;
            });
        });

        const createdHazmatDetails = await Promise.all(hazmatTasks);

        /** -----------------------------
         * 11. BUILD RESPONSE FOR HANDLING UNITS
         * ----------------------------- */
        console.log("[STEP 11] Building handling units response");
        const hazmatMap = new Map(
            createdHazmatDetails.map((hz: any) => [hz.itemId, hz])
        );

        let responseItemIndex = 0;

        const handlingUnitsResponse =
            shipment.commodityDetails.handlingUnits.map((hu, huIndex) => {
                const createdHU = createdHandlingUnits[huIndex];

                const palletDetailsResponse = hu.palletDetails.map((item) => {
                    const createdItem = createdItems[responseItemIndex];

                    let hazmatResponse = undefined;

                    if (item.hazmat === "Y" && item.hazmatDetails) {
                        const hz = hazmatMap.get(createdItem.itemId);

                        hazmatResponse = {
                            ...item.hazmatDetails,
                            hazmatId: hz?.hazmatId
                        };
                    }

                    responseItemIndex++;

                    return {
                        ...item,
                        itemId: createdItem.itemId,
                        hazmatDetails: hazmatResponse
                    };
                });

                return {
                    ...hu,
                    handlingUnitId: createdHU.handlingUnitId,
                    palletDetails: palletDetailsResponse
                };
            });


        //Step 12 - Create Carrier Info if orderReceivedPickupPending is 'N'
        if (shipment.shipmentDetails.orderReceivedPickupPending === 'N') {

            if (!shipment.carrierDetails)
                throw new Error("carrierDetails is required when orderReceivedPickupPending is 'N'");

            console.log("[STEP 12] Creating carrier routing details");

            const carrierDetails = shipment.carrierDetails;

            if (!carrierDetails.pickupDetails)
                throw new Error("pickupDetails is required");

            console.log("[STEP 12.1] Creating pickup entity");
            const pickupEntityId = await entityDB.createEntity(
                conn,
                "PICKUP",
                `Pickup for Shipment ${shipmentId}`
            );

            let fromLocationEntityId;

            if (carrierDetails.pickupDetails.fromLocationType === 'Shipper') {
                if (!shipperEntityId && !pickupAirlineEntityId)
                    throw new Error("Shipper entityId is required for Shipper fromLocationType");

                fromLocationEntityId = shipperEntityId || pickupAirlineEntityId;
            } else {
                if (!pickupAirlineEntityId)
                    throw new Error("Pickup Airline entityId is required for Carrier fromLocationType");
                fromLocationEntityId = pickupAirlineEntityId;
            }

            // Create Pickup Info
            const pickupDetails = {
                ...carrierDetails.pickupDetails,
                entityId: pickupEntityId,
                fromLocationEntityId: fromLocationEntityId
            }

            console.log("[STEP 12.2] Creating pickup info record");
            await shipmentDB.createNetworkShipmentPickupInfo(conn, pickupDetails, shipmentId);

            // Create FROM location if editing
            if (pickupDetails.editFromLocationDetails) {
                console.log("[STEP 12.3] Creating pickup FROM location address");
                const pickupFromAddress = {
                    addressLine1: pickupDetails.editFromLocationDetails.addressLine1 || '',
                    addressLine2: pickupDetails.editFromLocationDetails.addressLine2 || '',
                    city: pickupDetails.editFromLocationDetails.city || '',
                    state: pickupDetails.editFromLocationDetails.state || '',
                    zipCode: pickupDetails.editFromLocationDetails.zipCode || ''
                };
                const createdFromAddress = await shipmentDB.createNetworkShipmentAddress(conn, pickupFromAddress);

                await shipmentDB.createNetworkShipmentEntityAddressMapping(
                    conn,
                    pickupEntityId,
                    createdFromAddress.addressId,
                    "FROM",
                    "PICKUP"
                );

            }

            // Create Agent Terminal details if applicable
            if (pickupDetails.pickupAgentTerminal === 'N') {
                if (!pickupDetails?.pickupAgentTerminalDetails)
                    throw new Error("pickupAgentTerminalDetails is required");

                let toLocationEntityId;
                if (pickupDetails.pickupAgentTerminalDetails.toLocationType === 'Carrier') {

                    if (!pickupDetails.pickupAgentTerminalDetails.toLocationEntityId)
                        throw new Error("toLocationEntityId is required for Carrier toLocationType");

                    toLocationEntityId = pickupDetails.pickupAgentTerminalDetails.toLocationEntityId;
                }

                else if (pickupDetails.pickupAgentTerminalDetails.toLocationType === 'Consignee') {
                    if (!consigneeEntityId && !deliveryAirlineEntityId)
                        throw new Error("Consignee entityId is required for Consignee toLocationType");

                    toLocationEntityId = consigneeEntityId || deliveryAirlineEntityId;
                }

                const pickupAgentTerminalDetails = { ...pickupDetails.pickupAgentTerminalDetails, toLocationEntityId: toLocationEntityId };

                console.log("[STEP 12.4] Creating agent terminal details");

                await shipmentDB.createNetworkShipmentPickupAgentTerminalInfo(conn, shipmentId, pickupDetails.pickupAgentTerminalDetails);

                // Create TO location address if editing
                const agentTerminalDetails = pickupDetails.pickupAgentTerminalDetails;
                if (agentTerminalDetails.editToLocation === 'Y' && agentTerminalDetails.editToLocationDetails) {
                    const toLocationAddress = {
                        addressLine1: agentTerminalDetails.editToLocationDetails.addressLine1 || '',
                        addressLine2: agentTerminalDetails.editToLocationDetails.addressLine2 || '',
                        city: agentTerminalDetails.editToLocationDetails.city || '',
                        state: agentTerminalDetails.editToLocationDetails.state || '',
                        zipCode: agentTerminalDetails.editToLocationDetails.zipCode || ''
                    };
                    const createdToAddress = await shipmentDB.createNetworkShipmentAddress(conn, toLocationAddress);

                    const toLocationEntityId = agentTerminalDetails.toLocationEntityId;

                    if (toLocationEntityId) {
                        await shipmentDB.createNetworkShipmentEntityAddressMapping(
                            conn,
                            toLocationEntityId,
                            createdToAddress.addressId,
                            "TO",
                            "PICKUP"
                        );
                    }
                }
            }

            // Create accessories if applicable
            if (pickupDetails.pickupAccessorial === 'Y') {
                if (!pickupDetails?.pickupAccessorialDetails)
                    throw new Error("pickupAccessorialDetails is required");
                console.log("[STEP 12.5] Creating pickup accessories");

                await Promise.all(
                    pickupDetails.pickupAccessorialDetails.accessorials.map(async (accessorial) => {
                        const entityId = await entityDB.createEntity(
                            conn,
                            "ACCESSORIAL",
                            `Pickup Accessorial for Shipment - ${shipmentId}`
                        );

                        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                        return shipmentDB.createNetworkShipmentPickupAccessorial(conn, shipmentId, {
                            ...accessorial,
                            entityId,
                            noteThreadId,
                        });
                    })
                );

                console.log("[PICKUP] Accessories created successfully");
            }

            // Create pickup alert if applicable
            console.log("[PICKUP] Alert:", pickupDetails.pickupAlert);
            if (pickupDetails.pickupAlert === 'Y') {
                if (!pickupDetails?.pickupAlertDetails)
                    throw new Error("pickupAlertDetails is required");
                console.log("[STEP 12.6] Creating pickup alert");

                await shipmentDB.createNetworkShipmentPickupAlertInfo(conn, shipmentId, pickupDetails.pickupAlertDetails);
            }

            console.log("[STEP 12.7] Creating routing-specific linehaul and delivery");

            // ROUTING-SPECIFIC LINEHAUL AND DELIVERY LOGIC
            // ================================================
            switch (shipment.carrierDetails.pickupDetails.pickupRouting) {
                case 'PICKUP_ONLY':
                    {
                        console.log("[STEP 12.7.1] PICKUP_ONLY: Creating full linehaul and full delivery (if provided)");

                        const linehaulDetails = shipment.carrierDetails.linehaulDetails;
                        const deliveryDetails = shipment.carrierDetails.deliveryDetails;

                        // If the user provided no linehaul details at all, skip linehaul/delivery creation.
                        if (!linehaulDetails) {
                            console.log("[STEP 12.7.1] No linehaul provided — skipping linehaul and delivery creation");
                        } else {
                            // Type guard: only proceed if primary info exists on linehaulDetails
                            if ('linehaulPrimaryInfo' in linehaulDetails) {
                                const linehaulRouting = (linehaulDetails as any).linehaulPrimaryInfo.linehaulRouting;

                                switch (linehaulRouting) {
                                    case 'LINE_HAUL_ONLY':
                                        {
                                            console.log("[STEP 12.7.1.1] Creating full linehaul and full delivery (if delivery provided)");

                                            // Create Linehaul Entity
                                            const linehaulEntityId = await entityDB.createEntity(
                                                conn,
                                                "LINEHAUL",
                                                `Linehaul for Shipment ${shipmentId}`
                                            );

                                            let fromLocationEntityId;

                                            if ((linehaulDetails.linehaulPrimaryInfo as any).fromLocationType === 'Carrier') {
                                                if (!pickupAirlineEntityId && !shipperEntityId)
                                                    throw new Error("Pickup Airline entityId is required for Carrier fromLocationType");
                                                fromLocationEntityId = pickupAirlineEntityId;
                                            }

                                            let toLocationEntityId;

                                            if ((linehaulDetails.linehaulPrimaryInfo as any).toLocationEntityId)
                                                toLocationEntityId = (linehaulDetails.linehaulPrimaryInfo as any).toLocationEntityId;

                                            // Create Linehaul Primary Info
                                            await shipmentDB.createNetworkShipmentLinehaulPrimaryInfo(conn, shipmentId, {
                                                ...(linehaulDetails.linehaulPrimaryInfo as any),
                                                entityId: linehaulEntityId,
                                                fromLocationEntityId: fromLocationEntityId,
                                                toLocationEntityId: toLocationEntityId
                                            });

                                            // Create FROM location address and mapping
                                            if ((linehaulDetails.linehaulPrimaryInfo as any).editFromLocationDetails) {
                                                const linehaulFromAddress = {
                                                    addressLine1: (linehaulDetails.linehaulPrimaryInfo as any).editFromLocationDetails.addressLine1 || '',
                                                    addressLine2: (linehaulDetails.linehaulPrimaryInfo as any).editFromLocationDetails.addressLine2 || '',
                                                    city: (linehaulDetails.linehaulPrimaryInfo as any).editFromLocationDetails.city || '',
                                                    state: (linehaulDetails.linehaulPrimaryInfo as any).editFromLocationDetails.state || '',
                                                    zipCode: (linehaulDetails.linehaulPrimaryInfo as any).editFromLocationDetails.zipCode || ''
                                                };
                                                const createdFromAddress = await shipmentDB.createNetworkShipmentAddress(conn, linehaulFromAddress);

                                                if (linehaulEntityId) {
                                                    await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                                        conn,
                                                        linehaulEntityId,
                                                        createdFromAddress.addressId,
                                                        "FROM",
                                                        "LINE_HAUL"
                                                    );
                                                }
                                            }

                                            // Create TO location address and mapping
                                            if ((linehaulDetails.linehaulPrimaryInfo as any).editToLocationDetails) {
                                                const linehaulToAddress = {
                                                    addressLine1: (linehaulDetails.linehaulPrimaryInfo as any).editToLocationDetails.addressLine1 || '',
                                                    addressLine2: (linehaulDetails.linehaulPrimaryInfo as any).editToLocationDetails.addressLine2 || '',
                                                    city: (linehaulDetails.linehaulPrimaryInfo as any).editToLocationDetails.city || '',
                                                    state: (linehaulDetails.linehaulPrimaryInfo as any).editToLocationDetails.state || '',
                                                    zipCode: (linehaulDetails.linehaulPrimaryInfo as any).editToLocationDetails.zipCode || ''
                                                };
                                                const createdToAddress = await shipmentDB.createNetworkShipmentAddress(conn, linehaulToAddress);
                                                if (linehaulEntityId) {
                                                    await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                                        conn,
                                                        linehaulEntityId,
                                                        createdToAddress.addressId,
                                                        "TO",
                                                        "LINE_HAUL"
                                                    );
                                                }
                                            }

                                            // Create linehaul accessories if applicable
                                            if (linehaulDetails.linehaulCommonInfo?.linehaulAccessorial === 'Y') {
                                                if (!linehaulDetails.linehaulCommonInfo?.linehaulAccessorialDetails)
                                                    throw new Error("linehaulAccessorialDetails is required");

                                                console.log("[LINEHAUL] Creating linehaul accessories, count:", linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails.accessorials.length);
                                                await Promise.all(
                                                    linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails.accessorials.map(async (accessorial) => {
                                                        const entityId = await entityDB.createEntity(
                                                            conn,
                                                            "ACCESSORIAL",
                                                            `Linehaul Accessorial for Shipment - ${shipmentId}`
                                                        );

                                                        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                                        return shipmentDB.createNetworkShipmentLinehaulAccessorial(conn, shipmentId, {
                                                            ...accessorial,
                                                            entityId,
                                                            noteThreadId,
                                                        });
                                                    })
                                                );
                                                console.log("[LINEHAUL] Linehaul accessories created successfully");
                                            }

                                            // If delivery details were not provided, skip delivery creation
                                            if (!deliveryDetails) {
                                                console.log("[DELIVERY] No delivery provided — skipping delivery creation");
                                            } else {
                                                // Create Full Delivery Entity
                                                console.log("[DELIVERY] Creating delivery entity");
                                                const deliveryEntityId = await entityDB.createEntity(
                                                    conn,
                                                    "DELIVERY",
                                                    `Delivery for Shipment ${shipmentId}`
                                                );
                                                console.log("[DELIVERY] Delivery entity created:", deliveryEntityId);

                                                // Create Delivery Primary Info
                                                console.log("[DELIVERY] Creating delivery primary info");
                                                const dDetails = deliveryDetails as DeliveryDetails;
                                                let deliveryFromLocationEntityId;
                                                if (dDetails.deliveryPrimaryInfo.fromLocationType === 'Carrier') {
                                                    if (!dDetails.deliveryPrimaryInfo.fromLocationEntityId)
                                                        throw new Error("Delivery Airline entityId is required for Carrier fromLocationType");
                                                    deliveryFromLocationEntityId = dDetails.deliveryPrimaryInfo.fromLocationEntityId;
                                                }
                                                let deliveryToLocationEntityId;
                                                if (dDetails.deliveryPrimaryInfo.toLocationType === 'Consignee') {
                                                    if (!consigneeEntityId && deliveryAirlineEntityId)
                                                        throw new Error("Consignee entityId is required for Consignee toLocationType");
                                                    deliveryToLocationEntityId = consigneeEntityId || deliveryAirlineEntityId;
                                                }
                                                await shipmentDB.createNetworkShipmentDeliveryPrimaryInfo(conn, shipmentId, {
                                                    ...dDetails.deliveryPrimaryInfo,
                                                    entityId: deliveryEntityId,
                                                    fromLocationEntityId: deliveryFromLocationEntityId,
                                                    toLocationEntityId: deliveryToLocationEntityId
                                                });

                                                // Create FROM location address and mapping for delivery
                                                console.log("[DELIVERY] FROM location editing:", !!dDetails.deliveryPrimaryInfo.editFromLocationDetails);
                                                if (dDetails.deliveryPrimaryInfo.editFromLocationDetails) {
                                                    console.log("[DELIVERY] Creating FROM address");
                                                    const deliveryFromAddress = {
                                                        addressLine1: dDetails.deliveryPrimaryInfo.editFromLocationDetails.addressLine1 || '',
                                                        addressLine2: dDetails.deliveryPrimaryInfo.editFromLocationDetails.addressLine2 || '',
                                                        city: dDetails.deliveryPrimaryInfo.editFromLocationDetails.city || '',
                                                        state: dDetails.deliveryPrimaryInfo.editFromLocationDetails.state || '',
                                                        zipCode: dDetails.deliveryPrimaryInfo.editFromLocationDetails.zipCode || ''
                                                    };
                                                    const createdFromAddress = await shipmentDB.createNetworkShipmentAddress(conn, deliveryFromAddress);

                                                    if (deliveryEntityId) {
                                                        await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                                            conn,
                                                            deliveryEntityId,
                                                            createdFromAddress.addressId,
                                                            "FROM",
                                                            "DELIVERY"
                                                        );
                                                    }
                                                }

                                                // Create TO location address and mapping for delivery
                                                console.log("[DELIVERY] TO location editing:", !!dDetails.deliveryPrimaryInfo.editToLocationDetails);
                                                if (dDetails.deliveryPrimaryInfo.editToLocationDetails) {
                                                    console.log("[DELIVERY] Creating TO address");
                                                    const deliveryToAddress = {
                                                        addressLine1: dDetails.deliveryPrimaryInfo.editToLocationDetails.addressLine1 || '',
                                                        addressLine2: dDetails.deliveryPrimaryInfo.editToLocationDetails.addressLine2 || '',
                                                        city: dDetails.deliveryPrimaryInfo.editToLocationDetails.city || '',
                                                        state: dDetails.deliveryPrimaryInfo.editToLocationDetails.state || '',
                                                        zipCode: dDetails.deliveryPrimaryInfo.editToLocationDetails.zipCode || ''
                                                    };
                                                    const createdToAddress = await shipmentDB.createNetworkShipmentAddress(conn, deliveryToAddress);

                                                    if (deliveryEntityId) {
                                                        await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                                            conn,
                                                            deliveryEntityId,
                                                            createdToAddress.addressId,
                                                            "TO",
                                                            "DELIVERY"
                                                        );
                                                    }
                                                }

                                                // Create delivery accessories if applicable
                                                if (dDetails.deliveryCommonInfo.deliveryAccessorial === 'Y') {
                                                    if (!dDetails.deliveryCommonInfo?.deliveryAccessorialDetails)
                                                        throw new Error("deliveryAccessorialDetails is required");

                                                    await Promise.all(
                                                        dDetails.deliveryCommonInfo.deliveryAccessorialDetails.accessorials.map(async (accessorial) => {
                                                            const entityId = await entityDB.createEntity(
                                                                conn,
                                                                "ACCESSORIAL",
                                                                `Delivery Accessorial for Shipment - ${shipmentId}`
                                                            );

                                                            const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                                            return shipmentDB.createNetworkShipmentDeliveryAccessorial(conn, shipmentId, {
                                                                ...accessorial,
                                                                entityId,
                                                                noteThreadId,
                                                            });
                                                        })
                                                    );
                                                }

                                                // Create delivery alert if applicable
                                                if (dDetails.deliveryCommonInfo.deliveryAlert === 'Y') {
                                                    if (!dDetails.deliveryCommonInfo?.deliveryAlertDetails)
                                                        throw new Error("deliveryAlertDetails is required");

                                                    await shipmentDB.createNetworkShipementDeliveryAlertInfo(conn, shipmentId, dDetails.deliveryCommonInfo.deliveryAlertDetails);
                                                }
                                            }

                                        }
                                        break;
                                    case 'LINE_HAUL_DELIVERY':
                                        {
                                            console.log("[STEP] Processing LINE_HAUL_DELIVERY");
                                            // Create Linehaul Entity
                                            const linehaulEntityId = await entityDB.createEntity(
                                                conn,
                                                "LINEHAUL",
                                                `Linehaul for Shipment ${shipmentId}`
                                            );
                                            console.log("[LINEHAUL] Linehaul entity created:", linehaulEntityId);

                                            let fromLocationEntityId;

                                            if (linehaulDetails.linehaulPrimaryInfo.fromLocationType === 'Carrier') {
                                                if (!linehaulDetails.linehaulPrimaryInfo.fromLocationEntityId)
                                                    throw new Error("Linehaul fromLocation entityId is required for Carrier fromLocationType");
                                                fromLocationEntityId = linehaulDetails.linehaulPrimaryInfo.fromLocationEntityId;
                                            }

                                            let toLocationEntityId;

                                            if (linehaulDetails.linehaulPrimaryInfo.toLocationType === 'Consignee') {
                                                if (!consigneeEntityId && !deliveryAirlineEntityId)
                                                    throw new Error("Consignee entityId is required for Consignee toLocationType");
                                                toLocationEntityId = consigneeEntityId || deliveryAirlineEntityId;
                                            }

                                            console.log("[LINEHAUL] Creating linehaul primary info");

                                            // Create Linehaul Primary Info
                                            await shipmentDB.createNetworkShipmentLinehaulPrimaryInfo(conn, shipmentId, {
                                                ...linehaulDetails.linehaulPrimaryInfo,
                                                entityId: linehaulEntityId,
                                                fromLocationEntityId: fromLocationEntityId,
                                                toLocationEntityId: toLocationEntityId
                                            } as LinehaulPrimaryInfo & { entityId: number });

                                            console.log("[LINEHAUL] Linehaul primary info created successfully");

                                            // Create FROM location if editing
                                            if (linehaulDetails.linehaulPrimaryInfo.editFromLocation === 'Y' && linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails) {
                                                const linehaulFromAddress = {
                                                    addressLine1: linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails.addressLine1 || '',
                                                    addressLine2: linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails.addressLine2 || '',
                                                    city: linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails.city || '',
                                                    state: linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails.state || '',
                                                    zipCode: linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails.zipCode || ''
                                                };
                                                const createdFromAddress = await shipmentDB.createNetworkShipmentAddress(conn, linehaulFromAddress);

                                                if (linehaulEntityId) {
                                                    await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                                        conn,
                                                        linehaulEntityId,
                                                        createdFromAddress.addressId,
                                                        "FROM",
                                                        "LINE_HAUL"
                                                    );
                                                }
                                            }

                                            // Create TO location if editing
                                            if (linehaulDetails.linehaulPrimaryInfo.editToLocation === 'Y' && linehaulDetails.linehaulPrimaryInfo.editToLocationDetails) {
                                                const linehaulToAddress = {
                                                    addressLine1: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.addressLine1 || '',
                                                    addressLine2: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.addressLine2 || '',
                                                    city: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.city || '',
                                                    state: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.state || '',
                                                    zipCode: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.zipCode || ''
                                                };
                                                const createdToAddress = await shipmentDB.createNetworkShipmentAddress(conn, linehaulToAddress);

                                                if (linehaulEntityId) {
                                                    await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                                        conn,
                                                        linehaulEntityId,
                                                        createdToAddress.addressId,
                                                        "TO",
                                                        "LINE_HAUL"
                                                    );
                                                }
                                            }

                                            // Create linehaul accessories if applicable
                                            if (linehaulDetails.linehaulCommonInfo?.linehaulAccessorial === 'Y') {
                                                if (!linehaulDetails.linehaulCommonInfo?.linehaulAccessorialDetails)
                                                    throw new Error("linehaulAccessorialDetails is required");

                                                await Promise.all(
                                                    linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails.accessorials.map(async (accessorial) => {
                                                        const entityId = await entityDB.createEntity(
                                                            conn,
                                                            "ACCESSORIAL",
                                                            `Linehaul Accessorial for Shipment - ${shipmentId}`
                                                        );

                                                        const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                                        return shipmentDB.createNetworkShipmentLinehaulAccessorial(conn, shipmentId, {
                                                            ...accessorial,
                                                            entityId,
                                                            noteThreadId,
                                                        });
                                                    })
                                                );
                                            }

                                            // Minimal Delivery: Only accessories + alert, NO primary info (no address mapping)
                                            if (!deliveryDetails) {
                                                console.log("[DELIVERY] No delivery provided — skipping minimal delivery creation");
                                            } else {
                                                const dDetails = deliveryDetails as DeliveryDetails;

                                                // Create delivery accessories if applicable
                                                if (dDetails.deliveryCommonInfo.deliveryAccessorial === 'Y') {
                                                    if (!dDetails.deliveryCommonInfo?.deliveryAccessorialDetails)
                                                        throw new Error("deliveryAccessorialDetails is required");

                                                    await Promise.all(
                                                        dDetails.deliveryCommonInfo.deliveryAccessorialDetails.accessorials.map(async (accessorial) => {
                                                            const entityId = await entityDB.createEntity(
                                                                conn,
                                                                "ACCESSORIAL",
                                                                `Delivery Accessorial for Shipment - ${shipmentId}`
                                                            );

                                                            const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                                            return shipmentDB.createNetworkShipmentDeliveryAccessorial(conn, shipmentId, {
                                                                ...accessorial,
                                                                entityId,
                                                                noteThreadId,
                                                            });
                                                        })
                                                    );
                                                }

                                                // Create delivery alert if applicable
                                                if (dDetails.deliveryCommonInfo.deliveryAlert === 'Y') {
                                                    if (!dDetails.deliveryCommonInfo?.deliveryAlertDetails)
                                                        throw new Error("deliveryAlertDetails is required");

                                                    await shipmentDB.createNetworkShipementDeliveryAlertInfo(conn, shipmentId, dDetails.deliveryCommonInfo.deliveryAlertDetails);
                                                }
                                            }
                                        }
                                        break;
                                }
                            } else {
                                // No primary info on linehaul — treat as user didn't provide linehaul
                                console.log("[STEP 12.7.1] linehaulPrimaryInfo missing — skipping linehaul/delivery creation");
                            }
                        }
                    }
                    break;
                case 'PICKUP_LINE_HAUL':
                    {
                        console.log("[ROUTING] PICKUP_LINE_HAUL case: Minimal linehaul + Full delivery");
                        // PICKUP_LINE_HAUL:
                        // - Pickup: FULL (routing, location, agent terminal, accessories, alert) - already created above
                        // - Linehaul: MINIMAL (only notes + accessories, NO primary info)
                        // - Delivery: FULL (with deliveryPrimaryInfo + common info)

                        // Create Linehaul Info (MINIMAL - no primary info, only notes + accessories)
                        const linehaulDetails = shipment.carrierDetails.linehaulDetails;

                        if (linehaulDetails.linehaulCommonInfo.linehaulAccessorial === 'Y') {
                            if (!linehaulDetails.linehaulCommonInfo?.linehaulAccessorialDetails)
                                throw new Error("linehaulAccessorialDetails is required");

                            await Promise.all(
                                linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails.accessorials.map(async (accessorial) => {
                                    const entityId = await entityDB.createEntity(
                                        conn,
                                        "ACCESSORIAL",
                                        `Linehaul Accessorial for Shipment - ${shipmentId}`
                                    );

                                    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                    return shipmentDB.createNetworkShipmentLinehaulAccessorial(conn, shipmentId, {
                                        ...accessorial,
                                        entityId,
                                        noteThreadId,
                                    });
                                })
                            );
                        }

                        // Create Full Delivery Entity
                        const deliveryEntityId = await entityDB.createEntity(
                            conn,
                            "DELIVERY",
                            `Delivery for Shipment ${shipmentId}`
                        );



                        // Create Delivery Primary Info
                        // Type assertion: In PICKUP_LINE_HAUL, deliveryDetails always has deliveryPrimaryInfo
                        const deliveryDetails = shipment.carrierDetails.deliveryDetails as DeliveryDetails;

                        let fromLocationEntityId;
                        if (deliveryDetails.deliveryPrimaryInfo.fromLocationType === 'Carrier') {
                            if (!deliveryDetails.deliveryPrimaryInfo.fromLocationEntityId)
                                throw new Error("Delivery Airline entityId is required for Carrier fromLocationType");
                            fromLocationEntityId = deliveryDetails.deliveryPrimaryInfo.fromLocationEntityId;
                        }
                        let toLocationEntityId;
                        if (deliveryDetails.deliveryPrimaryInfo.toLocationType === 'Consignee') {
                            if (!consigneeEntityId && deliveryAirlineEntityId)
                                throw new Error("Consignee entityId is required for Consignee toLocationType");
                            toLocationEntityId = consigneeEntityId || deliveryAirlineEntityId;
                        }

                        await shipmentDB.createNetworkShipmentDeliveryPrimaryInfo(conn, shipmentId, {
                            ...deliveryDetails.deliveryPrimaryInfo,
                            entityId: deliveryEntityId
                        });

                        // Create FROM location if editing
                        if (deliveryDetails.deliveryPrimaryInfo.editFromLocation === 'Y' && deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails) {
                            const deliveryFromAddress = {
                                addressLine1: deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails.addressLine1 || '',
                                addressLine2: deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails.addressLine2 || '',
                                city: deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails.city || '',
                                state: deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails.state || '',
                                zipCode: deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails.zipCode || ''
                            };
                            const createdFromAddress = await shipmentDB.createNetworkShipmentAddress(conn, deliveryFromAddress);

                            if (deliveryEntityId) {
                                await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                    conn,
                                    deliveryEntityId,
                                    createdFromAddress.addressId,
                                    "FROM",
                                    "DELIVERY"
                                );
                            }
                        }

                        // Create TO location if editing
                        if (deliveryDetails.deliveryPrimaryInfo.editToLocation === 'Y' && deliveryDetails.deliveryPrimaryInfo.editToLocationDetails) {
                            const deliveryToAddress = {
                                addressLine1: deliveryDetails.deliveryPrimaryInfo.editToLocationDetails.addressLine1 || '',
                                addressLine2: deliveryDetails.deliveryPrimaryInfo.editToLocationDetails.addressLine2 || '',
                                city: deliveryDetails.deliveryPrimaryInfo.editToLocationDetails.city || '',
                                state: deliveryDetails.deliveryPrimaryInfo.editToLocationDetails.state || '',
                                zipCode: deliveryDetails.deliveryPrimaryInfo.editToLocationDetails.zipCode || ''
                            };
                            const createdToAddress = await shipmentDB.createNetworkShipmentAddress(conn, deliveryToAddress);

                            if (deliveryEntityId) {
                                await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                    conn,
                                    deliveryEntityId,
                                    createdToAddress.addressId,
                                    "TO",
                                    "DELIVERY"
                                );
                            }
                        }

                        // Create delivery accessories if applicable
                        if (deliveryDetails.deliveryCommonInfo.deliveryAccessorial === 'Y') {
                            if (!deliveryDetails.deliveryCommonInfo?.deliveryAccessorialDetails)
                                throw new Error("deliveryAccessorialDetails is required");

                            await Promise.all(
                                deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails.accessorials.map(async (accessorial) => {
                                    const entityId = await entityDB.createEntity(
                                        conn,
                                        "ACCESSORIAL",
                                        `Delivery Accessorial for Shipment - ${shipmentId}`
                                    );

                                    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                    return shipmentDB.createNetworkShipmentDeliveryAccessorial(conn, shipmentId, {
                                        ...accessorial,
                                        entityId,
                                        noteThreadId,
                                    });
                                })
                            );
                        }

                        // Create delivery alert if applicable
                        if (deliveryDetails.deliveryCommonInfo.deliveryAlert === 'Y') {
                            if (!deliveryDetails.deliveryCommonInfo?.deliveryAlertDetails)
                                throw new Error("deliveryAlertDetails is required");

                            await shipmentDB.createNetworkShipementDeliveryAlertInfo(conn, shipmentId, deliveryDetails.deliveryCommonInfo.deliveryAlertDetails);
                        }
                    }
                    break;
                case 'PICKUP_LINE_HAUL_DELIVERY':
                    {
                        console.log("[ROUTING] PICKUP_LINE_HAUL_DELIVERY case: Minimal linehaul + Minimal delivery");
                        // PICKUP_LINE_HAUL_DELIVERY:
                        // - Pickup: FULL (routing, location, agent terminal, accessories, alert) - already created above
                        // - Linehaul: MINIMAL (only notes + accessories, NO primary info)
                        // - Delivery: MINIMAL (NO primary info, only accessories + alert)

                        // Create Linehaul Info (MINIMAL - no primary info, only notes + accessories)
                        const linehaulDetails = shipment.carrierDetails.linehaulDetails;

                        if (linehaulDetails.linehaulCommonInfo.linehaulAccessorial === 'Y') {
                            if (!linehaulDetails.linehaulCommonInfo?.linehaulAccessorialDetails)
                                throw new Error("linehaulAccessorialDetails is required");

                            await Promise.all(
                                linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails.accessorials.map(async (accessorial) => {
                                    const entityId = await entityDB.createEntity(
                                        conn,
                                        "ACCESSORIAL",
                                        `Linehaul Accessorial for Shipment - ${shipmentId}`
                                    );

                                    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                    return shipmentDB.createNetworkShipmentLinehaulAccessorial(conn, shipmentId, {
                                        ...accessorial,
                                        entityId,
                                        noteThreadId,
                                    });
                                })
                            );
                        }

                        // Minimal Delivery: Only accessories + alert, NO primary info (no entity, no address mapping)
                        const deliveryDetails = shipment.carrierDetails.deliveryDetails;

                        // Create delivery accessories if applicable
                        if (deliveryDetails.deliveryCommonInfo.deliveryAccessorial === 'Y') {
                            if (!deliveryDetails.deliveryCommonInfo?.deliveryAccessorialDetails)
                                throw new Error("deliveryAccessorialDetails is required");

                            await Promise.all(
                                deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails.accessorials.map(async (accessorial) => {
                                    const entityId = await entityDB.createEntity(
                                        conn,
                                        "ACCESSORIAL",
                                        `Delivery Accessorial for Shipment - ${shipmentId}`
                                    );

                                    const noteThreadId = await noteDB.createNoteThread(conn, entityId, userId);

                                    return shipmentDB.createNetworkShipmentDeliveryAccessorial(conn, shipmentId, {
                                        ...accessorial,
                                        entityId,
                                        noteThreadId,
                                    });
                                })
                            );
                        }

                        // Create delivery alert if applicable
                        if (deliveryDetails.deliveryCommonInfo.deliveryAlert === 'Y') {
                            if (!deliveryDetails.deliveryCommonInfo?.deliveryAlertDetails)
                                throw new Error("deliveryAlertDetails is required");

                            await shipmentDB.createNetworkShipementDeliveryAlertInfo(conn, shipmentId, deliveryDetails.deliveryCommonInfo.deliveryAlertDetails);
                        }
                    }
                    break;
            }

            // Step 5: Create Shipment Rate Details if provided
            if (shipment.shipmentRateDetails) {
                console.log("[STEP 14] Creating shipment rate details");
                const shipmentRateDetails = shipment.shipmentRateDetails;

                // Validate carrier rate details
                if (!shipmentRateDetails.carrierRateDetails)
                    throw new Error("carrierRateDetails is required in shipmentRateDetails");
                if (!shipmentRateDetails.carrierRateDetails.pickupRateDetails)
                    throw new Error("pickupRateDetails is required");
                if (!shipmentRateDetails.carrierRateDetails.linehaulRateDetails)
                    throw new Error("linehaulRateDetails is required");
                if (!shipmentRateDetails.carrierRateDetails.deliveryRateDetails)
                    throw new Error("deliveryRateDetails is required");
                if (!shipmentRateDetails.customerRateDetails)
                    throw new Error("customerRateDetails is required");

                const carrierRateDetails = shipmentRateDetails.carrierRateDetails;

                // ======================================
                // CREATE PICKUP INVOICE AND RATES
                // ======================================
                console.log("[STEP 14.1] Creating pickup invoice and rates");
                const pickupRateDetails = carrierRateDetails.pickupRateDetails;

                const pickupInvoice = await shipmentDB.createNetworkShipmentInvoiceInfo(conn, {
                    shipmentId,
                    invoiceNumber: pickupRateDetails.invoiceNumber,
                    invoiceType: 'PICKUP',
                    subTotalRate: pickupRateDetails.pickupSubTotalRate,
                    approvalStatus: pickupRateDetails.invoiceApprovalStatus,
                    approvedBy: pickupRateDetails.approvedBy,
                    approvedDate: pickupRateDetails.approvedDate
                });

                // Create individual rate records for pickup and map to invoice
                await Promise.all(
                    pickupRateDetails.rateDetails.map(async (rate) => {
                        const createdRate = await shipmentDB.createNetworkShipmentRateInfo(conn, rate);
                        await shipmentDB.createNetworkShipmentInvoiceRateMapping(conn, pickupInvoice.invoiceId, createdRate.rateId);
                    })
                );

                // ======================================
                // CREATE LINEHAUL INVOICE AND RATES
                // ======================================
                console.log("[STEP 14.2] Creating linehaul invoice and rates");
                const linehaulRateDetails = carrierRateDetails.linehaulRateDetails;

                const linehaulInvoice = await shipmentDB.createNetworkShipmentInvoiceInfo(conn, {
                    shipmentId,
                    invoiceNumber: linehaulRateDetails.invoiceNumber,
                    invoiceType: 'LINE_HAUL',
                    subTotalRate: linehaulRateDetails.linehaulSubTotalRate,
                    approvalStatus: linehaulRateDetails.invoiceApprovalStatus,
                    approvedBy: linehaulRateDetails.approvedBy,
                    approvedDate: linehaulRateDetails.approvedDate
                });

                // Create individual rate records for linehaul and map to invoice
                await Promise.all(
                    linehaulRateDetails.rateDetails.map(async (rate) => {
                        const createdRate = await shipmentDB.createNetworkShipmentRateInfo(conn, rate);
                        await shipmentDB.createNetworkShipmentInvoiceRateMapping(conn, linehaulInvoice.invoiceId, createdRate.rateId);
                    })
                );

                // ======================================
                // CREATE DELIVERY INVOICE AND RATES
                // ======================================
                console.log("[STEP 14.3] Creating delivery invoice and rates");
                const deliveryRateDetails = carrierRateDetails.deliveryRateDetails;

                const deliveryInvoice = await shipmentDB.createNetworkShipmentInvoiceInfo(conn, {
                    shipmentId,
                    invoiceNumber: deliveryRateDetails.invoiceNumber,
                    invoiceType: 'DELIVERY',
                    subTotalRate: deliveryRateDetails.deliverySubTotalRate,
                    approvalStatus: deliveryRateDetails.invoiceApprovalStatus,
                    approvedBy: deliveryRateDetails.approvedBy,
                    approvedDate: deliveryRateDetails.approvedDate
                });

                // Create individual rate records for delivery and map to invoice
                await Promise.all(
                    deliveryRateDetails.rateDetails.map(async (rate) => {
                        const createdRate = await shipmentDB.createNetworkShipmentRateInfo(conn, rate);
                        await shipmentDB.createNetworkShipmentInvoiceRateMapping(conn, deliveryInvoice.invoiceId, createdRate.rateId);
                    })
                );

                // ======================================
                // CREATE CARRIER RATE INFO
                // ======================================
                console.log("[STEP 14.4] Creating carrier rate summary");
                await shipmentDB.createNetworkShipmentCarrierRateInfo(
                    conn,
                    shipmentId,
                    pickupInvoice.invoiceId,
                    linehaulInvoice.invoiceId,
                    deliveryInvoice.invoiceId,
                    carrierRateDetails.totalCarrierRate
                );

                // ======================================
                // CREATE CUSTOMER RATE DETAILS
                // ======================================
                console.log("[STEP 14.5] Creating customer rate details");
                const customerRateDetails = shipmentRateDetails.customerRateDetails;

                const customerRate = await shipmentDB.createNetworkShipmentCustomerRateInfo(
                    conn,
                    shipmentId,
                    customerRateDetails.totalCustomerRate
                );

                // Create individual rate records for customer and map to customer rate
                await Promise.all(
                    customerRateDetails.rateDetails.map(async (rate) => {
                        const createdRate = await shipmentDB.createNetworkShipmentRateInfo(conn, rate);
                        await shipmentDB.createNetworkShipmentCustomerRateMapping(conn, customerRate.customerRateId, createdRate.rateId);
                    })
                );

                console.log("[STEP 14] Rate details created successfully");
            }

        }

        conn.commit();
        /** -----------------------------
         * FINAL RESPONSE
         * ----------------------------- */
        console.log("[STEP 13] Building final response");
        const customerDetailsResponse: any = {
            ...shipment.customerDetails,
            customerInfoId: createdCustomerInfo.customerInfoId
        };

        if (customerDetails.airportPickupService === "N") {
            const shipperId = createdShipperInfo?.shipperId || customerDetails.shipperDetails.shipperId;
            customerDetailsResponse.shipperDetails = {
                ...customerDetails.shipperDetails,
                shipperId
            };
        }

        if (customerDetails.airportDeliveryService === "N") {
            const consigneeId = createdConsigneeInfo?.consigneeId || customerDetails.consigneeDetails.consigneeId;
            customerDetailsResponse.consigneeDetails = {
                ...customerDetails.consigneeDetails,
                consigneeId
            };
        }

        return {
            shipmentDetails: {
                ...shipment.shipmentDetails,
                shipmentId
            },
            customerDetails: customerDetailsResponse,
            commodityDetails: {
                ...shipment.commodityDetails,
                commodityId: createdCommodityInfo.commodityId,
                handlingUnits: handlingUnitsResponse
            }
        };
    } catch (error) {
        conn.rollback();
        throw error;
    }
}

export async function getNetworkShipmentView(conn: Connection, shipmentId: number): Promise<any> {
    const shipment = await shipmentDB.getNetworkShipmentById(conn, shipmentId);
    if (!shipment) return null;

    const customerInfo = await shipmentDB.getNetworkShipmentCustomerInfo(conn, shipmentId);
    const commodityInfo = await shipmentDB.getNetworkShipmentCommodityInfo(conn, shipmentId);

    const shipperInfo = await shipmentDB.getNetworkShipmentShipperInfoByShipmentId(conn, shipmentId);
    const consigneeInfo = await shipmentDB.getNetworkShipmentConsigneeInfoByShipmentId(conn, shipmentId);
    const airlineRows = await shipmentDB.getNetworkShipmentAirlinesByShipmentId(conn, shipmentId);

    const pickupAirlineInfo = customerInfo?.airportPickupService === 'Y'
        ? airlineRows.find((airline: any) => airline.airportCode === customerInfo.originAirportCode)
        : null;
    const deliveryAirlineInfo = customerInfo?.airportDeliveryService === 'Y'
        ? airlineRows.find((airline: any) => airline.airportCode === customerInfo.destinationAirportCode)
        : null;

    const handlingUnits = await shipmentDB.getHandlingUnitsByShipmentId(conn, shipmentId);
    const handlingUnitsResponse = await Promise.all(
        handlingUnits.map(async (hu: any) => {
            const items = await shipmentDB.getHandlingUnitItemsByHandlingUnitId(conn, hu.handlingUnitId);
            const palletDetails = await Promise.all(
                items.map(async (item: any) => {
                    const hazmat = item.hazmat === 'Y'
                        ? await shipmentDB.getHazmatInfoByItemId(conn, item.itemId)
                        : undefined;
                    return {
                        itemId: item.itemId,
                        handlingUnitId: item.handlingUnitId,
                        pieces: item.pieces,
                        piecesUOM: item.piecesUOM,
                        description: item.description,
                        hazmat: item.hazmat,
                        hazmatDetails: hazmat ? {
                            ...hazmat
                        } : undefined
                    };
                })
            );
            return {
                handlingUnitId: hu.handlingUnitId,
                commodityId: hu.commodityId,
                handlingUnitUOM: hu.handlingUnitUOM,
                handlingUnits: hu.handlingUnits,
                unit: hu.unit,
                handlingLength: hu.handlingLength,
                handlingWidth: hu.handlingWidth,
                handlingHeight: hu.handlingHeight,
                handlingWeight: hu.handlingWeight,
                handlingWeightUnit: hu.handlingWeightUnit,
                class: hu.class,
                palletDetails
            };
        })
    );

    const pickupInfo = await shipmentDB.getNetworkShipmentPickupInfoByShipmentId(conn, shipmentId);
    const pickupAgentTerminalInfo = pickupInfo ? await shipmentDB.getNetworkShipmentPickupAgentTerminalInfo(conn, shipmentId) : null;
    const pickupAlertInfo = pickupInfo ? await shipmentDB.getNetworkShipmentPickupAlertInfo(conn, shipmentId) : null;
    const pickupAccessorials = pickupInfo ? await shipmentDB.getNetworkShipmentPickupAccessorials(conn, shipmentId) : [];

    const linehaulInfo = await shipmentDB.getNetworkShipmentLinehaulInfoByShipmentId(conn, shipmentId);
    const linehaulCommonInfo = linehaulInfo ? await shipmentDB.getNetworkShipmentLinehaulCommonInfo(conn, shipmentId) : null;
    const linehaulAccessorials = linehaulInfo ? await shipmentDB.getNetworkShipmentLinehaulAccessorials(conn, shipmentId) : [];

    const deliveryInfo = await shipmentDB.getNetworkShipmentDeliveryInfoByShipmentId(conn, shipmentId);
    const deliveryCommonInfo = deliveryInfo ? await shipmentDB.getNetworkShipmentDeliveryCommonInfo(conn, shipmentId) : null;
    const deliveryAccessorials = deliveryInfo ? await shipmentDB.getNetworkShipmentDeliveryAccessorials(conn, shipmentId) : [];
    const deliveryAlertInfo = deliveryInfo ? await shipmentDB.getNetworkShipmentDeliveryAlertInfo(conn, shipmentId) : null;

    const pickupRateInvoice = await shipmentDB.getNetworkShipmentInvoiceInfoByShipmentIdAndType(conn, shipmentId, 'PICKUP');
    const linehaulRateInvoice = await shipmentDB.getNetworkShipmentInvoiceInfoByShipmentIdAndType(conn, shipmentId, 'LINE_HAUL');
    const deliveryRateInvoice = await shipmentDB.getNetworkShipmentInvoiceInfoByShipmentIdAndType(conn, shipmentId, 'DELIVERY');
    const customerRateInfo = await shipmentDB.getNetworkShipmentCustomerRateInfoByShipmentId(conn, shipmentId);
    const carrierRateInfo = await shipmentDB.getNetworkShipmentCarrierRateInfoByShipmentId(conn, shipmentId);

    const buildRateDetails = async (invoice: any) => {
        if (!invoice) return null;
        const mappings = await shipmentDB.getNetworkShipmentInvoiceRateMapByInvoiceId(conn, invoice.invoiceId);
        const rateDetails = await Promise.all(
            mappings.map(async (map: any) => {
                const rate = await shipmentDB.getNetworkShipmentRateInfoByRateId(conn, map.rateId);
                return {
                    rateId: rate.rateId,
                    rateType: rate.rateType,
                    multiplicationFactor: rate.multiplicationFactor,
                    multiplicationFactorUOM: rate.multiplicationFactorUOM,
                    rateValue: rate.rateValue,
                    totalRate: rate.totalRate
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
            approvedDate: invoice.approvalDate
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
                (await shipmentDB.getNetworkShipmentCustomerRateMapByCustomerRateId(conn, customerRateInfo.customerRateId)).map(async (map: any) => {
                    const rate = await shipmentDB.getNetworkShipmentRateInfoByRateId(conn, map.rateId);
                    return {
                        rateId: rate.rateId,
                        rateType: rate.rateType,
                        multiplicationFactor: rate.multiplicationFactor,
                        multiplicationFactorUOM: rate.multiplicationFactorUOM,
                        rateValue: rate.rateValue,
                        totalRate: rate.totalRate
                    };
                })
            )
        }
        : null;

    const shipmentRateDetails: any = {};
    if (pickupRateDetails) shipmentRateDetails.pickupRateDetails = pickupRateDetails;
    if (linehaulRateDetails) shipmentRateDetails.linehaulRateDetails = linehaulRateDetails;
    if (deliveryRateDetails) shipmentRateDetails.deliveryRateDetails = deliveryRateDetails;
    if (carrierRateInfo) shipmentRateDetails.carrierRateId = carrierRateInfo.carrierRateId;
    if (carrierRateInfo) shipmentRateDetails.totalCarrierRate = carrierRateInfo.totalCarrierRate;
    if (customerRateDetails) shipmentRateDetails.customerRateDetails = customerRateDetails;

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
            entityId: shipperInfo.entityId
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
            entityId: consigneeInfo.entityId
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
            phoneNumber: pickupAirlineInfo.phoneNumber,
            entityId: pickupAirlineInfo.entityId,
            scenarioType: pickupAirlineInfo.scenarioType
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
            phoneNumber: deliveryAirlineInfo.phoneNumber,
            entityId: deliveryAirlineInfo.entityId,
            scenarioType: deliveryAirlineInfo.scenarioType
        } : undefined
    };

    if (!customerDetailsResponse.shipperDetails) delete customerDetailsResponse.shipperDetails;
    if (!customerDetailsResponse.consigneeDetails) delete customerDetailsResponse.consigneeDetails;
    if (!customerDetailsResponse.pickupAirlineDetails) delete customerDetailsResponse.pickupAirlineDetails;
    if (!customerDetailsResponse.deliveryAirlineDetails) delete customerDetailsResponse.deliveryAirlineDetails;

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
        editFromLocationDetails: pickupInfo.editFromLocation === 'Y'
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, pickupInfo.entityId, 'PICKUP', 'FROM')
            : undefined,
        pickupAgentTerminalDetails: pickupAgentTerminalInfo ? {
            pickupAgentTerminalId: pickupAgentTerminalInfo.pickupAgentTerminalId,
            shipmentId: pickupAgentTerminalInfo.shipmentId,
            entityId: pickupAgentTerminalInfo.entityId,
            toLocationType: pickupAgentTerminalInfo.toLocationType,
            toLocation: pickupAgentTerminalInfo.toLocation,
            toLocationEntityId: pickupAgentTerminalInfo.toLocationEntityId,
            editToLocation: pickupAgentTerminalInfo.editToLocation,
            editToLocationDetails: pickupAgentTerminalInfo.editToLocation === 'Y'
                ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, pickupInfo.entityId, 'PICKUP', 'TO')
                : undefined
        } : undefined,
        pickupAccessorialDetails: pickupAccessorials.length > 0 ? {
            accessorials: pickupAccessorials.map((row: any) => ({
                pickupAccessorialId: row.pickupAccessorialId,
                shipmentId: row.shipmentId,
                accessorialId: row.accessorialId,
                accessorialName: row.accessorialName,
                chargeType: row.chargeType,
                chargeValue: row.chargeValue,
                entityId: row.entityId,
                noteThreadId: row.noteThreadId
            }))
        } : undefined,
        pickupAlertDetails: pickupAlertInfo ? {
            pickupAlertId: pickupAlertInfo.pickupAlertId,
            shipmentId: pickupAlertInfo.shipmentId,
            inboundNotes: pickupAlertInfo.inboundNotes,
            emailInfo: {
                primaryEmail: pickupAlertInfo.primaryEmail,
                additionalEmails: parseEmailArray(pickupAlertInfo.additionalEmail)
            }
        } : undefined
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
        editFromLocationDetails: linehaulInfo.editFromLocation === 'Y'
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, linehaulInfo.entityId, 'LINE_HAUL', 'FROM')
            : undefined,
        editToLocationDetails: linehaulInfo.editToLocation === 'Y'
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, linehaulInfo.entityId, 'LINE_HAUL', 'TO')
            : undefined,
        linehaulCommonInfo: linehaulCommonInfo ? {
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
                    noteThreadId: row.noteThreadId
                }))
            } : undefined
        } : undefined
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
        editFromLocationDetails: deliveryInfo.editFromLocation === 'Y'
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, deliveryInfo.entityId, 'DELIVERY', 'FROM')
            : undefined,
        editToLocationDetails: deliveryInfo.editToLocation === 'Y'
            ? await shipmentDB.getAddressByShipmentIdLocationTypeAddressType(conn, deliveryInfo.entityId, 'DELIVERY', 'TO')
            : undefined,
        deliveryCommonInfo: deliveryCommonInfo ? {
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
                    noteThreadId: row.noteThreadId
                }))
            } : undefined,
            deliveryAlertDetails: deliveryAlertInfo ? {
                deliveryAlertId: deliveryAlertInfo.deliveryAlertId,
                shipmentId: deliveryAlertInfo.shipmentId,
                linehaulNotes: deliveryAlertInfo.linehaulNotes,
                deliveryNotes: deliveryAlertInfo.deliveryNotes,
                emailInfo: {
                    primaryEmail: deliveryAlertInfo.primaryEmail,
                    additionalEmails: parseEmailArray(deliveryAlertInfo.additionalEmail)
                }
            } : undefined
        } : undefined
    } : undefined;

    const carrierDetails: any = {};
    if (pickupDetailsResponse) carrierDetails.pickupDetails = pickupDetailsResponse;
    if (linehaulDetailsResponse) carrierDetails.linehaulDetails = {
        linehaulPrimaryInfo: linehaulDetailsResponse,
        linehaulCommonInfo: linehaulDetailsResponse.linehaulCommonInfo
    };
    if (deliveryDetailsResponse) carrierDetails.deliveryDetails = {
        deliveryPrimaryInfo: deliveryDetailsResponse,
        deliveryCommonInfo: deliveryDetailsResponse.deliveryCommonInfo
    };

    const response: any = {
        shipmentId: shipment.shipmentId,
        shipmentDetails: {
            typeOfShipment: shipment.typeOfShipment,
            serviceLevel: shipment.serviceLevel,
            shipmentDate: shipment.shipmentDate,
            shipmentTime: shipment.shipmentTime,
            orderReceivedPickupPending: (shipment as any).orderReceivedPickupPending,
            status: (shipment as any).status
        },
        customerDetails: customerDetailsResponse,
        commodityDetails: {
            commodityId: commodityInfo.commodityId,
            emergencyContactName: commodityInfo.emergencyContactName,
            emergencyContactPhone: commodityInfo.emergencyContactPhone,
            handlingUnits: handlingUnitsResponse
        },
        carrierDetails,
        shipmentRateDetails
    };

    if (!Object.keys(carrierDetails).length) delete response.carrierDetails;
    if (!Object.keys(shipmentRateDetails).length) delete response.shipmentRateDetails;

    return response;
}

export async function getNetworkShipmentForms(
    conn: Connection,
    pagination: ShipmentPaginationParams = { page: 1, limit: 10 }
): Promise<{ items: Array<any>; pagination: ShipmentPaginationMeta }> {
    const normalized = normalizePaginationParams(pagination?.page, pagination?.limit);
    const { totalItems, rows } = await shipmentDB.getNetworkShipmentList(conn, normalized.page, normalized.limit);

    const items = await Promise.all(
        rows.map(async (row: any) => {
            if (!row?.shipmentId) return null;
            return getNetworkShipmentView(conn, row.shipmentId);
        })
    );

    return {
        items: items.filter(Boolean),
        pagination: buildPaginationMeta(totalItems, normalized.page, normalized.limit)
    };
}

function parseApplicableFor(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        const cleaned = value.trim();
        if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            try {
                return JSON.parse(cleaned);
            } catch {
                return cleaned
                    .slice(1, -1)
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
        }
        return cleaned.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
}

function parseEmailArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch {
        return typeof value === 'string'
            ? value.split(',').map((item) => item.trim()).filter(Boolean)
            : [];
    }
}

function validateMatch(existing: any, incoming: any, entity: string) {
    const keysToCheck = Object.keys(incoming).filter(
        (key) => incoming[key] !== undefined && key !== `${entity}Id`
    );

    for (const key of keysToCheck) {
        if (existing[key] !== incoming[key]) {
            throw new Error(
                `${entity.toUpperCase()} MISMATCH: Field "${key}" does not match. ` +
                `Existing="${existing[key]}" Incoming="${incoming[key]}"`
            );
        }
    }
}

export async function updateNetworkShipment(conn: Connection, shipmentId: number, shipmentDetails: Partial<any>): Promise<any> {
    // Delegate to DB update and return refreshed view
    await shipmentDB.updateNetworkShipment(conn, shipmentId, shipmentDetails as any);
    return getNetworkShipmentView(conn, shipmentId);
}