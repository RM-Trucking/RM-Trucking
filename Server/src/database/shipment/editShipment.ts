import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";

function normalizeDateTimeValue(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
    }
    return value as string | null;
}

type SqlValue = unknown | { raw: string };

function isSqlExpression(value: SqlValue): value is { raw: string } {
    return typeof value === "object" && value !== null && "raw" in value;
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

export async function createNetworkShipmentAddress(
    conn: Connection,
    addressDetails: Record<string, any>
): Promise<{ addressId: number }> {
    const payload: Record<string, SqlValue> = {
        line1: addressDetails.addressLine1,
        line2: addressDetails.addressLine2 ?? addressDetails.line2 ?? "",
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
): Promise<{ mappingId?: number }> {
    const payload: Record<string, SqlValue> = {
        entityId,
        addressId,
        addressType,
        locationType,
    };

    return insertWithReturning(conn, '"Entity_Network_Shipment_Address_Map"', payload);
}

export async function getExistingPickupEntityId(
    conn: Connection,
    shipmentId: number
): Promise<number | undefined> {
    const result = await conn.query(
        `SELECT "entityId" FROM ${SCHEMA}."Network_Shipment_Pickup_Info"
         WHERE "shipmentId" = ?
         FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];

    return result[0]?.entityId;
}

export async function getExistingLinehaulEntityId(
    conn: Connection,
    shipmentId: number
): Promise<number | undefined> {
    const result = await conn.query(
        `SELECT "entityId" FROM ${SCHEMA}."Network_Shipment_Linehaul_Info"
         WHERE "shipmentId" = ?
         FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];

    return result[0]?.entityId;
}

export async function getExistingDeliveryEntityId(
    conn: Connection,
    shipmentId: number
): Promise<number | undefined> {
    const result = await conn.query(
        `SELECT "entityId" FROM ${SCHEMA}."Network_Shipment_Delivery_Info"
         WHERE "shipmentId" = ?
         FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];

    return result[0]?.entityId;
}

async function clearAddressMapping(
    conn: Connection,
    entityId: number | undefined,
    addressType: "FROM" | "TO",
    locationType: "PICKUP" | "LINE_HAUL" | "DELIVERY"
): Promise<void> {
    if (!entityId) return;

    await conn.query(
        `DELETE FROM ${SCHEMA}."Entity_Network_Shipment_Address_Map"
         WHERE "entityId" = ? AND "addressType" = ? AND "locationType" = ?`,
        [entityId, addressType, locationType]
    );
}

export async function updateNetworkShipment(
    conn: Connection,
    shipmentId: number,
    shipmentDetails: Record<string, any>
): Promise<void> {
    const fieldsToUpdate: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(shipmentDetails)) {
        if (value === undefined || key === "shipmentId") continue;
        fieldsToUpdate.push(`"${key}" = ?`);
        params.push(
            key === "shipmentDate" || key === "shipmentTime"
                ? normalizeDateTimeValue(value)
                : value
        );
    }

    if (fieldsToUpdate.length === 0) return;

    params.push(shipmentId);
    const query = `
        UPDATE ${SCHEMA}."Network_Shipment"
        SET ${fieldsToUpdate.join(", ")}
        WHERE "shipmentId" = ?
    `;

    await conn.query(query, params);
}

export async function upsertCustomerInfo(
    conn: Connection,
    shipmentId: number,
    customerDetails: Record<string, any>
): Promise<void> {
    const existing = await conn.query(
        `SELECT "shipmentId" FROM ${SCHEMA}."Network_Shipment_Customer_Info" WHERE "shipmentId" = ? FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];

    if (existing.length) {
        const fields = Object.entries(customerDetails)
            .filter(([key, value]) => value !== undefined && key !== "shipmentId")
            .map(([key]) => `"${key}" = ?`)
            .join(", ");

        const values = Object.entries(customerDetails)
            .filter(([key, value]) => value !== undefined && key !== "shipmentId")
            .map(([, value]) => value);

        values.push(shipmentId);

        await conn.query(
            `UPDATE ${SCHEMA}."Network_Shipment_Customer_Info" SET ${fields} WHERE "shipmentId" = ?`,
            values
        );
        return;
    }

    await insertWithReturning(conn, '"Network_Shipment_Customer_Info"', {
        shipmentId,
        ...customerDetails,
    });
}

export async function replaceCustomerReferenceNumbers(
    conn: Connection,
    shipmentId: number,
    referenceNumbers: Array<{ referenceType?: string; referenceNumber?: string }> = []
): Promise<void> {
    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Customer_Reference_Number" WHERE "shipmentId" = ?`,
        [shipmentId]
    );

    for (const item of referenceNumbers) {
        if (!item.referenceType && !item.referenceNumber) continue;
        await insertWithReturning(conn, '"Network_Shipment_Customer_Reference_Number"', {
            shipmentId,
            referenceType: item.referenceType,
            referenceNumber: item.referenceNumber,
        });
    }
}

export async function replaceShipmentEntityMapping(
    conn: Connection,
    shipmentId: number,
    entityId: number | undefined,
    entityType: "SHIPPER" | "CONSIGNEE" | "AIRLINE",
    entityName: string
): Promise<number | undefined> {
    if (!entityId) {
        const entityQuery = `
            SELECT "entityId" FROM ${SCHEMA}."Entity"
            WHERE "entityType" = ? AND "entityName" = ?
            FETCH FIRST 1 ROW ONLY
        `;
        const match = await conn.query(entityQuery, [entityType, entityName]) as any[];
        if (match[0]?.entityId) {
            entityId = match[0].entityId;
        }
    }

    if (!entityId) return undefined;

    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping"
         WHERE "shipmentId" = ?
           AND "entityId" IN (
               SELECT "entityId" FROM ${SCHEMA}."Entity" WHERE "entityType" = ?
           )`,
        [shipmentId, entityType]
    );

    await insertWithReturning(conn, '"Network_Shipment_Shipper_Consignee_Airline_Mapping"', {
        shipmentId,
        entityId,
    });

    return entityId;
}

export async function deleteShipmentEntityMapping(
    conn: Connection,
    shipmentId: number,
    entityId: number | undefined,
    entityType?: "SHIPPER" | "CONSIGNEE" | "AIRLINE"
): Promise<void> {
    if (!entityId) return;

    const conditions = [`"shipmentId" = ?`, `"entityId" = ?`];
    const values = [shipmentId, entityId];

    if (entityType) {
        const query = `
            SELECT "entityId" FROM ${SCHEMA}."Entity"
            WHERE "entityType" = ? AND "entityId" = ?
            FETCH FIRST 1 ROW ONLY
        `;
        const match = await conn.query(query, [entityType, entityId]) as any[];
        if (!match[0]) {
            await conn.query(
                `DELETE FROM ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping" WHERE "shipmentId" = ? AND "entityId" = ?`,
                values
            );
            return;
        }
    }

    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Shipper_Consignee_Airline_Mapping" WHERE "shipmentId" = ? AND "entityId" = ?`,
        values
    );
}

export async function upsertShipperInfo(conn: Connection, shipperDetails: Record<string, any>): Promise<any> {
    const payload = {
        shipperName: shipperDetails.shipperName,
        addressLine1: shipperDetails.addressLine1,
        addressLine2: shipperDetails.addressLine2 ?? "",
        city: shipperDetails.city,
        state: shipperDetails.state,
        zipCode: shipperDetails.zipCode,
        contactPersonName: shipperDetails.contactPersonName,
        phoneNumber: shipperDetails.phoneNumber,
        entityId: shipperDetails.entityId,
    };

    if (shipperDetails.entityId) {
        await conn.query(
            `UPDATE ${SCHEMA}."Network_Shipment_Shipper_Info" SET "shipperName" = ?, "addressLine1" = ?, "addressLine2" = ?, "city" = ?, "state" = ?, "zipCode" = ?, "contactPersonName" = ?, "phoneNumber" = ? WHERE "entityId" = ?`,
            [payload.shipperName, payload.addressLine1, payload.addressLine2, payload.city, payload.state, payload.zipCode, payload.contactPersonName, payload.phoneNumber, shipperDetails.entityId]
        );
        return { entityId: shipperDetails.entityId };
    }

    return insertWithReturning(conn, '"Network_Shipment_Shipper_Info"', payload);
}

export async function upsertConsigneeInfo(conn: Connection, consigneeDetails: Record<string, any>): Promise<any> {
    const payload = {
        consigneeName: consigneeDetails.consigneeName,
        addressLine1: consigneeDetails.addressLine1,
        addressLine2: consigneeDetails.addressLine2 ?? "",
        city: consigneeDetails.city,
        state: consigneeDetails.state,
        zipCode: consigneeDetails.zipCode,
        contactPersonName: consigneeDetails.contactPersonName,
        phoneNumber: consigneeDetails.phoneNumber,
        entityId: consigneeDetails.entityId,
    };

    if (consigneeDetails.entityId) {
        await conn.query(
            `UPDATE ${SCHEMA}."Network_Shipment_Consignee_Info" SET "consigneeName" = ?, "addressLine1" = ?, "addressLine2" = ?, "city" = ?, "state" = ?, "zipCode" = ?, "contactPersonName" = ?, "phoneNumber" = ? WHERE "entityId" = ?`,
            [payload.consigneeName, payload.addressLine1, payload.addressLine2, payload.city, payload.state, payload.zipCode, payload.contactPersonName, payload.phoneNumber, consigneeDetails.entityId]
        );
        return { entityId: consigneeDetails.entityId };
    }

    return insertWithReturning(conn, '"Network_Shipment_Consignee_Info"', payload);
}

export async function upsertAirlineInfo(conn: Connection, airlineDetails: Record<string, any>): Promise<any> {
    const payload = {
        airlineNumber: airlineDetails.airlineNumber,
        airlineCode: airlineDetails.airlineCode,
        airportCode: airlineDetails.airportCode,
        airlineName: airlineDetails.airlineName,
        addressLine1: airlineDetails.addressLine1 ?? "",
        addressLine2: airlineDetails.addressLine2 ?? "",
        city: airlineDetails.city,
        state: airlineDetails.state ?? "",
        zipCode: airlineDetails.zipCode ?? "",
        contactPersonName: airlineDetails.contactPersonName ?? "",
        phoneNumber: airlineDetails.phoneNumber ?? "",
        entityId: airlineDetails.entityId,
        scenarioType: airlineDetails.scenarioType,
    };

    if (airlineDetails.entityId) {
        await conn.query(
            `UPDATE ${SCHEMA}."Airline" SET "airlineNumber" = ?, "airlineCode" = ?, "airportCode" = ?, "airlineName" = ?, "addressLine1" = ?, "addressLine2" = ?, "city" = ?, "state" = ?, "zipCode" = ?, "contactPersonName" = ?, "phoneNumber" = ?, "scenarioType" = ? WHERE "entityId" = ?`,
            [payload.airlineNumber, payload.airlineCode, payload.airportCode, payload.airlineName, payload.addressLine1, payload.addressLine2, payload.city, payload.state, payload.zipCode, payload.contactPersonName, payload.phoneNumber, payload.scenarioType, airlineDetails.entityId]
        );
        return { entityId: airlineDetails.entityId };
    }

    return insertWithReturning(conn, '"Airline"', payload);
}

export async function upsertCommodityInfo(
    conn: Connection,
    shipmentId: number,
    commodityDetails: Record<string, any>
): Promise<void> {
    const existing = await conn.query(
        `SELECT "shipmentId" FROM ${SCHEMA}."Network_Shipment_Commodity_Info" WHERE "shipmentId" = ? FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];

    if (existing.length) {
        await conn.query(
            `UPDATE ${SCHEMA}."Network_Shipment_Commodity_Info" SET "emergencyContactName" = ?, "emergencyContactPhone" = ? WHERE "shipmentId" = ?`,
            [commodityDetails.emergencyContactName, commodityDetails.emergencyContactPhone, shipmentId]
        );
        await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit" WHERE "shipmentId" = ?`, [shipmentId]);
        return;
    }

    await insertWithReturning(conn, '"Network_Shipment_Commodity_Info"', {
        shipmentId,
        emergencyContactName: commodityDetails.emergencyContactName,
        emergencyContactPhone: commodityDetails.emergencyContactPhone,
    });

    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit" WHERE "shipmentId" = ?`, [shipmentId]);
}

export async function replaceHandlingUnits(
    conn: Connection,
    shipmentId: number,
    handlingUnits: Array<Record<string, any>> = []
): Promise<void> {
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item" WHERE "handlingUnitId" IN (SELECT "handlingUnitId" FROM ${SCHEMA}."Network_Shipment_Handling_Unit" WHERE "shipmentId" = ? )`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit" WHERE "shipmentId" = ?`, [shipmentId]);

    for (const handlingUnit of handlingUnits) {
        const created = await insertWithReturning(conn, '"Network_Shipment_Handling_Unit"', {
            shipmentId,
            handlingUnitUOM: handlingUnit.handlingUnitUOM,
            handlingUnits: handlingUnit.handlingUnits,
            unit: handlingUnit.unit,
            handlingLength: handlingUnit.handlingLength,
            handlingWidth: handlingUnit.handlingWidth,
            handlingHeight: handlingUnit.handlingHeight,
            handlingWeight: handlingUnit.handlingWeight,
            handlingWeightUnit: handlingUnit.handlingWeightUnit,
            class: handlingUnit.class,
        });

        for (const pallet of handlingUnit.palletDetails ?? []) {
            const shouldDeleteHazmat =
                pallet.delete === true ||
                pallet.hazmat === "N" ||
                pallet.hazmat === "" ||
                pallet.hazmat === undefined ||
                pallet.hazmatDetails?.delete === true;

            if (pallet.itemId) {
                await conn.query(
                    `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item_Hazmat_Info" WHERE "itemId" = ?`,
                    [pallet.itemId]
                );
            }

            const item = await insertWithReturning(conn, '"Network_Shipment_Handling_Unit_Item"', {
                handlingUnitId: created.handlingUnitId,
                pieces: pallet.pieces,
                piecesUOM: pallet.piecesUOM,
                description: pallet.description,
                hazmat: shouldDeleteHazmat ? "N" : pallet.hazmat,
            });

            if (pallet.hazmat === "Y" && pallet.hazmatDetails && pallet.hazmatDetails.delete !== true) {
                await insertWithReturning(conn, '"Network_Shipment_Handling_Unit_Item_Hazmat_Info"', {
                    itemId: item.itemId,
                    unNumber: pallet.hazmatDetails.unNumber,
                    properShippingName: pallet.hazmatDetails.properShippingName,
                    hazardClass: pallet.hazmatDetails.hazardClass,
                    packingGroup: pallet.hazmatDetails.packingGroup,
                    weight: pallet.hazmatDetails.weight,
                    weightUnit: pallet.hazmatDetails.weightUnit,
                    technicalName: pallet.hazmatDetails.technicalName,
                    contactPhoneNumber: pallet.hazmatDetails.contactPhoneNumber,
                    hazmatDescription: pallet.hazmatDetails.hazmatDescription,
                    limitedQuantity: pallet.hazmatDetails.limitedQuantity,
                    marinePollutant: pallet.hazmatDetails.marinePollutant,
                    residueLastContained: pallet.hazmatDetails.residueLastContained,
                    reportableQuantity: pallet.hazmatDetails.reportableQuantity,
                    dotExemption: pallet.hazmatDetails.dotExemption,
                });
            } else if (shouldDeleteHazmat && item.itemId) {
                await conn.query(
                    `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item_Hazmat_Info" WHERE "itemId" = ?`,
                    [item.itemId]
                );
            }
        }
    }
}

export async function replacePickupInfo(
    conn: Connection,
    shipmentId: number,
    pickupDetails: Record<string, any>
): Promise<void> {
    if (!pickupDetails) return;

    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Pickup_Accessorial" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Pickup_Alert_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Pickup_Agent_Terminal_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Pickup_Info" WHERE "shipmentId" = ?`, [shipmentId]);

    const pickup = await insertWithReturning(conn, '"Network_Shipment_Pickup_Info"', {
        shipmentId,
        entityId: pickupDetails.entityId,
        pickupRouting: pickupDetails.pickupRouting,
        airportTransfer: pickupDetails.airportTransfer,
        carrierId: pickupDetails.carrierId,
        terminalId: pickupDetails.terminalId,
        fromLocationType: pickupDetails.fromLocationType,
        fromLocation: pickupDetails.fromLocation,
        fromLocationEntityId: pickupDetails.fromLocationEntityId,
        editFromLocation: pickupDetails.editFromLocation,
        pickupAgentTerminal: pickupDetails.pickupAgentTerminal,
        pickupAccessorial: pickupDetails.pickupAccessorial,
        pickupAlert: pickupDetails.pickupAlert,
    });

    if (pickupDetails.editFromLocationDetails) {
        const fromEntityId = pickupDetails.fromLocationEntityId ?? pickup.entityId;
        if (fromEntityId) {
            await clearAddressMapping(conn, fromEntityId, "FROM", "PICKUP");
            const createdAddress = await createNetworkShipmentAddress(conn, pickupDetails.editFromLocationDetails);
            await createNetworkShipmentEntityAddressMapping(conn, fromEntityId, createdAddress.addressId, "FROM", "PICKUP");
        }
    }

    if (pickupDetails.pickupAgentTerminalDetails) {
        await insertWithReturning(conn, '"Network_Shipment_Pickup_Agent_Terminal_Info"', {
            shipmentId,
            toLocationType: pickupDetails.pickupAgentTerminalDetails.toLocationType,
            toLocation: pickupDetails.pickupAgentTerminalDetails.toLocation,
            toLocationEntityId: pickupDetails.pickupAgentTerminalDetails.toLocationEntityId,
            editToLocation: pickupDetails.pickupAgentTerminalDetails.editToLocation,
        });

        const terminalAddress = pickupDetails.pickupAgentTerminalDetails.editToLocationDetails;
        const terminalEntityId = pickupDetails.pickupAgentTerminalDetails.toLocationEntityId ?? pickup.entityId;
        if (terminalAddress && terminalEntityId) {
            await clearAddressMapping(conn, terminalEntityId, "TO", "PICKUP");
            const createdAddress = await createNetworkShipmentAddress(conn, terminalAddress);
            await createNetworkShipmentEntityAddressMapping(conn, terminalEntityId, createdAddress.addressId, "TO", "PICKUP");
        }
    }

    if (pickupDetails.pickupAlertDetails) {
        await insertWithReturning(conn, '"Network_Shipment_Pickup_Alert_Info"', {
            shipmentId,
            inboundNotes: pickupDetails.pickupAlertDetails.inboundNotes,
            primaryEmail: pickupDetails.pickupAlertDetails.emailInfo?.primaryEmail,
            additionalEmail: pickupDetails.pickupAlertDetails.emailInfo?.additionalEmails ? JSON.stringify(pickupDetails.pickupAlertDetails.emailInfo.additionalEmails) : null,
        });
    }

    for (const accessorial of pickupDetails.pickupAccessorialDetails?.accessorials ?? []) {
        await insertWithReturning(conn, '"Network_Shipment_Pickup_Accessorial"', {
            shipmentId,
            accessorialId: accessorial.accessorialId,
            accessorialName: accessorial.accessorialName,
            chargeType: accessorial.chargeType,
            chargeValue: accessorial.chargeValue,
            entityId: pickup.entityId,
            noteThreadId: accessorial.noteThreadId,
        });
    }
}

export async function replaceLinehaulInfo(
    conn: Connection,
    shipmentId: number,
    linehaulDetails: Record<string, any>
): Promise<void> {
    if (!linehaulDetails) return;

    const primary = linehaulDetails.linehaulPrimaryInfo;
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Linehaul_Accessorial" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Linehaul_Common_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    if (primary) {
        await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Linehaul_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    }

    if (primary) {
        await insertWithReturning(conn, '"Network_Shipment_Linehaul_Info"', {
            shipmentId,
            entityId: primary.entityId,
            linehaulRouting: primary.linehaulRouting,
            carrierId: primary.carrierId,
            terminalId: primary.terminalId,
            carrierBillNumber: primary.carrierBillNumber,
            fromLocationType: primary.fromLocationType,
            fromLocation: primary.fromLocation,
            fromLocationEntityId: primary.fromLocationEntityId,
            toLocationType: primary.toLocationType,
            toLocation: primary.toLocation,
            toLocationEntityId: primary.toLocationEntityId,
            etaDate: primary.etaDate,
            etaTime: primary.etaTime,
            pieces: primary.pieces,
            weight: primary.weight,
            editFromLocation: primary.editFromLocation,
            editToLocation: primary.editToLocation,
        });

        if (primary.editFromLocationDetails) {
            const fromEntityId = primary.fromLocationEntityId ?? primary.entityId;
            if (fromEntityId) {
                await clearAddressMapping(conn, fromEntityId, "FROM", "LINE_HAUL");
                const createdAddress = await createNetworkShipmentAddress(conn, primary.editFromLocationDetails);
                await createNetworkShipmentEntityAddressMapping(conn, fromEntityId, createdAddress.addressId, "FROM", "LINE_HAUL");
            }
        }

        if (primary.editToLocationDetails) {
            const toEntityId = primary.toLocationEntityId ?? primary.entityId;
            if (toEntityId) {
                await clearAddressMapping(conn, toEntityId, "TO", "LINE_HAUL");
                const createdAddress = await createNetworkShipmentAddress(conn, primary.editToLocationDetails);
                await createNetworkShipmentEntityAddressMapping(conn, toEntityId, createdAddress.addressId, "TO", "LINE_HAUL");
            }
        }
    }

    if (linehaulDetails.linehaulCommonInfo) {
        await insertWithReturning(conn, '"Network_Shipment_Linehaul_Common_Info"', {
            shipmentId,
            linehaulNotes: linehaulDetails.linehaulCommonInfo.linehaulNotes,
            linehaulAccessorial: linehaulDetails.linehaulCommonInfo.linehaulAccessorial,
        });

        for (const accessorial of linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails?.accessorials ?? []) {
            await insertWithReturning(conn, '"Network_Shipment_Linehaul_Accessorial"', {
                shipmentId,
                accessorialId: accessorial.accessorialId,
                accessorialName: accessorial.accessorialName,
                chargeType: accessorial.chargeType,
                chargeValue: accessorial.chargeValue,
                entityId: accessorial.entityId ?? primary?.entityId,
                noteThreadId: accessorial.noteThreadId ?? null,
            });
        }
    }
}

export async function replaceDeliveryInfo(
    conn: Connection,
    shipmentId: number,
    deliveryDetails: Record<string, any>
): Promise<void> {
    if (!deliveryDetails) return;

    const primary = deliveryDetails.deliveryPrimaryInfo;
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Delivery_Accessorial" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Delivery_Alert_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Delivery_Common_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    if (primary) {
        await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Delivery_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    }

    if (primary) {
        await insertWithReturning(conn, '"Network_Shipment_Delivery_Info"', {
            shipmentId,
            entityId: primary.entityId,
            carrierId: primary.carrierId,
            terminalId: primary.terminalId,
            carrierBillNumber: primary.carrierBillNumber,
            fromLocationType: primary.fromLocationType,
            fromLocation: primary.fromLocation,
            fromLocationEntityId: primary.fromLocationEntityId,
            toLocationType: primary.toLocationType,
            toLocation: primary.toLocation,
            toLocationEntityId: primary.toLocationEntityId,
            etaDate: primary.etaDate,
            etaTime: primary.etaTime,
            pieces: primary.pieces,
            weight: primary.weight,
            editFromLocation: primary.editFromLocation,
            editToLocation: primary.editToLocation,
        });

        if (primary.editFromLocationDetails) {
            const fromEntityId = primary.fromLocationEntityId ?? primary.entityId;
            if (fromEntityId) {
                await clearAddressMapping(conn, fromEntityId, "FROM", "DELIVERY");
                const createdAddress = await createNetworkShipmentAddress(conn, primary.editFromLocationDetails);
                await createNetworkShipmentEntityAddressMapping(conn, fromEntityId, createdAddress.addressId, "FROM", "DELIVERY");
            }
        }

        if (primary.editToLocationDetails) {
            const toEntityId = primary.toLocationEntityId ?? primary.entityId;
            if (toEntityId) {
                await clearAddressMapping(conn, toEntityId, "TO", "DELIVERY");
                const createdAddress = await createNetworkShipmentAddress(conn, primary.editToLocationDetails);
                await createNetworkShipmentEntityAddressMapping(conn, toEntityId, createdAddress.addressId, "TO", "DELIVERY");
            }
        }
    }

    if (deliveryDetails.deliveryCommonInfo) {
        await insertWithReturning(conn, '"Network_Shipment_Delivery_Common_Info"', {
            shipmentId,
            airportTransfer: deliveryDetails.deliveryCommonInfo.airportTransfer,
            deliveryAccessorial: deliveryDetails.deliveryCommonInfo.deliveryAccessorial,
            deliveryAlert: deliveryDetails.deliveryCommonInfo.deliveryAlert,
        });

        for (const accessorial of deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails?.accessorials ?? []) {
            await insertWithReturning(conn, '"Network_Shipment_Delivery_Accessorial"', {
                shipmentId,
                accessorialId: accessorial.accessorialId,
                accessorialName: accessorial.accessorialName,
                chargeType: accessorial.chargeType,
                chargeValue: accessorial.chargeValue,
                entityId: accessorial.entityId ?? primary?.entityId,
                noteThreadId: accessorial.noteThreadId ?? null,
            });
        }

        if (deliveryDetails.deliveryCommonInfo.deliveryAlertDetails) {
            await insertWithReturning(conn, '"Network_Shipment_Delivery_Alert_Info"', {
                shipmentId,
                linehaulNotes: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.linehaulNotes,
                deliveryNotes: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.deliveryNotes,
                primaryEmail: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.emailInfo?.primaryEmail,
                additionalEmail: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.emailInfo?.additionalEmails ? JSON.stringify(deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.emailInfo.additionalEmails) : null,
            });
        }
    }
}

export async function replaceRateDetails(
    conn: Connection,
    shipmentId: number,
    shipmentRateDetails: Record<string, any>
): Promise<void> {
    if (!shipmentRateDetails) return;

    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Invoice_Rate_Map" WHERE "invoiceId" IN (SELECT "invoiceId" FROM ${SCHEMA}."Network_Shipment_Invoice_Info" WHERE "shipmentId" = ?)`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Invoice_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Carrier_Rate_Info" WHERE "shipmentId" = ?`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Customer_Rate_Map" WHERE "customerRateId" IN (SELECT "customerRateId" FROM ${SCHEMA}."Network_Shipment_Customer_Rate_Info" WHERE "shipmentId" = ?)`, [shipmentId]);
    await conn.query(`DELETE FROM ${SCHEMA}."Network_Shipment_Customer_Rate_Info" WHERE "shipmentId" = ?`, [shipmentId]);

    const carrierRateDetails = shipmentRateDetails.carrierRateDetails ?? {};
    const mapInvoiceRates = async (invoiceType: "PICKUP" | "LINE_HAUL" | "DELIVERY", invoiceNumber: string | undefined, subtotal?: number, rateList: Array<Record<string, any>> = []) => {
        const hasInvoiceData = (invoiceNumber !== undefined && invoiceNumber !== null) || subtotal !== undefined || (rateList?.length ?? 0) > 0;
        if (!hasInvoiceData) return;
        const invoice = await insertWithReturning(conn, '"Network_Shipment_Invoice_Info"', {
            shipmentId,
            invoiceType,
            invoiceNumber: invoiceNumber ?? "",
            subTotalRate: subtotal,
            approvalStatus: "N",
        });

        for (const rate of rateList) {
            const createdRate = await insertWithReturning(conn, '"Network_Shipment_Rate_Info"', {
                rateType: rate.rateType,
                multiplicationFactor: rate.multiplicationFactor,
                multiplicationFactorUOM: rate.multiplicationFactorUOM,
                rateValue: rate.rateValue,
                totalRate: rate.totalRate,
            });

            await insertWithReturning(conn, '"Network_Shipment_Invoice_Rate_Map"', {
                invoiceId: invoice.invoiceId,
                rateId: createdRate.rateId,
            });
        }
    };

    await mapInvoiceRates("PICKUP", carrierRateDetails.pickupRateDetails?.invoiceNumber, carrierRateDetails.pickupRateDetails?.pickupSubTotalRate, carrierRateDetails.pickupRateDetails?.rateDetails ?? []);
    await mapInvoiceRates("LINE_HAUL", carrierRateDetails.linehaulRateDetails?.invoiceNumber, carrierRateDetails.linehaulRateDetails?.linehaulSubTotalRate, carrierRateDetails.linehaulRateDetails?.rateDetails ?? []);
    await mapInvoiceRates("DELIVERY", carrierRateDetails.deliveryRateDetails?.invoiceNumber, carrierRateDetails.deliveryRateDetails?.deliverySubTotalRate, carrierRateDetails.deliveryRateDetails?.rateDetails ?? []);

    if (carrierRateDetails.totalCarrierRate !== undefined) {
        await insertWithReturning(conn, '"Network_Shipment_Carrier_Rate_Info"', {
            shipmentId,
            totalCarrierRate: carrierRateDetails.totalCarrierRate,
        });
    }

    if (shipmentRateDetails.customerRateDetails) {
        const customerRate = await insertWithReturning(conn, '"Network_Shipment_Customer_Rate_Info"', {
            shipmentId,
            totalCustomerRate: shipmentRateDetails.customerRateDetails.totalCustomerRate,
        });

        for (const rate of shipmentRateDetails.customerRateDetails.rateDetails ?? []) {
            const createdRate = await insertWithReturning(conn, '"Network_Shipment_Rate_Info"', {
                rateType: rate.rateType,
                multiplicationFactor: rate.multiplicationFactor,
                multiplicationFactorUOM: rate.multiplicationFactorUOM,
                rateValue: rate.rateValue,
                totalRate: rate.totalRate,
            });

            await insertWithReturning(conn, '"Network_Shipment_Customer_Rate_Map"', {
                customerRateId: customerRate.customerRateId,
                rateId: createdRate.rateId,
            });
        }
    }
}
