import { Connection } from "odbc";
import { CreateNetworkShipmentRequest, DeliveryDetails, Accessorial, LinehaulPrimaryInfo } from "../../entities/shipment/shipmentTypes";
import * as shipmentDB from "../../database/shipment";
import * as entityDB from "../../database/maintenance";
import * as noteDB from "../../database/maintenance/note";


// export async function createNetworkShipment(
//     conn: Connection,
//     shipment: CreateNetworkShipmentRequest,
//     userId: number
// ): Promise<any> {
//     try {
//         console.log("Creating network shipment with details:", shipment);

//         /** -----------------------------
//          * 0. VALIDATE CUSTOMER AIRPORT RULES
//          * ----------------------------- */
//         const customerDetails = shipment.customerDetails;

//         if (
//             customerDetails.airportPickupService === "Y" &&
//             (!customerDetails.originAirportCode ||
//                 customerDetails.originAirportCode.trim() === "")
//         ) {
//             throw new Error(
//                 "originAirportCode is mandatory when airportPickupService is 'Y'"
//             );
//         }

//         if (
//             customerDetails.airportDeliveryService === "Y" &&
//             (!customerDetails.destinationAirportCode ||
//                 customerDetails.destinationAirportCode.trim() === "")
//         ) {
//             throw new Error(
//                 "destinationAirportCode is mandatory when airportDeliveryService is 'Y'"
//             );
//         }

//         if (
//             customerDetails.airportPickupService === "Y" &&
//             !("pickupAirlineDetails" in customerDetails)
//         ) {
//             throw new Error(
//                 "pickupAirlineDetails is required when airportPickupService is 'Y'"
//             );
//         }

//         if (
//             customerDetails.airportPickupService === "N" &&
//             !("shipperDetails" in customerDetails)
//         ) {
//             throw new Error(
//                 "shipperDetails is required when airportPickupService is 'N'"
//             );
//         }

//         if (
//             customerDetails.airportDeliveryService === "Y" &&
//             !("deliveryAirlineDetails" in customerDetails)
//         ) {
//             throw new Error(
//                 "deliveryAirlineDetails is required when airportDeliveryService is 'Y'"
//             );
//         }

//         if (
//             customerDetails.airportDeliveryService === "N" &&
//             !("consigneeDetails" in customerDetails)
//         ) {
//             throw new Error(
//                 "consigneeDetails is required when airportDeliveryService is 'N'"
//             );
//         }

//         /** -----------------------------
//          * 1. CREATE MAIN SHIPMENT
//          * ----------------------------- */
//         const createdShipment = await shipmentDB.createNetworkShipment(
//             conn,
//             shipment.shipmentDetails,
//             userId
//         );

//         const shipmentId = createdShipment.shipmentId;

//         /** -----------------------------
//          * 2. VALIDATE / CREATE SHIPPER
//          * ----------------------------- */
//         let createdShipperInfo: any = null;
//         let shipperEntityId: number | undefined;

//         if (customerDetails.airportPickupService === "N") {
//             const shipperDetails = customerDetails.shipperDetails;

//             if (shipperDetails.shipperId) {
//                 const existingShipper = await shipmentDB.getShipperById(
//                     conn,
//                     shipperDetails.shipperId
//                 );

//                 if (!existingShipper) {
//                     throw new Error("Invalid shipperId provided");
//                 }

//                 validateMatch(existingShipper, shipperDetails, "shipper");
//                 shipperEntityId = existingShipper.entityId;
//             } else {
//                 const entityId = await entityDB.createEntity(
//                     conn,
//                     "SHIPPER",
//                     shipperDetails.shipperName
//                 );

//                 createdShipperInfo = await shipmentDB.createShipperInfo(
//                     conn,
//                     { ...shipperDetails, entityId }
//                 );
//                 shipperEntityId = entityId;
//             }
//         }

//         /** -----------------------------
//          * 3. VALIDATE / CREATE CONSIGNEE
//          * ----------------------------- */
//         let createdConsigneeInfo: any = null;
//         let consigneeEntityId: number | undefined;

//         if (customerDetails.airportDeliveryService === "N") {
//             const consigneeDetails = customerDetails.consigneeDetails;

//             if (consigneeDetails.consigneeId) {
//                 const existingConsignee = await shipmentDB.getConsigneeById(
//                     conn,
//                     consigneeDetails.consigneeId
//                 );

//                 if (!existingConsignee) {
//                     throw new Error("Invalid consigneeId provided");
//                 }

//                 validateMatch(existingConsignee, consigneeDetails, "consignee");
//                 consigneeEntityId = existingConsignee.entityId;
//             } else {
//                 const entityId = await entityDB.createEntity(
//                     conn,
//                     "CONSIGNEE",
//                     consigneeDetails.consigneeName
//                 );
//                 createdConsigneeInfo = await shipmentDB.createConsigneeInfo(
//                     conn,
//                     { ...consigneeDetails, entityId }
//                 );
//                 consigneeEntityId = entityId;
//             }
//         }

//         /** -----------------------------
//          * 2.5. CREATE / VALIDATE PICKUP AIRLINE
//          * ----------------------------- */
//         let pickupAirlineEntityId: number | undefined;

//         if (customerDetails.airportPickupService === "Y") {
//             const pickupAirline = customerDetails.pickupAirlineDetails;

//             if (pickupAirline.airlineId) {
//                 // Existing airline - could validate here if needed
//                 pickupAirlineEntityId = pickupAirline.airlineId;
//             } else {
//                 // Create new airline entity
//                 const entityId = await entityDB.createEntity(
//                     conn,
//                     "AIRLINE",
//                     pickupAirline.airlineName
//                 );

//                 await shipmentDB.createAirlineInfo(
//                     conn,
//                     { ...pickupAirline, entityId }
//                 );
//                 pickupAirlineEntityId = entityId;
//             }
//         }

//         /** -----------------------------
//          * 3.5. CREATE / VALIDATE DELIVERY AIRLINE
//          * ----------------------------- */
//         let deliveryAirlineEntityId: number | undefined;

//         if (customerDetails.airportDeliveryService === "Y") {
//             const deliveryAirline = customerDetails.deliveryAirlineDetails;

//             if (deliveryAirline.airlineId) {
//                 // Existing airline - could validate here if needed
//                 deliveryAirlineEntityId = deliveryAirline.airlineId;
//             } else {
//                 // Create new airline entity
//                 const entityId = await entityDB.createEntity(
//                     conn,
//                     "AIRLINE",
//                     deliveryAirline.airlineName
//                 );

//                 await shipmentDB.createAirlineInfo(
//                     conn,
//                     { ...deliveryAirline, entityId }
//                 );
//                 deliveryAirlineEntityId = entityId;
//             }
//         }

//         /** -----------------------------
//          * 4. CREATE CUSTOMER + COMMODITY
//          * ----------------------------- */
//         const [createdCustomerInfo, createdCommodityInfo] = await Promise.all([
//             shipmentDB.createCustomerInfo(conn, shipment.customerDetails, shipmentId),

//             shipmentDB.createCommodityInfo(
//                 conn,
//                 shipment.commodityDetails,
//                 shipmentId
//             )
//         ]);

//         /** -----------------------------
//          * 6. CREATE MAPPINGS
//          * ----------------------------- */
//         const mappingTasks: Promise<any>[] = [];

//         if (customerDetails.airportPickupService === "N" && shipperEntityId) {
//             mappingTasks.push(
//                 shipmentDB.createShipperConsigneeAirlineMapping(
//                     conn,
//                     shipmentId,
//                     shipperEntityId
//                 )
//             );
//         }

//         if (customerDetails.airportDeliveryService === "N" && consigneeEntityId) {
//             mappingTasks.push(
//                 shipmentDB.createShipperConsigneeAirlineMapping(
//                     conn,
//                     shipmentId,
//                     consigneeEntityId
//                 )
//             );
//         }

//         if (customerDetails.airportPickupService === "Y" && pickupAirlineEntityId) {
//             mappingTasks.push(
//                 shipmentDB.createShipperConsigneeAirlineMapping(
//                     conn,
//                     shipmentId,
//                     pickupAirlineEntityId
//                 )
//             );
//         }

//         if (customerDetails.airportDeliveryService === "Y" && deliveryAirlineEntityId) {
//             mappingTasks.push(
//                 shipmentDB.createShipperConsigneeAirlineMapping(
//                     conn,
//                     shipmentId,
//                     deliveryAirlineEntityId
//                 )
//             );
//         }

//         await Promise.all(mappingTasks);

//         /** -----------------------------
//          * 7. CREATE HANDLING UNITS
//          * ----------------------------- */
//         const createdHandlingUnits = await Promise.all(
//             shipment.commodityDetails.handlingUnits.map((hu) =>
//                 shipmentDB.createHandlingUnitInfo(conn, hu, shipmentId)
//             )
//         );

//         /** -----------------------------
//          * 8. CREATE ITEMS
//          * ----------------------------- */
//         const itemTasks: Promise<any>[] = [];

//         shipment.commodityDetails.handlingUnits.forEach((hu, huIndex) => {
//             const handlingUnitId =
//                 createdHandlingUnits[huIndex].handlingUnitId;

//             hu.palletDetails.forEach((item) => {
//                 itemTasks.push(
//                     shipmentDB.createHandlingUnitItemInfo(
//                         conn,
//                         item,
//                         handlingUnitId
//                     )
//                 );
//             });
//         });

//         const createdItems = await Promise.all(itemTasks);

//         /** -----------------------------
//          * 9. CREATE HAZMAT
//          * ----------------------------- */
//         const hazmatTasks: Promise<any>[] = [];
//         let itemIndex = 0;

//         shipment.commodityDetails.handlingUnits.forEach((hu) => {
//             hu.palletDetails.forEach((item) => {
//                 const createdItem = createdItems[itemIndex];

//                 if (item.hazmat === "Y" && item.hazmatDetails) {
//                     hazmatTasks.push(
//                         shipmentDB.createHandlingUnitItemHazmatInfo(
//                             conn,
//                             item.hazmatDetails,
//                             createdItem.itemId
//                         )
//                     );
//                 }

//                 itemIndex++;
//             });
//         });

//         const createdHazmatDetails = await Promise.all(hazmatTasks);

//         /** -----------------------------
//          * 10. BUILD RESPONSE
//          * ----------------------------- */
//         const hazmatMap = new Map(
//             createdHazmatDetails.map((hz: any) => [hz.itemId, hz])
//         );

//         let responseItemIndex = 0;

//         const handlingUnitsResponse =
//             shipment.commodityDetails.handlingUnits.map((hu, huIndex) => {
//                 const createdHU = createdHandlingUnits[huIndex];

//                 const palletDetailsResponse = hu.palletDetails.map((item) => {
//                     const createdItem = createdItems[responseItemIndex];

//                     let hazmatResponse = undefined;

//                     if (item.hazmat === "Y" && item.hazmatDetails) {
//                         const hz = hazmatMap.get(createdItem.itemId);

//                         hazmatResponse = {
//                             ...item.hazmatDetails,
//                             hazmatId: hz?.hazmatId
//                         };
//                     }

//                     responseItemIndex++;

//                     return {
//                         ...item,
//                         itemId: createdItem.itemId,
//                         hazmatDetails: hazmatResponse
//                     };
//                 });

//                 return {
//                     ...hu,
//                     handlingUnitId: createdHU.handlingUnitId,
//                     palletDetails: palletDetailsResponse
//                 };
//             });

//         /** -----------------------------
//          * FINAL RESPONSE
//          * ----------------------------- */
//         const customerDetailsResponse: any = {
//             ...shipment.customerDetails,
//             customerInfoId: createdCustomerInfo.customerInfoId
//         };

//         if (customerDetails.airportPickupService === "N") {
//             const shipperId = createdShipperInfo?.shipperId || customerDetails.shipperDetails.shipperId;
//             customerDetailsResponse.shipperDetails = {
//                 ...customerDetails.shipperDetails,
//                 shipperId
//             };
//         }

//         if (customerDetails.airportDeliveryService === "N") {
//             const consigneeId = createdConsigneeInfo?.consigneeId || customerDetails.consigneeDetails.consigneeId;
//             customerDetailsResponse.consigneeDetails = {
//                 ...customerDetails.consigneeDetails,
//                 consigneeId
//             };
//         }

//         return {
//             shipmentDetails: {
//                 ...shipment.shipmentDetails,
//                 shipmentId
//             },
//             customerDetails: customerDetailsResponse,
//             commodityDetails: {
//                 ...shipment.commodityDetails,
//                 commodityId: createdCommodityInfo.commodityId,
//                 handlingUnits: handlingUnitsResponse
//             }
//         };
//     } catch (error) {
//         throw error;
//     }
// }



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

        console.log("[SHIPMENT] Step 1: Creating main shipment record");

        const createdShipment = await shipmentDB.createNetworkShipment(
            conn,
            shipment.shipmentDetails,
            userId
        );

        console.log("[SHIPMENT] Created shipment with ID:", createdShipment.shipmentId);

        const shipmentId = createdShipment.shipmentId;

        /** -----------------------------
         * 2. VALIDATE / CREATE SHIPPER
         * ----------------------------- */
        let createdShipperInfo: any = null;
        let shipperEntityId: number | undefined;

        console.log("[SHIPMENT] Step 2: Validating/Creating shipper info");

        if (customerDetails.airportPickupService === "N") {
            const shipperDetails = customerDetails.shipperDetails;

            console.log("[SHIPMENT] Shipper details:", shipperDetails);

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

        console.log("[SHIPMENT] Step 3: Validating/Creating consignee info");

        if (customerDetails.airportDeliveryService === "N") {
            const consigneeDetails = customerDetails.consigneeDetails;

            console.log("[SHIPMENT] Consignee details:", consigneeDetails);

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

        console.log("[SHIPMENT] Step 3.5: Validating/Creating pickup airline info");

        if (customerDetails.airportPickupService === "Y") {
            const pickupAirline = customerDetails.pickupAirlineDetails;

            if (pickupAirline.airlineId) {
                // Existing airline - could validate here if needed
                pickupAirlineEntityId = pickupAirline.airlineId;
            } else {
                // Create new airline entity
                console.log("[SHIPMENT] Creating new pickup airline entity for:", pickupAirline.airlineName);
                const entityId = await entityDB.createEntity(
                    conn,
                    "AIRLINE",
                    pickupAirline.airlineName
                );

                console.log("[SHIPMENT] Created pickup airline entity with ID:", entityId);
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

        console.log("[SHIPMENT] Step 3.5: Validating/Creating delivery airline info");

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
        console.log("[SHIPMENT] Step 4: Creating customer and commodity info");
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

        console.log("[SHIPMENT] Step 6: Creating mappings between shipment and shipper/consignee/airline");
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
            console.log("[SHIPMENT] Step 6: Creating delivery airline mapping");
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
        console.log("[SHIPMENT] Step 7: Creating handling units");
        const createdHandlingUnits = await Promise.all(
            shipment.commodityDetails.handlingUnits.map((hu) =>
                shipmentDB.createHandlingUnitInfo(conn, hu, shipmentId)
            )
        );

        /** -----------------------------
         * 8. CREATE ITEMS
         * ----------------------------- */

        console.log("[SHIPMENT] Step 8: Creating items for handling units");

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


        //Step - 4 -- Create Carrier Info if orderReceivedPickupPending is 'N'
        if (shipment.shipmentDetails.orderReceivedPickupPending === 'N') {

            // COMMON PICKUP CREATION FOR ALL ROUTING CASES
            // ================================================
            console.log("[SHIPMENT] Step 4: Creating carrier info");
            console.log("[PICKUP] Routing:", shipment.carrierDetails.pickupDetails.pickupRouting);

            const carrierDetails = shipment.carrierDetails;

            if (!carrierDetails.pickupDetails)
                throw new Error("pickupDetails is required");

            // Create Pickup Entity
            console.log("[PICKUP] Creating pickup entity for shipmentId:", shipmentId);
            const pickupEntityId = await entityDB.createEntity(
                conn,
                "PICKUP",
                `Pickup for Shipment ${shipmentId}`
            );
            console.log("[PICKUP] Created pickup entity:", pickupEntityId);

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
            //Create the main pickup info record
            console.log("[PICKUP] Creating pickup info record");
            console.log("[PICKUP] Pickup details:", pickupDetails);
            await shipmentDB.createNetworkShipmentPickupInfo(conn, pickupDetails, shipmentId);
            console.log("[PICKUP] Pickup info created successfully");

            // Create FROM location if editing
            if (pickupDetails.editFromLocationDetails) {
                console.log("[PICKUP] Creating FROM location address");
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
                    "Pickup"
                );

            }

            // Create Agent Terminal details if applicable
            console.log("[PICKUP] Agent terminal:", pickupDetails.pickupAgentTerminal);
            if (pickupDetails.pickupAgentTerminal === 'Y') {
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

                console.log("[PICKUP] Creating agent terminal details:", pickupAgentTerminalDetails);

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
                            "Pickup"
                        );
                    }
                }
            }

            // Create accessories if applicable
            console.log("[PICKUP] Accessories:", pickupDetails.pickupAccessorial);
            if (pickupDetails.pickupAccessorial === 'Y') {
                if (!pickupDetails?.pickupAccessorialDetails)
                    throw new Error("pickupAccessorialDetails is required");
                console.log("[PICKUP] Creating accessories, count:", pickupDetails.pickupAccessorialDetails.accessorials.length);

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
                console.log("[PICKUP] Creating pickup alert");

                await shipmentDB.createNetworkShipmentPickupAlertInfo(conn, shipmentId, pickupDetails.pickupAlertDetails);
            }
            console.log("[PICKUP] Pickup alert created successfully");

            // ROUTING-SPECIFIC LINEHAUL AND DELIVERY LOGIC
            // ================================================
            switch (shipment.carrierDetails.pickupDetails.pickupRouting) {
                case 'PICKUP_ONLY':
                    {
                        console.log("[ROUTING] PICKUP_ONLY case started");
                        // PICKUP_ONLY: Create linehaul and delivery based on linehaul routing type
                        // Sub-cases:
                        // 1. LINE_HAUL: Full linehaul (toLocationType=CARRIER) + Full delivery with deliveryPrimaryInfo
                        // 2. LINE_HAUL_DELIVERY: Full linehaul (toLocationType=CONSIGNEE) + Minimal delivery (NO deliveryPrimaryInfo)

                        const linehaulDetails = shipment.carrierDetails.linehaulDetails;

                        // Type guard: Check if linehaulPrimaryInfo exists (it will in PICKUP_ONLY case)
                        if ('linehaulPrimaryInfo' in linehaulDetails) {
                            const linehaulRouting = linehaulDetails.linehaulPrimaryInfo.linehaulRouting;

                            switch (linehaulRouting) {
                                case 'LINE_HAUL':
                                    {
                                        console.log("[LINEHAUL] LINE_HAUL sub-case: Creating full linehaul + full delivery");
                                        // PICKUP_ONLY + LINE_HAUL:
                                        // - Linehaul has FULL primary info with toLocationType=CARRIER
                                        // - Delivery has FULL primary info + common info (full delivery entity with addresses)

                                        // Create Linehaul Entity
                                        const linehaulEntityId = await entityDB.createEntity(
                                            conn,
                                            "LINEHAUL",
                                            `Linehaul for Shipment ${shipmentId}`
                                        );

                                        let fromLocationEntityId;

                                        if (linehaulDetails.linehaulPrimaryInfo.fromLocationType === 'Carrier') {
                                            if (!pickupAirlineEntityId && !shipperEntityId)
                                                throw new Error("Pickup Airline entityId is required for Carrier fromLocationType");
                                            fromLocationEntityId = pickupAirlineEntityId;
                                        }

                                        let toLocationEntityId;

                                        if (linehaulDetails.linehaulPrimaryInfo.toLocationType === 'Carrier') {
                                            if (!linehaulDetails.linehaulPrimaryInfo.toLocationEntityId)
                                                throw new Error("Delivery Airline entityId is required for Carrier toLocationType");
                                            toLocationEntityId = linehaulDetails.linehaulPrimaryInfo.toLocationEntityId;
                                        }

                                        // Create Linehaul Primary Info
                                        await shipmentDB.createNetworkShipmentLinehaulPrimaryInfo(conn, shipmentId, {
                                            ...linehaulDetails.linehaulPrimaryInfo,
                                            entityId: linehaulEntityId,
                                            fromLocationEntityId: fromLocationEntityId,
                                            toLocationEntityId: toLocationEntityId
                                        });

                                        // Create FROM location address and mapping
                                        console.log("[LINEHAUL] FROM location editing:", !!linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails);
                                        if (linehaulDetails.linehaulPrimaryInfo.editFromLocationDetails) {
                                            console.log("[LINEHAUL] Creating FROM address");
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
                                                    "Linehaul"
                                                );
                                            }
                                        }

                                        // Create TO location address and mapping
                                        console.log("[LINEHAUL] TO location editing:", !!linehaulDetails.linehaulPrimaryInfo.editToLocationDetails);
                                        if (linehaulDetails.linehaulPrimaryInfo.editToLocationDetails) {
                                            console.log("[LINEHAUL] Creating TO address");
                                            const linehaulToAddress = {
                                                addressLine1: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.addressLine1 || '',
                                                addressLine2: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.addressLine2 || '',
                                                city: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.city || '',
                                                state: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.state || '',
                                                zipCode: linehaulDetails.linehaulPrimaryInfo.editToLocationDetails.zipCode || ''
                                            };
                                            const createdToAddress = await shipmentDB.createNetworkShipmentAddress(conn, linehaulToAddress);
                                            console.log("[LINEHAUL] Created TO address with ID:", createdToAddress.addressId);
                                            if (linehaulEntityId) {
                                                await shipmentDB.createNetworkShipmentEntityAddressMapping(
                                                    conn,
                                                    linehaulEntityId,
                                                    createdToAddress.addressId,
                                                    "TO",
                                                    "Linehaul"
                                                );
                                            }
                                        }

                                        console.log("[LINEHAUL] Linehaul addresses created successfully");
                                        // Create linehaul accessories if applicable
                                        if (linehaulDetails.linehaulCommonInfo.linehaulAccessorial === 'Y') {
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
                                        const deliveryDetails = shipment.carrierDetails.deliveryDetails as DeliveryDetails;
                                        let deliveryFromLocationEntityId;
                                        if (deliveryDetails.deliveryPrimaryInfo.fromLocationType === 'Carrier') {
                                            if (!deliveryDetails.deliveryPrimaryInfo.fromLocationEntityId)
                                                throw new Error("Delivery Airline entityId is required for Carrier fromLocationType");
                                            deliveryFromLocationEntityId = deliveryDetails.deliveryPrimaryInfo.fromLocationEntityId;
                                        }
                                        let deliveryToLocationEntityId;
                                        if (deliveryDetails.deliveryPrimaryInfo.toLocationType === 'Consignee') {
                                            if (!consigneeEntityId && deliveryAirlineEntityId)
                                                throw new Error("Consignee entityId is required for Consignee toLocationType");
                                            deliveryToLocationEntityId = consigneeEntityId || deliveryAirlineEntityId;
                                        }
                                        await shipmentDB.createNetworkShipmentDeliveryPrimaryInfo(conn, shipmentId, {
                                            ...deliveryDetails.deliveryPrimaryInfo,
                                            entityId: deliveryEntityId,
                                            fromLocationEntityId: deliveryFromLocationEntityId,
                                            toLocationEntityId: deliveryToLocationEntityId
                                        });

                                        // Create FROM location address and mapping for delivery
                                        console.log("[DELIVERY] FROM location editing:", !!deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails);
                                        if (deliveryDetails.deliveryPrimaryInfo.editFromLocationDetails) {
                                            console.log("[DELIVERY] Creating FROM address");
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
                                                    "Delivery"
                                                );
                                            }
                                        }

                                        // Create TO location address and mapping for delivery
                                        console.log("[DELIVERY] TO location editing:", !!deliveryDetails.deliveryPrimaryInfo.editToLocationDetails);
                                        if (deliveryDetails.deliveryPrimaryInfo.editToLocationDetails) {
                                            console.log("[DELIVERY] Creating TO address");
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
                                                    "Delivery"
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
                                case 'LINE_HAUL_DELIVERY':
                                    {
                                        // PICKUP_ONLY + LINE_HAUL_DELIVERY:
                                        // - Linehaul has FULL primary info but toLocationType=CONSIGNEE (embedded)
                                        // - Delivery has NO primary info, only commonInfo (accessories + alert only, no address mapping)

                                        // Create Linehaul Entity
                                        const linehaulEntityId = await entityDB.createEntity(
                                            conn,
                                            "LINEHAUL",
                                            `Linehaul for Shipment ${shipmentId}`
                                        );

                                        let fromLocationEntityId;

                                        if (linehaulDetails.linehaulPrimaryInfo.fromLocationType === 'Carrier') {
                                            if (!linehaulDetails.linehaulPrimaryInfo.fromLocationEntityId)
                                                throw new Error("Pickup Airline entityId is required for Carrier fromLocationType");
                                            fromLocationEntityId = linehaulDetails.linehaulPrimaryInfo.fromLocationEntityId;
                                        }

                                        let toLocationEntityId;

                                        if (linehaulDetails.linehaulPrimaryInfo.toLocationType === 'Consignee') {
                                            if (!consigneeEntityId && !deliveryAirlineEntityId)
                                                throw new Error("Consignee entityId is required for Consignee toLocationType");
                                            toLocationEntityId = consigneeEntityId || deliveryAirlineEntityId;
                                        }



                                        // Create Linehaul Primary Info
                                        await shipmentDB.createNetworkShipmentLinehaulPrimaryInfo(conn, shipmentId, {
                                            ...linehaulDetails.linehaulPrimaryInfo,
                                            entityId: linehaulEntityId,
                                            fromLocationEntityId: fromLocationEntityId,
                                            toLocationEntityId: toLocationEntityId
                                        } as LinehaulPrimaryInfo & { entityId: number });

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
                                                    "Linehaul"
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
                                                    "Linehaul"
                                                );
                                            }
                                        }

                                        // Create linehaul accessories if applicable
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

                                        // Minimal Delivery: Only accessories + alert, NO primary info (no address mapping)
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
                        } else {
                            // This branch should never happen in PICKUP_ONLY case, but TypeScript requires it for safety
                            throw new Error("linehaulPrimaryInfo is required for PICKUP_ONLY routing");
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
                                    "Delivery"
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
                                    "Delivery"
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
        }

        /** -----------------------------
         * FINAL RESPONSE
         * ----------------------------- */
        console.log("[SHIPMENT] Shipment creation completed successfully. ShipmentId:", shipmentId);
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