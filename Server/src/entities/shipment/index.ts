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
    line1: string;
    line2?: string;
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
    line1: string;
    line2?: string;
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
    line1: string;
    line2?: string;
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

export interface NetworkShipmentPickupInfo {
    pickupInfoId: number;
    shipmentId: number;
    entityId: number;
    pickupRouting: 'PICKUP_ONLY' | 'PICKUP_LINE_HAUL' | 'PICKUP_LINE_HAUL_DELIVERY';
    airportTransfer: 'Y' | 'N';
    carrierId: number;
    terminalId: number;
    fromLocationType: 'Shipper' | 'Carrier';
    fromLocation: string;
    fromLocationEntityId: number;
    editFromLocation: 'Y' | 'N';
    pickupAgentTerminal: 'Y' | 'N';
    pickupAccessorial: 'Y' | 'N';
    pickupAlert: 'Y' | 'N';
}

export interface NetworkShipmentPickupAgentTerminalInfo {
    pickupAgentTerminalId: number;
    shipmentId: number;
    entityId: number;
    toLocationType: 'Consignee' | 'Carrier';
    toLocation: string;
    toLocationEntityId: number;
    editToLocation: 'Y' | 'N';
}

export interface NetworkShipmentPickupAlertInfo {
    pickupAlertId: number;
    shipmentId: number;
    inboundNotes: string;
    primaryEmail: string;
    additionalEmail: string[];
}

export interface NetworkShipmentPickupAccessorial {
    pickupAccessorialId: number;
    shipmentId: number;
    accessorialId: number;
    chargeType: 'PER_POUND' | 'FLAT_VALUE' | 'HOURLY';
    chargeValue: number;
    entityId: number;
    noteThreadId?: number | null;
}

export interface NetworkShipmentLinehaulInfo {
    linehaulInfoId: number;
    shipmentId: number;
    entityId: number;
    linehaulRouting: 'LINEHAUL_ONLY' | 'LINEHAUL_DELIVERY';
    carrierId: number;
    terminalId: number;
    carrierBillNumber: string;
    editFromLocation: 'Y' | 'N';
    fromLocationType: 'Shipper' | 'Carrier';
    fromLocation: string;
    fromLocationEntityId: number;
    editToLocation: 'Y' | 'N';
    toLocationType: 'Consignee' | 'Carrier';
    toLocation: string;
    toLocationEntityId: number;
    etaDate: Date;
    etaTime: string;
    pices: number;
    weight: number;
}

export interface NetworkShipmentLinehaulCommonInfo {
    linehaulCommonInfoId: number;
    shipmentId: number;
    linehaulAccessorial: 'Y' | 'N';
    linehaulNotes: string;
}

export interface NetworkShipmentLinehaulAccessorial {
    linehaulAccessorialId: number;
    shipmentId: number;
    accessorialId: number;
    chargeType: 'PER_POUND' | 'FLAT_VALUE' | 'HOURLY';
    chargeValue: number;
    entityId: number;
    noteThreadId?: number | null;
}

export interface NetworkShipmentDeliveryInfo {
    deliveryInfoId: number;
    shipmentId: number;
    entityId: number;
    carrierId: number;
    terminalId: number;
    editFromLocation: 'Y' | 'N';
    fromLocationType: 'Shipper' | 'Carrier';
    fromLocation: string;
    fromLocationEntityId: number;
    editToLocation: 'Y' | 'N';
    toLocationType: 'Consignee' | 'Carrier';
    toLocation: string;
    toLocationEntityId: number;
    etaDate: Date;
    etaTime: string;
    pices: number;
    weight: number;
}

export interface NetworkShipmentDeliveryCommonInfo {
    deliveryCommonInfoId: number;
    shipmentId: number;
    deliveryAccessorial: 'Y' | 'N';
    airportTransfer: 'Y' | 'N';
    deliveryAlert: 'Y' | 'N';
}

export interface NetworkShipmentDeliveryAccessorial {
    deliveryAccessorialId: number;
    shipmentId: number;
    accessorialId: number;
    chargeType: 'PER_POUND' | 'FLAT_VALUE' | 'HOURLY';
    chargeValue: number;
    entityId: number;
    noteThreadId?: number | null;
}

export interface NetworkShipmentDeliveryAlertInfo {
    deliveryAlertId: number;
    shipmentId: number;
    linehaulNotes: string;
    deliveryNotes: string;
    primaryEmail: string;
    additionalEmail: string[];
}

//Common From and To Address Interface for Pickup, Linehaul and Delivery
export interface NetworkShipmentAddressInfo {
    addressId: number;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface NetworkShipmentAddressMap {
    entirtNetworkShipmentAddressId: number;
    shipmentId: number;
    entityId: number;
    addressId: number;
    addressType: 'FROM' | 'TO';
    locationType: 'Pickup' | 'Linehaul' | 'Delivery';
}