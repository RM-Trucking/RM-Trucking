export interface NetworkShipment {
    shipmentId: number;
    typeOfShipment: string;
    serviceLevel: string;
    shipmentDate: Date;
    shipmentTime: string;
    createdBy: number;
    createdAt: Date;
    updatedBy?: number;
    updatedAt?: Date;
}

export interface NetworkShipmentCustomerInfo {
    customerInfoId: number;
    shipmentId: number;
    customerId: number;
    stationId: number;
    airportPickupService: 'Y' | 'N';
    originAirportCode: string;
    airportDeliveryService: 'Y' | 'N';
    destinationAirportCode: string;
}

export interface NetworkShipmentShipperInfo {
    shipperId: number;
    shipperName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    contactPersonName: string;
    phoneNumber: string;
    entityId?: number;
}

export interface NetworkShipmentConsigneeInfo {
    consigneeId: number;
    consigneeName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    contactPersonName: string;
    phoneNumber: string;
    entityId?: number;
}

export interface NetworkShipmentShipperConsigneeAirlineMapping {
    mappingId: number;
    shipmentId: number;
    entityId: number;
}

export interface Airline {
    airlineId: number;
    airlineCode: string;
    airportCode: string;
    airlineName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    handler: string;
    phoneNumber: string;
    entityId?: number;
}

export interface NetworkCommodityInfo {
    commodityId: number;
    shipmentId: number;
    emergencyContactName: string;
    emergencyContactPhone: string;
}

export interface NetworkHandlingUnitInfo {
    handlingUnitId: number;
    commodityId: number;
    handlingUnitUOM: string;
    handlingUnits: number;
    unit: string;
    handlingLength: number;
    handlingWidth: number;
    handlingHeight: number;
    handlingWeight: number;
    handlingWeightUnit: string;
    class: string;
}

export interface NetworkHandlingUnitItemInfo {
    itemId: number;
    handlingUnitId: number;
    pieces: number;
    piecesUOM: string;
    description: string;
    hazmat: 'Y' | 'N';
}

export interface NetworkHandlingUnitItemHazmatInfo {
    hazmatId: number;
    itemId: number;
    unNumber: string;
    properShippingName: string;
    hazardClass: string;
    packingGroup: string;
    weight: number;
    technicalName: string;
    contactPhoneNumber: string;
    hazmatDescription: string;
    limitedQuantity: 'Y' | 'N';
    marinePollutant: 'Y' | 'N';
    residueLastContained: 'Y' | 'N';
    reportableQuantity: 'Y' | 'N';
    dotExemption: 'Y' | 'N';
}

export interface CreateShipmentDetails {
    typeOfShipment: string;
    serviceLevel: string;
    shipmentDate: Date;
    shipmentTime: string;
    shipmentStatus: string;
}

export type shipmentDetails = CreateShipmentDetails;

export type AirlineDetails = {
    airlineId?: number;
    airlineNumber: number;
    airlineCode: string;
    airportCode: string;
    airlineName: string;
    addressLine1?: string;
    addressLine2?: string;
    state?: string;
    city: string;
    zipCode?: string;
    handler?: string;
    phoneNumber?: string;
};

export type ShipperDetails = {
    shipperId?: number;
    shipperName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    contactPersonName: string;
    phoneNumber: string;
    entityId?: number;
};

export type ConsigneeDetails = {
    consigneeId?: number;
    consigneeName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    contactPersonName: string;
    phoneNumber: string;
    entityId?: number;
};

export type CustomerDetails = {
    customerId: number;
    stationId: number;
    airportPickupService: 'Y' | 'N';
    originAirportCode: string;
    airportDeliveryService: 'Y' | 'N';
    destinationAirportCode: string;
} & (
        | {
            airportPickupService: 'Y';
            pickupAirlineDetails: AirlineDetails;
            shipperDetails?: never;
        }
        | {
            airportPickupService: 'N';
            shipperDetails: ShipperDetails;
            pickupAirlineDetails?: never;
        }
    ) &
    (
        | {
            airportDeliveryService: 'Y';
            deliveryAirlineDetails: AirlineDetails;
            consigneeDetails?: never;
        }
        | {
            airportDeliveryService: 'N';
            consigneeDetails: ConsigneeDetails;
            deliveryAirlineDetails?: never;
        }
    );

export type CreateCustomerDetails = CustomerDetails;
export type CreateShipperDetails = ShipperDetails;
export type CreateConsigneeDetails = ConsigneeDetails;

export interface CreateCommodityDetails {
    emergencyContactName: string;
    emergencyContactPhone: string;
}

export interface CreateHandlingUnitDetails {
    handlingUnitUOM: string;
    handlingUnits: number;
    unit: string;
    handlingLength: number;
    handlingWidth: number;
    handlingHeight: number;
    handlingWeight: number;
    handlingWeightUnit: string;
    class: string;
}

export interface CreateItemDetails {
    pieces: number;
    piecesUOM: string;
    description: string;
    hazmat: 'Y' | 'N';
}

export interface CreateItemHazmatDetails {
    unNumber: string;
    properShippingName: string;
    hazardClass: string;
    packingGroup: string;
    weight: number;
    technicalName: string;
    contactPhoneNumber: string;
    hazmatDescription: string;
    limitedQuantity: 'Y' | 'N';
    marinePollutant: 'Y' | 'N';
    residueLastContained: 'Y' | 'N';
    reportableQuantity: 'Y' | 'N';
    dotExemption: 'Y' | 'N';
}

export type HazmatDetails = CreateItemHazmatDetails;
export type PalletDetails = CreateItemDetails & {
    hazmatDetails?: HazmatDetails;
};
export type HandlingUnitDetails = CreateHandlingUnitDetails & {
    palletDetails: PalletDetails[];
};

export type CommodityDetails = CreateCommodityDetails & {
    handlingUnits: HandlingUnitDetails[];
};

export type pickupDetails = {
    routing: 'PICKUP_ONLY' | 'PICKUP_LINE_HAUL' | 'PICKUP_LINE_HAUL_DELIVERY';
    airportTransfer: 'Y' | 'N';
    carrierId: number;
    terminalId: number;
    fromLocation: string;
    editFromLocation: 'Y' | 'N';
    editFromLocationDetails?: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        zipCode: string;
    };
    pickupAgentTerminal: 'Y' | 'N';
    pickupAgentTerminalDetails?: {
        toLocationType: 'CARRIER' | 'CONSIGNEE';
        toLocation: string;
    };
    addPickupAccessorial: 'Y' | 'N';
    pickupAccessorialDetails?: {};
    pickupAlert: 'Y' | 'N';
    pickupAlertDetails?: {}
}

export interface CreateNetworkShipmentRequest {
    shipmentDetails: CreateShipmentDetails;
    customerDetails: CustomerDetails;
    commodityDetails: CommodityDetails;
    carrierDetails: {
        pickupDetails: {
            airportPickup: 'Y' | 'N';
            carrierId: number;
            fromLocation: string;
            manualFromLocation: 'Y' | 'N';
            manualFromLocationDetails?: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
            toLocationType: string;
            toLocation: string;
            addPickupAccessorial: 'Y' | 'N';
            pickupAlert: 'Y' | 'N';
            routing: string;
            airportTransfer: 'Y' | 'N';
        }
        pickupAccessorialDetails?: {
            accessorials: {
                accessorialId: number;
                chargeType: string;
                charges: number;
                notes: string;
            }[];
        };
        pickupAlertDetails?: {
            inboundNotes: string[];
            emailInfo: {
                primaryEmail: string;
                additionalEmails: string[];
            };
        };
        deliveryDetails?: {
            carrierId?: number;
            carrierBillNumber?: string;
            fromLocation?: string;
            manualFromLocation?: 'Y' | 'N';
            manualFromLocationDetails?: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
            toLocationType?: string;
            toLocation?: string;
            manualToLocation?: 'Y' | 'N';
            manualToLocationDetails?: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
            eatDate: Date;
            eatTime: string;
            pieces: number;
            haveAccessorials: 'Y' | 'N';
            accessorialDetails?: {
                accessorials: {
                    accessorialId: number;
                    chargeType: string;
                    charges: number;
                    notes: string;
                }[];
            };
            deliveryAlert: 'Y' | 'N';
            lineHaulNotes: string[];
            deliveryNotes: string[];
            emailInfo: {
                primaryEmail: string;
                additionalEmails: string[];
            };
            airportTransfer: 'Y' | 'N';
        };
        lineHaulDetails?: {
            carrierId: number;
            carrierBillNumber: string;
            fromLocation: string;
            manualFromLocation: 'Y' | 'N';
            manualFromLocationDetails?: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
            toLocationType: string;
            toLocation: string;
            manualToLocation?: 'Y' | 'N';
            manualToLocationDetails?: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
            haveAccessorials: 'Y' | 'N';
            accessorialDetails?: {
                accessorials: {
                    accessorialId: number;
                    chargeType: string;
                    charges: number;
                    notes: string;
                }[];
            };
            lineHaulNotes: string[];
            deliveryIncluded: 'Y' | 'N';
            airportTransfer: 'Y' | 'N';
        };
    };
    carrierRateDetails: {
        totalCharges: number;
        pickupCarrierRate: {
            invoiceNumber: string;
            rateDetails: {
                rateType: string;
                multiplicationFactor: number;
                rate: number;
                totalCharge: number;
            }[];
            subTotal: number;
        };
        lineHaulCarrierRate: {
            invoiceNumber: string;
            rateDetails: {
                rateType: string;
                multiplicationFactor: number;
                rate: number;
                totalCharge: number;
            }[];
            subTotal: number;
        };
        deliveryCarrierRate: {
            invoiceNumber: string;
            rateDetails: {
                rateType: string;
                multiplicationFactor: number;
                rate: number;
                totalCharge: number;
            }[];
            subTotal: number;
        };
    };
    customerRateDetails: {
        totalCharges: number;
        rateDetails: {
            rateType: string;
            multiplicationFactor: number;
            rate: number;
            totalCharge: number;
        }[];
    };
}
