import { Connection } from "odbc";
import * as enhancedDB from "../../database/shipment/editShipmentEnhanced";
import * as shipmentDB from "../../database/shipment";
import * as entityDB from "../../database/maintenance";
import { UpdateShipmentPayload } from "../../entities/shipment";
import {
    EnhancedShipmentImageFile,
    EnhancedShipmentImageInput,
    getEnhancedUploadedImagePath,
    removeEnhancedStoredImage,
} from "../../utils/enhancedShipmentImageStorage";
import {
    editCustomerReferenceNumberRecord,
    editRateInfoRecord,
} from "./editShipmentFlow";
import { createNoteThreadRecord } from "./editShipmentFlow";

export interface EnhancedShipmentEditResult {
    shipmentId: number;
}

function findFile(
    fieldName: string,
    files: EnhancedShipmentImageFile[],
    usedFileNames: Set<string>
): EnhancedShipmentImageFile | undefined {
    return files.find((file) => file.fieldname === fieldName && !usedFileNames.has(file.filename));
}

async function resolveNewImagePath(
    fieldName: string,
    files: EnhancedShipmentImageFile[],
    usedFileNames: Set<string>,
    newImagePaths: string[]
): Promise<string | undefined> {
    const file = findFile(fieldName, files, usedFileNames);
    if (file) {
        usedFileNames.add(file.filename);
        const imagePath = getEnhancedUploadedImagePath(file);
        newImagePaths.push(imagePath);
        return imagePath;
    }
    return undefined;
}

async function synchronizeEnhancedHandlingUnitImages(
    conn: Connection,
    handlingUnitId: number,
    images: EnhancedShipmentImageInput[] | undefined,
    handlingUnitIndex: number | undefined,
    files: EnhancedShipmentImageFile[],
    usedFileNames: Set<string>,
    newImagePaths: string[]
): Promise<string[]> {
    if (images === undefined) return [];

    const existingImages = await enhancedDB.getHandlingUnitImages(conn, handlingUnitId);
    const existingById = new Map(existingImages.map((image) => [Number(image.imageId), image]));
    const requestedImageIds = new Set<number>();
    const removedImagePaths: string[] = [];
    for (const image of images) {
        if (image.imageId !== undefined) {
            const imageId = Number(image.imageId);
            if (!Number.isInteger(imageId) || !existingById.has(imageId)) {
                throw new Error(`Image ${image.imageId} does not belong to handling unit ${handlingUnitId}`);
            }
            if (requestedImageIds.has(imageId)) throw new Error(`Image ${imageId} was supplied more than once`);
            requestedImageIds.add(imageId);

            if (image.delete === true) {
                const existingImage = existingById.get(imageId)!;
                await enhancedDB.deleteHandlingUnitImage(conn, imageId);
                removedImagePaths.push(existingImage.imagePath);
            }
        } else if (image.delete === true) {
            throw new Error("Deleting a handling-unit image requires its imageId");
        }
    }

    for (const [imageIndex, image] of images.entries()) {
        if (image.imageId !== undefined || image.delete === true) continue;

        const fieldName = `handlingUnit-${handlingUnitIndex}-${imageIndex}`;
        const imagePath = await resolveNewImagePath(fieldName, files, usedFileNames, newImagePaths);
        if (!imagePath) {
            throw new Error(`New handling-unit images require a multipart image field named ${fieldName}`);
        }
        await enhancedDB.insertHandlingUnitImage(conn, handlingUnitId, imagePath);
    }
    return removedImagePaths;
}

async function synchronizeEnhancedHandlingUnits(
    conn: Connection,
    shipmentId: number,
    handlingUnits: Array<Record<string, any>>,
    files: EnhancedShipmentImageFile[],
    usedFileNames: Set<string>,
    newImagePaths: string[]
): Promise<string[]> {
    const existingUnits = await enhancedDB.getHandlingUnitsByShipmentId(conn, shipmentId);
    const existingIds = new Set(existingUnits.map((unit) => Number(unit.handlingUnitId)));
    const requestedIds = new Set<number>();
    for (const handlingUnit of handlingUnits) {
        const handlingUnitId = Number(handlingUnit.handlingUnitId);
        if (handlingUnit.handlingUnitId !== undefined) {
            if (!Number.isInteger(handlingUnitId) || !existingIds.has(handlingUnitId)) {
                throw new Error(`Handling unit ${handlingUnit.handlingUnitId} does not belong to shipment ${shipmentId}`);
            }
            if (requestedIds.has(handlingUnitId)) throw new Error(`Handling unit ${handlingUnitId} was supplied more than once`);
            requestedIds.add(handlingUnitId);
        }
    }

    const removedImagePaths: string[] = [];
    for (const existingUnit of existingUnits) {
        const existingId = Number(existingUnit.handlingUnitId);
        if (!requestedIds.has(existingId)) {
            const existingImages = await enhancedDB.getHandlingUnitImages(conn, existingId);
            removedImagePaths.push(...await synchronizeEnhancedHandlingUnitImages(
                conn,
                existingId,
                existingImages.map((image) => ({ imageId: Number(image.imageId), delete: true })),
                undefined,
                files,
                usedFileNames,
                newImagePaths
            ));
            await enhancedDB.deleteHandlingUnitRecord(conn, existingId);
        }
    }

    for (const [handlingUnitIndex, handlingUnit] of handlingUnits.entries()) {
        const handlingUnitId = handlingUnit.handlingUnitId === undefined
            ? undefined
            : Number(handlingUnit.handlingUnitId);
        const resolvedId = handlingUnitId ?? (await enhancedDB.insertHandlingUnitRecord(conn, shipmentId, handlingUnit)).handlingUnitId;
        if (handlingUnitId !== undefined) {
            await enhancedDB.updateHandlingUnitRecord(conn, resolvedId, handlingUnit);
        }
        if (Object.prototype.hasOwnProperty.call(handlingUnit, "palletDetails")) {
            await enhancedDB.replaceHandlingUnitItems(conn, resolvedId, handlingUnit.palletDetails ?? []);
        }
        removedImagePaths.push(...await synchronizeEnhancedHandlingUnitImages(
            conn, resolvedId, handlingUnit.images, handlingUnitIndex, files, usedFileNames, newImagePaths
        ));
    }
    return removedImagePaths;
}

type PartyDetails = Record<string, any> & { entityId?: number; shipperId?: number; consigneeId?: number };

async function resolveCarrierEntityId(
    conn: Connection,
    shipmentId: number,
    primary: Record<string, any> | undefined,
    accessorials: Array<Record<string, any>>,
    entityType: "PICKUP" | "LINEHAUL" | "DELIVERY"
): Promise<number | undefined> {
    if (primary?.entityId) return primary.entityId;

    const existingEntityId = entityType === "PICKUP"
        ? await enhancedDB.getExistingPickupEntityId(conn, shipmentId)
        : entityType === "LINEHAUL"
            ? await enhancedDB.getExistingLinehaulEntityId(conn, shipmentId)
            : await enhancedDB.getExistingDeliveryEntityId(conn, shipmentId);

    return existingEntityId
        ?? accessorials.find((accessorial) => accessorial?.entityId)?.entityId
        ?? (primary || accessorials.length > 0
            ? await entityDB.createEntity(conn, entityType, `${entityType} for shipment ${shipmentId}`)
            : undefined);
}

async function resolveEntityId(
    conn: Connection,
    details: PartyDetails,
    entityType: "SHIPPER" | "CONSIGNEE" | "AIRLINE",
    nameKey: string
): Promise<number | undefined> {
    if (details.entityId) return details.entityId;

    if (entityType === "SHIPPER" && details.shipperId) {
        return (await shipmentDB.getShipperById(conn, details.shipperId))?.entityId;
    }
    if (entityType === "CONSIGNEE" && details.consigneeId) {
        return (await shipmentDB.getConsigneeById(conn, details.consigneeId))?.entityId;
    }
    if (entityType === "AIRLINE" && details.airlineId) {
        return (await shipmentDB.getAirlineById(conn, details.airlineId))?.entityId;
    }
    if (!details[nameKey]) return undefined;
    return entityDB.createEntity(conn, entityType, details[nameKey]);
}

async function updateParty(
    conn: Connection,
    shipmentId: number,
    details: PartyDetails | undefined,
    entityType: "SHIPPER" | "CONSIGNEE" | "AIRLINE",
    nameKey: string
): Promise<void> {
    if (!details || details.delete === true) return;

    const entityId = await resolveEntityId(conn, details, entityType, nameKey);
    if (!entityId) return;

    if (entityType === "SHIPPER") await enhancedDB.updateShipperRecord(conn, entityId, details);
    if (entityType === "CONSIGNEE") await enhancedDB.updateConsigneeRecord(conn, entityId, details);
    if (entityType === "AIRLINE") await enhancedDB.updateAirlineRecord(conn, entityId, details);

    // Mapping replacement is intentionally isolated from record persistence.
    await shipmentDB.createShipperConsigneeAirlineMapping(conn, shipmentId, entityId);
}

async function updateCarrierPrimaryRecords(conn: Connection, shipmentId: number, carrierDetails: Record<string, any>, userId: number): Promise<void> {
    const pickup = carrierDetails.pickupDetails;
    if (pickup) {
        await enhancedDB.updatePickupRecord(conn, shipmentId, pickup);
        const pickupEntityId = await enhancedDB.getExistingPickupEntityId(conn, shipmentId);
        const pickupAccessorials = pickup.pickupAccessorialDetails?.accessorials ?? [];
        for (const accessorial of pickupAccessorials) {
            if (!accessorial.delete && !accessorial.noteThreadId && (accessorial.entityId ?? pickupEntityId)) {
                accessorial.noteThreadId = await createNoteThreadRecord(conn, accessorial.entityId ?? pickupEntityId, userId);
            }
        }
        await enhancedDB.synchronizeAccessorialRecords(conn, "Network_Shipment_Pickup_Accessorial", "pickupAccessorialId", shipmentId, pickupAccessorials, pickupEntityId);
        if (pickup.pickupAgentTerminalDetails) {
            await enhancedDB.updatePickupAgentRecord(conn, shipmentId, pickup.pickupAgentTerminalDetails);
        }
        if (pickup.pickupAlertDetails) {
            await enhancedDB.updatePickupAlertRecord(conn, shipmentId, {
                inboundNotes: pickup.pickupAlertDetails.inboundNotes,
                primaryEmail: pickup.pickupAlertDetails.emailInfo?.primaryEmail,
                additionalEmail: pickup.pickupAlertDetails.emailInfo?.additionalEmails
                    ? JSON.stringify(pickup.pickupAlertDetails.emailInfo.additionalEmails)
                    : undefined,
            });
        }
    }

    const linehaulDetails = carrierDetails.linehaulDetails;
    const linehaul = linehaulDetails?.linehaulPrimaryInfo;
    const linehaulAccessorials = linehaulDetails?.linehaulCommonInfo?.linehaulAccessorialDetails?.accessorials ?? [];
    const linehaulEntityId = await resolveCarrierEntityId(conn, shipmentId, linehaul, linehaulAccessorials, "LINEHAUL");
    if (linehaul) await enhancedDB.updateLinehaulRecord(conn, shipmentId, { ...linehaul, entityId: linehaulEntityId });
    if (linehaulDetails?.linehaulCommonInfo) {
        await enhancedDB.updateLinehaulCommonRecord(conn, shipmentId, linehaulDetails.linehaulCommonInfo);
        const accessorials = linehaulDetails.linehaulCommonInfo.linehaulAccessorialDetails?.accessorials ?? [];
        for (const accessorial of accessorials) {
            if (!accessorial.delete && !accessorial.noteThreadId && (accessorial.entityId ?? linehaulEntityId)) {
                accessorial.noteThreadId = await createNoteThreadRecord(conn, accessorial.entityId ?? linehaulEntityId, userId);
            }
        }
        await enhancedDB.synchronizeAccessorialRecords(conn, "Network_Shipment_Linehaul_Accessorial", "linehaulAccessorialId", shipmentId, accessorials, linehaulEntityId);
    }

    const deliveryDetails = carrierDetails.deliveryDetails;
    const delivery = deliveryDetails?.deliveryPrimaryInfo;
    const deliveryAccessorials = deliveryDetails?.deliveryCommonInfo?.deliveryAccessorialDetails?.accessorials ?? [];
    const deliveryEntityId = await resolveCarrierEntityId(conn, shipmentId, delivery, deliveryAccessorials, "DELIVERY");
    if (delivery) await enhancedDB.updateDeliveryRecord(conn, shipmentId, { ...delivery, entityId: deliveryEntityId });
    if (deliveryDetails?.deliveryCommonInfo) {
        await enhancedDB.updateDeliveryCommonRecord(conn, shipmentId, deliveryDetails.deliveryCommonInfo);
        const accessorials = deliveryDetails.deliveryCommonInfo.deliveryAccessorialDetails?.accessorials ?? [];
        for (const accessorial of accessorials) {
            if (!accessorial.delete && !accessorial.noteThreadId && (accessorial.entityId ?? deliveryEntityId)) {
                accessorial.noteThreadId = await createNoteThreadRecord(conn, accessorial.entityId ?? deliveryEntityId, userId);
            }
        }
        await enhancedDB.synchronizeAccessorialRecords(conn, "Network_Shipment_Delivery_Accessorial", "deliveryAccessorialId", shipmentId, accessorials, deliveryEntityId);
        if (deliveryDetails.deliveryCommonInfo.deliveryAlertDetails) {
            await enhancedDB.updateDeliveryAlertRecord(conn, shipmentId, {
                linehaulNotes: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.linehaulNotes,
                deliveryNotes: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.deliveryNotes,
                primaryEmail: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.emailInfo?.primaryEmail,
                additionalEmail: deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.emailInfo?.additionalEmails
                    ? JSON.stringify(deliveryDetails.deliveryCommonInfo.deliveryAlertDetails.emailInfo.additionalEmails)
                    : undefined,
            });
        }
    }
}

export async function editShipmentEnhanced(
    conn: Connection,
    shipmentId: number,
    payload: UpdateShipmentPayload,
    userId: number,
    files: EnhancedShipmentImageFile[] = []
): Promise<EnhancedShipmentEditResult> {
    if (!shipmentId) throw new Error("Shipment ID is required");
    if (!payload || (!payload.shipmentDetails && !payload.customerDetails && !payload.commodityDetails && !payload.carrierDetails && !payload.shipmentRateDetails)) {
        throw new Error("No enhanced shipment update data provided");
    }

    const newImagePaths: string[] = [];
    const removedImagePaths: string[] = [];
    const usedFileNames = new Set<string>();
    let transactionStarted = false;
    try {
        await conn.beginTransaction();
        transactionStarted = true;
        if (payload.shipmentDetails) {
            await enhancedDB.updateShipmentRecord(conn, shipmentId, payload.shipmentDetails as Record<string, any>, userId);
        }

        const customerDetails = payload.customerDetails as Record<string, any> | undefined;
        if (customerDetails) {
            await enhancedDB.updateCustomerRecord(conn, shipmentId, customerDetails);

            const customerReferenceNumbers = customerDetails.customerReferenceNumbers ?? customerDetails.referenceNumbers;
            if (customerReferenceNumbers) {
                await editCustomerReferenceNumberRecord(conn, shipmentId, customerReferenceNumbers as any[]);
            }

            if (customerDetails.airportPickupService === "Y") {
                await updateParty(conn, shipmentId, customerDetails.pickupAirlineDetails, "AIRLINE", "airlineName");
            } else {
                await updateParty(conn, shipmentId, customerDetails.shipperDetails ?? customerDetails.shipper, "SHIPPER", "shipperName");
            }

            if (customerDetails.airportDeliveryService === "Y") {
                await updateParty(conn, shipmentId, customerDetails.deliveryAirlineDetails, "AIRLINE", "airlineName");
            } else {
                await updateParty(conn, shipmentId, customerDetails.consigneeDetails ?? customerDetails.consignee, "CONSIGNEE", "consigneeName");
            }
        }

        if (payload.carrierDetails) {
            await updateCarrierPrimaryRecords(conn, shipmentId, payload.carrierDetails as Record<string, any>, userId);
        }

        const commodityDetails = payload.commodityDetails as Record<string, any> | undefined;
        if (commodityDetails) {
            await enhancedDB.updateCommodityRecord(conn, shipmentId, commodityDetails);
            if (commodityDetails.handlingUnits !== undefined) {
                removedImagePaths.push(...await synchronizeEnhancedHandlingUnits(
                    conn,
                    shipmentId,
                    commodityDetails.handlingUnits as Array<Record<string, any>>,
                    files,
                    usedFileNames,
                    newImagePaths
                ));
            }
        }

        if (payload.shipmentRateDetails) {
            await editRateInfoRecord(conn, shipmentId, payload.shipmentRateDetails as Record<string, any>);
        }

        await conn.commit();
        transactionStarted = false;
        for (const imagePath of removedImagePaths) await removeEnhancedStoredImage(imagePath);
        for (const file of files) {
            if (!usedFileNames.has(file.filename)) {
                await removeEnhancedStoredImage(getEnhancedUploadedImagePath(file));
            }
        }
        return { shipmentId };
    } catch (error) {
        if (transactionStarted) await conn.rollback();
        for (const imagePath of newImagePaths) await removeEnhancedStoredImage(imagePath);
        for (const file of files) await removeEnhancedStoredImage(getEnhancedUploadedImagePath(file));
        throw error;
    }
}
