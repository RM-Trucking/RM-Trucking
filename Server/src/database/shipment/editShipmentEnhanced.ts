import { Connection } from "odbc";
import { SCHEMA } from "../../config/db2";

type SqlValue = unknown;

const shipmentColumns = new Set([
    "typeOfShipment", "serviceLevel", "shipmentDate", "shipmentTime", "status", "updatedBy",
]);

const customerColumns = new Set([
    "customerId", "stationId", "airportPickupService", "originAirportCode",
    "airportDeliveryService", "destinationAirportCode",
]);

const commodityColumns = new Set(["emergencyContactName", "emergencyContactPhone"]);

const pickupColumns = new Set([
    "entityId", "pickupRouting", "airportTransfer", "carrierId", "terminalId", "carrierBillNumber",
    "fromLocationType", "fromLocation", "fromLocationEntityId", "editFromLocation",
    "pickupAgentTerminal", "pickupAccessorial", "pickupAlert",
]);

const linehaulColumns = new Set([
    "entityId", "linehaulRouting", "carrierId", "terminalId", "carrierBillNumber",
    "fromLocationType", "fromLocation", "fromLocationEntityId", "toLocationType", "toLocation",
    "toLocationEntityId", "etaDate", "etaTime", "pieces", "weight", "editFromLocation", "editToLocation",
]);

const deliveryColumns = new Set([
    "entityId", "carrierId", "terminalId", "carrierBillNumber", "fromLocationType", "fromLocation",
    "fromLocationEntityId", "toLocationType", "toLocation", "toLocationEntityId", "etaDate", "etaTime",
    "pieces", "weight", "editFromLocation", "editToLocation",
]);

const shipperColumns = new Set([
    "shipperName", "addressLine1", "addressLine2", "city", "state", "zipCode", "contactPersonName", "phoneNumber",
]);

const consigneeColumns = new Set([
    "consigneeName", "addressLine1", "addressLine2", "city", "state", "zipCode", "contactPersonName", "phoneNumber",
]);

const airlineColumns = new Set([
    "airlineNumber", "airlineCode", "airportCode", "airlineName", "addressLine1", "addressLine2", "city",
    "state", "zipCode", "contactPersonName", "phoneNumber", "scenarioType",
]);

const pickupAgentColumns = new Set(["toLocationType", "toLocation", "toLocationEntityId", "editToLocation"]);
const pickupAlertColumns = new Set(["inboundNotes", "primaryEmail", "additionalEmail"]);
const linehaulCommonColumns = new Set(["linehaulAccessorial", "linehaulNotes"]);
const deliveryCommonColumns = new Set(["deliveryAccessorial", "airportTransfer", "deliveryAlert"]);
const deliveryAlertColumns = new Set(["linehaulNotes", "deliveryNotes", "primaryEmail", "additionalEmail"]);
const handlingUnitColumns = new Set([
    "handlingUnitUOM", "handlingUnits", "unit", "handlingLength", "handlingWidth",
    "handlingHeight", "handlingWeight", "handlingWeightUnit", "class",
]);

export interface EnhancedHandlingUnitImage {
    imageId: number;
    handlingUnitId: number;
    imagePath: string;
    uploadedAt: Date;
}

export async function getHandlingUnitImages(
    conn: Connection,
    handlingUnitId: number
): Promise<EnhancedHandlingUnitImage[]> {
    return await conn.query(
        `SELECT "imageId", "handlingUnitId", "imagePath", "uploadedAt"
         FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Images"
         WHERE "handlingUnitId" = ?
         ORDER BY "imageId" ASC`,
        [handlingUnitId]
    ) as EnhancedHandlingUnitImage[];
}

export async function getHandlingUnitImagesByShipmentId(
    conn: Connection,
    shipmentId: number
): Promise<EnhancedHandlingUnitImage[]> {
    return await conn.query(
        `SELECT i."imageId", i."handlingUnitId", i."imagePath", i."uploadedAt"
         FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Images" i
         JOIN ${SCHEMA}."Network_Shipment_Handling_Unit" h
           ON h."handlingUnitId" = i."handlingUnitId"
         WHERE h."shipmentId" = ?
         ORDER BY i."handlingUnitId" ASC, i."imageId" ASC`,
        [shipmentId]
    ) as EnhancedHandlingUnitImage[];
}

export async function insertHandlingUnitImage(
    conn: Connection,
    handlingUnitId: number,
    imagePath: string
): Promise<EnhancedHandlingUnitImage> {
    const result = await conn.query(
        `SELECT * FROM FINAL TABLE (
            INSERT INTO ${SCHEMA}."Network_Shipment_Handling_Unit_Images"
                ("handlingUnitId", "imagePath", "uploadedAt")
            VALUES (?, ?, CURRENT_TIMESTAMP - CURRENT TIMEZONE)
        )`,
        [handlingUnitId, imagePath]
    ) as EnhancedHandlingUnitImage[];
    return result[0];
}

export async function deleteHandlingUnitImage(conn: Connection, imageId: number): Promise<void> {
    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Images" WHERE "imageId" = ?`,
        [imageId]
    );
}

export async function getExistingPickupEntityId(conn: Connection, shipmentId: number): Promise<number | undefined> {
    const result = await conn.query(
        `SELECT "entityId" FROM ${SCHEMA}."Network_Shipment_Pickup_Info"
         WHERE "shipmentId" = ? FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];
    return result[0]?.entityId;
}

export async function getExistingLinehaulEntityId(conn: Connection, shipmentId: number): Promise<number | undefined> {
    const result = await conn.query(
        `SELECT "entityId" FROM ${SCHEMA}."Network_Shipment_Linehaul_Info"
         WHERE "shipmentId" = ? FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];
    return result[0]?.entityId;
}

export async function getExistingDeliveryEntityId(conn: Connection, shipmentId: number): Promise<number | undefined> {
    const result = await conn.query(
        `SELECT "entityId" FROM ${SCHEMA}."Network_Shipment_Delivery_Info"
         WHERE "shipmentId" = ? FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];
    return result[0]?.entityId;
}

async function updateOrInsert(
    conn: Connection,
    table: string,
    data: Record<string, SqlValue>,
    allowed: Set<string>,
    whereColumn: string,
    whereValue: number
): Promise<void> {
    const entries = Object.entries(data).filter(([key, value]) =>
        allowed.has(key) && key !== whereColumn && value !== undefined
    );

    const existing = await conn.query(
        `SELECT 1 FROM ${SCHEMA}."${table}" WHERE "${whereColumn}" = ? FETCH FIRST 1 ROW ONLY`,
        [whereValue]
    ) as any[];

    if (existing.length) {
        if (!entries.length) return;

        const fields = entries.map(([key]) => `"${key}" = ?`);
        const values = entries.map(([, value]) => value);

        await conn.query(
            `UPDATE ${SCHEMA}."${table}" SET ${fields.join(", ")} WHERE "${whereColumn}" = ?`,
            [...values, whereValue] as any[]
        );
        return;
    }

    // A row cannot be inserted when the payload contains no writable fields.
    // This also prevents invalid SQL with an empty column list.
    if (!entries.length) return;

    const columns = entries.map(([key]) => `"${key}"`).join(", ");
    const placeholders = entries.map(() => "?").join(", ");
    await conn.query(
        `INSERT INTO ${SCHEMA}."${table}" ("${whereColumn}", ${columns}) VALUES (?, ${placeholders})`,
        [whereValue, ...entries.map(([, value]) => value) as any[]]
    );
}

export async function updateShipmentRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>, userId: number): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment", { ...details, updatedBy: userId }, shipmentColumns, "shipmentId", shipmentId);
}

export async function updateCustomerRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Customer_Info", details, customerColumns, "shipmentId", shipmentId);
}

export async function updateCommodityRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    const entries = Object.entries(details).filter(([key, value]) => commodityColumns.has(key) && value !== undefined);
    const existing = await conn.query(
        `SELECT 1 FROM ${SCHEMA}."Network_Shipment_Commodity_Info" WHERE "shipmentId" = ? FETCH FIRST 1 ROW ONLY`,
        [shipmentId]
    ) as any[];

    if (existing.length) {
        if (entries.length) {
            await conn.query(
                `UPDATE ${SCHEMA}."Network_Shipment_Commodity_Info" SET ${entries.map(([key]) => `"${key}" = ?`).join(", ")} WHERE "shipmentId" = ?`,
                [...entries.map(([, value]) => value), shipmentId] as any[]
            );
        }
        return;
    }

    const columns = ["shipmentId", ...entries.map(([key]) => key)];
    await conn.query(
        `INSERT INTO ${SCHEMA}."Network_Shipment_Commodity_Info" (${columns.map((column) => `"${column}"`).join(", ")})
         VALUES (${columns.map(() => "?").join(", ")})`,
        [shipmentId, ...entries.map(([, value]) => value)] as any[]
    );
}

export async function updatePickupRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Pickup_Info", details, pickupColumns, "shipmentId", shipmentId);
}

export async function updateLinehaulRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Linehaul_Info", details, linehaulColumns, "shipmentId", shipmentId);
}

export async function updateDeliveryRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Delivery_Info", details, deliveryColumns, "shipmentId", shipmentId);
}

export async function updateShipperRecord(conn: Connection, entityId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Shipper_Info", details, shipperColumns, "entityId", entityId);
}

export async function updateConsigneeRecord(conn: Connection, entityId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Consignee_Info", details, consigneeColumns, "entityId", entityId);
}

export async function updateAirlineRecord(conn: Connection, entityId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Airline", details, airlineColumns, "entityId", entityId);
}

export async function updatePickupAgentRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Pickup_Agent_Terminal_Info", details, pickupAgentColumns, "shipmentId", shipmentId);
}

export async function updatePickupAlertRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Pickup_Alert_Info", details, pickupAlertColumns, "shipmentId", shipmentId);
}

export async function updateLinehaulCommonRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Linehaul_Common_Info", details, linehaulCommonColumns, "shipmentId", shipmentId);
}

export async function updateDeliveryCommonRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Delivery_Common_Info", details, deliveryCommonColumns, "shipmentId", shipmentId);
}

export async function updateDeliveryAlertRecord(conn: Connection, shipmentId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Delivery_Alert_Info", details, deliveryAlertColumns, "shipmentId", shipmentId);
}

export async function updateHandlingUnitRecord(conn: Connection, handlingUnitId: number, details: Record<string, SqlValue>): Promise<void> {
    await updateOrInsert(conn, "Network_Shipment_Handling_Unit", details, handlingUnitColumns, "handlingUnitId", handlingUnitId);
}

export async function getHandlingUnitsByShipmentId(conn: Connection, shipmentId: number): Promise<Array<{ handlingUnitId: number }>> {
    return await conn.query(
        `SELECT "handlingUnitId" FROM ${SCHEMA}."Network_Shipment_Handling_Unit" WHERE "shipmentId" = ?`,
        [shipmentId]
    ) as Array<{ handlingUnitId: number }>;
}

export async function insertHandlingUnitRecord(
    conn: Connection,
    shipmentId: number,
    details: Record<string, SqlValue>
): Promise<{ handlingUnitId: number }> {
    const columns = ["handlingUnitUOM", "handlingUnits", "unit", "handlingLength", "handlingWidth", "handlingHeight", "handlingWeight", "handlingWeightUnit", "class"];
    const entries = columns.filter((column) => details[column] !== undefined);
    const result = await conn.query(
        `SELECT * FROM FINAL TABLE (
            INSERT INTO ${SCHEMA}."Network_Shipment_Handling_Unit"
                ("shipmentId"${entries.map((column) => `, "${column}"`).join("")})
            VALUES (?${entries.map(() => ", ?").join("")})
        )`,
        [shipmentId, ...entries.map((column) => details[column])] as any[]
    ) as Array<{ handlingUnitId: number }>;
    return result[0];
}

export async function replaceHandlingUnitItems(
    conn: Connection,
    handlingUnitId: number,
    pallets: Array<Record<string, any>> = []
): Promise<void> {
    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item_Hazmat_Info"
         WHERE "itemId" IN (SELECT "itemId" FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item" WHERE "handlingUnitId" = ?)`,
        [handlingUnitId]
    );
    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item" WHERE "handlingUnitId" = ?`,
        [handlingUnitId]
    );

    for (const pallet of pallets) {
        const hasHazmat = pallet.hazmat === "Y" && pallet.hazmatDetails && pallet.hazmatDetails.delete !== true;
        const itemResult = await conn.query(
            `SELECT * FROM FINAL TABLE (
                INSERT INTO ${SCHEMA}."Network_Shipment_Handling_Unit_Item"
                    ("handlingUnitId", "pieces", "piecesUOM", "description", "hazmat")
                VALUES (?, ?, ?, ?, ?)
            )`,
            [handlingUnitId, pallet.pieces ?? null, pallet.piecesUOM ?? null, pallet.description ?? null, hasHazmat ? "Y" : "N"]
        ) as Array<{ itemId: number }>;

        if (hasHazmat) {
            const hazmat = pallet.hazmatDetails;
            await conn.query(
                `INSERT INTO ${SCHEMA}."Network_Shipment_Handling_Unit_Item_Hazmat_Info"
                    ("itemId", "unNumber", "properShippingName", "hazardClass", "packingGroup", "weight", "weightUnit",
                     "technicalName", "contactPhoneNumber", "hazmatDescription", "limitedQuantity", "marinePollutant",
                     "residueLastContained", "reportableQuantity", "dotExemption")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    itemResult[0].itemId, hazmat.unNumber ?? null, hazmat.properShippingName ?? null,
                    hazmat.hazardClass ?? null, hazmat.packingGroup ?? null, hazmat.weight ?? null,
                    hazmat.weightUnit ?? null, hazmat.technicalName ?? null, hazmat.contactPhoneNumber ?? null,
                    hazmat.hazmatDescription ?? null, hazmat.limitedQuantity ?? null, hazmat.marinePollutant ?? null,
                    hazmat.residueLastContained ?? null, hazmat.reportableQuantity ?? null, hazmat.dotExemption ?? null,
                ]
            );
        }
    }
}

export async function deleteHandlingUnitRecord(conn: Connection, handlingUnitId: number): Promise<void> {
    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item_Hazmat_Info"
         WHERE "itemId" IN (SELECT "itemId" FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item" WHERE "handlingUnitId" = ?)`,
        [handlingUnitId]
    );
    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit_Item" WHERE "handlingUnitId" = ?`,
        [handlingUnitId]
    );
    await conn.query(
        `DELETE FROM ${SCHEMA}."Network_Shipment_Handling_Unit" WHERE "handlingUnitId" = ?`,
        [handlingUnitId]
    );
}

export async function synchronizeAccessorialRecords(
    conn: Connection,
    table: string,
    idColumn: string,
    shipmentId: number,
    accessorials: Array<Record<string, any>>,
    defaultEntityId?: number
): Promise<void> {
    const existing = await conn.query(
        `SELECT "${idColumn}" FROM ${SCHEMA}."${table}" WHERE "shipmentId" = ?`,
        [shipmentId]
    ) as Array<Record<string, any>>;
    const incomingIds = new Set(
        accessorials
            .filter((accessorial) => accessorial.delete !== true && accessorial[idColumn])
            .map((accessorial) => Number(accessorial[idColumn]))
    );

    for (const row of existing) {
        if (!incomingIds.has(Number(row[idColumn]))) {
            await conn.query(
                `DELETE FROM ${SCHEMA}."${table}" WHERE "${idColumn}" = ?`,
                [row[idColumn]]
            );
        }
    }

    for (const accessorial of accessorials) {
        if (accessorial.delete === true) continue;

        const values = [
            accessorial.accessorialId,
            accessorial.accessorialName,
            accessorial.chargeType,
            accessorial.chargeValue,
            accessorial.entityId ?? defaultEntityId,
            accessorial.noteThreadId ?? null,
        ];

        if (accessorial[idColumn]) {
            await conn.query(
                `UPDATE ${SCHEMA}."${table}"
                 SET "accessorialId" = ?, "accessorialName" = ?, "chargeType" = ?,
                     "chargeValue" = ?, "entityId" = ?, "noteThreadId" = ?
                 WHERE "${idColumn}" = ? AND "shipmentId" = ?`,
                [...values, accessorial[idColumn], shipmentId]
            );
        } else {
            await conn.query(
                `INSERT INTO ${SCHEMA}."${table}"
                 ("shipmentId", "accessorialId", "accessorialName", "chargeType", "chargeValue", "entityId", "noteThreadId")
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [shipmentId, ...values]
            );
        }
    }
}
