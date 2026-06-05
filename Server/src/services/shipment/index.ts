import { Connection } from "odbc";
import { CreateNetworkShipmentRequest } from "../../entities/shipment";
import * as shipmentDB from "../../database/shipment";
import * as entityDB from "../../database/maintenance";


export async function createNetworkShipment(
    conn: Connection,
    shipment: CreateNetworkShipmentRequest,
    userId: number
): Promise<any> {
    try {
        console.log("Creating network shipment with details:", shipment);

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

                createdShipperInfo = await shipmentDB.createShipperInfo(
                    conn,
                    { ...shipperDetails, entityId }
                );
                shipperEntityId = entityId;
            }
        }

        /** -----------------------------
         * 3. VALIDATE / CREATE CONSIGNEE
         * ----------------------------- */
        let createdConsigneeInfo: any = null;
        let consigneeEntityId: number | undefined;

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
                createdConsigneeInfo = await shipmentDB.createConsigneeInfo(
                    conn,
                    { ...consigneeDetails, entityId }
                );
                consigneeEntityId = entityId;
            }
        }

        /** -----------------------------
         * 2.5. CREATE / VALIDATE PICKUP AIRLINE
         * ----------------------------- */
        let pickupAirlineEntityId: number | undefined;

        if (customerDetails.airportPickupService === "Y") {
            const pickupAirline = customerDetails.pickupAirlineDetails;

            if (pickupAirline.airlineId) {
                // Existing airline - could validate here if needed
                pickupAirlineEntityId = pickupAirline.airlineId;
            } else {
                // Create new airline entity
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
         * 3.5. CREATE / VALIDATE DELIVERY AIRLINE
         * ----------------------------- */
        let deliveryAirlineEntityId: number | undefined;

        if (customerDetails.airportDeliveryService === "Y") {
            const deliveryAirline = customerDetails.deliveryAirlineDetails;

            if (deliveryAirline.airlineId) {
                // Existing airline - could validate here if needed
                deliveryAirlineEntityId = deliveryAirline.airlineId;
            } else {
                // Create new airline entity
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
         * 4. CREATE CUSTOMER + COMMODITY
         * ----------------------------- */
        const [createdCustomerInfo, createdCommodityInfo] = await Promise.all([
            shipmentDB.createCustomerInfo(conn, shipment.customerDetails, shipmentId),

            shipmentDB.createCommodityInfo(
                conn,
                shipment.commodityDetails,
                shipmentId
            )
        ]);

        /** -----------------------------
         * 6. CREATE MAPPINGS
         * ----------------------------- */
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
         * 7. CREATE HANDLING UNITS
         * ----------------------------- */
        const createdHandlingUnits = await Promise.all(
            shipment.commodityDetails.handlingUnits.map((hu) =>
                shipmentDB.createHandlingUnitInfo(conn, hu, shipmentId)
            )
        );

        /** -----------------------------
         * 8. CREATE ITEMS
         * ----------------------------- */
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
         * 9. CREATE HAZMAT
         * ----------------------------- */
        const hazmatTasks: Promise<any>[] = [];
        let itemIndex = 0;

        shipment.commodityDetails.handlingUnits.forEach((hu) => {
            hu.palletDetails.forEach((item) => {
                const createdItem = createdItems[itemIndex];

                if (item.hazmat === "Y" && item.hazmatDetails) {
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
         * 10. BUILD RESPONSE
         * ----------------------------- */
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

        /** -----------------------------
         * FINAL RESPONSE
         * ----------------------------- */
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
        throw error;
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