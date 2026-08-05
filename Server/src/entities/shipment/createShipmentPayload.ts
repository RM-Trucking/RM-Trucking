// Create shipment payload definitions for a single flexible payload container.
export type CreateDate = string | Date;

export interface CreateShipmentDetails {
    typeOfShipment?: "AIR_IMPORT" | "AIR_EXPORT" | "OCEAN_IMPORT" | "OCEAN_EXPORT" | "DOMESTIC" | "NON_FORWARDER_DOMESTIC";
    serviceLevel?: string;
    shipmentDate?: CreateDate;
    shipmentTime?: string;
    orderReceivedPickupPending?: 'Y' | 'N';
    status?:
    | 'ORDER_RECEIVED_PICKUP_PENDING'
    | 'ORDER_RECEIVED_PICKUP_SETUP'
    | 'DISPATCHED_RSL'
    | 'PICKED'
    | 'AT_WAREHOUSE'
    | 'TO_BE_RECOVERED'
    | 'TO_BE_ROUTED'
    | 'ADDED_TO_QUEUE'
    | 'MANIFESTED'
    | 'CARRIER_PICKED_UP'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'APPOINTMENT'
    | 'RECOVERED_SHORT';
}

export interface CreateAirlineDetails {
    airlineId?: number;
    airlineNumber?: number;
    airlineCode?: string;
    airportCode?: string;
    airlineName?: string;
    addressLine1?: string;
    addressLine2?: string;
    state?: string;
    city?: string;
    zipCode?: string;
    contactPersonName?: string;
    phoneNumber?: string;
    entityId?: number;
    scenarioType?: 'IMPORT' | 'EXPORT';
}

export interface CreateShipperDetails {
    shipperId?: number;
    shipperName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    contactPersonName?: string;
    phoneNumber?: string;
    entityId?: number;
}

export interface CreateConsigneeDetails {
    consigneeId?: number;
    consigneeName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    contactPersonName?: string;
    phoneNumber?: string;
    entityId?: number;
}

export interface CreateCustomerReferenceNumber {
    referenceType?: string;
    referenceNumber?: string;
}

export interface CreateCustomerDetails {
    customerId?: number;
    stationId?: number;
    airportPickupService?: 'Y' | 'N';
    originAirportCode?: string;
    airportDeliveryService?: 'Y' | 'N';
    destinationAirportCode?: string;
    customerReferenceNumbers?: CreateCustomerReferenceNumber[];
    pickupAirlineDetails?: CreateAirlineDetails;
    shipperDetails?: CreateShipperDetails;
    deliveryAirlineDetails?: CreateAirlineDetails;
    consigneeDetails?: CreateConsigneeDetails;
}

export interface CreateHazmatDetails {
    unNumber?: string;
    properShippingName?: string;
    hazardClass?: string;
    packingGroup?: string;
    weight?: number;
    weightUnit?: string;
    technicalName?: string;
    contactPhoneNumber?: string;
    hazmatDescription?: string;
    limitedQuantity?: 'Y' | 'N';
    marinePollutant?: 'Y' | 'N';
    residueLastContained?: 'Y' | 'N';
    reportableQuantity?: 'Y' | 'N';
    dotExemption?: 'Y' | 'N';
}

export interface CreatePalletDetails {
    pieces?: number;
    piecesUOM?: string;
    description?: string;
    hazmat?: 'Y' | 'N';
    hazmatDetails?: CreateHazmatDetails;
}

export interface CreateHandlingUnitDetails {
    handlingUnitUOM?: string;
    handlingUnits?: number;
    unit?: string;
    handlingLength?: number;
    handlingWidth?: number;
    handlingHeight?: number;
    handlingWeight?: number;
    handlingWeightUnit?: string;
    class?: string;
    palletDetails?: CreatePalletDetails[];
}

export interface CreateCommodityDetails {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    handlingUnits?: CreateHandlingUnitDetails[];
}

export interface CreateNotes {
    noteMessage?: string;
}

export interface CreateEmailInfo {
    primaryEmail?: string;
    additionalEmails?: string[];
}

export interface CreateAddressDetail {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface CreatePickupAgentTerminalDetails {
    toLocationType?: 'Carrier' | 'Consignee';
    toLocation?: string;
    toLocationEntityId?: number;
    editToLocation?: 'Y' | 'N';
    editToLocationDetails?: CreateAddressDetail;
}

export interface CreatePickupAccessorialDetails {
    accessorials?: CreateAccessorial[];
}

export interface CreatePickupAlertDetails {
    inboundNotes?: string;
    emailInfo?: CreateEmailInfo;
}

export interface CreatePickupDetails {
    pickupRouting?: 'PICKUP_ONLY' | 'PICKUP_LINE_HAUL' | 'PICKUP_LINE_HAUL_DELIVERY';
    airportTransfer?: 'Y' | 'N';
    carrierId?: number;
    terminalId?: number;
    fromLocationType?: 'Shipper' | 'Carrier';
    fromLocation?: string;
    fromLocationEntityId?: number;
    editFromLocation?: 'Y' | 'N';
    editFromLocationDetails?: CreateAddressDetail;
    pickupAgentTerminal?: 'Y' | 'N';
    pickupAgentTerminalDetails?: CreatePickupAgentTerminalDetails;
    pickupAccessorial?: 'Y' | 'N';
    pickupAccessorialDetails?: CreatePickupAccessorialDetails;
    pickupAlert?: 'Y' | 'N';
    pickupAlertDetails?: CreatePickupAlertDetails;
}

export interface CreateLinehaulPrimaryInfo {
    linehaulRouting?: 'LINE_HAUL_ONLY' | 'LINE_HAUL_DELIVERY';
    carrierId?: number;
    terminalId?: number;
    carrierBillNumber?: string;
    fromLocationType?: 'Shipper' | 'Carrier';
    fromLocation?: string;
    fromLocationEntityId?: number;
    toLocationType?: 'Carrier' | 'Consignee';
    toLocation?: string;
    toLocationEntityId?: number;
    etaDate?: CreateDate;
    etaTime?: string;
    pieces?: number;
    weight?: number;
    editFromLocation?: 'Y' | 'N';
    editFromLocationDetails?: CreateAddressDetail;
    editToLocation?: 'Y' | 'N';
    editToLocationDetails?: CreateAddressDetail;
}

export interface CreateLinehaulCommonInfo {
    linehaulNotes?: string;
    linehaulAccessorial?: 'Y' | 'N';
    linehaulAccessorialDetails?: CreatePickupAccessorialDetails;
}

export interface CreateLinehaulDetails {
    linehaulPrimaryInfo?: CreateLinehaulPrimaryInfo;
    linehaulCommonInfo?: CreateLinehaulCommonInfo;
}

export interface CreateDeliveryPrimaryInfo {
    carrierId?: number;
    terminalId?: number;
    carrierBillNumber?: string;
    fromLocationType?: 'Carrier';
    fromLocation?: string;
    fromLocationEntityId?: number;
    toLocationType?: 'Consignee';
    toLocation?: string;
    toLocationEntityId?: number;
    etaDate?: CreateDate;
    etaTime?: string;
    pieces?: number;
    weight?: number;
    editFromLocation?: 'Y' | 'N';
    editFromLocationDetails?: CreateAddressDetail;
    editToLocation?: 'Y' | 'N';
    editToLocationDetails?: CreateAddressDetail;
}

export interface CreateDeliveryCommonInfo {
    airportTransfer?: 'Y' | 'N';
    deliveryAccessorial?: 'Y' | 'N';
    deliveryAccessorialDetails?: CreatePickupAccessorialDetails;
    deliveryAlert?: 'Y' | 'N';
    deliveryAlertDetails?: {
        linehaulNotes?: string;
        deliveryNotes?: string;
        emailInfo?: CreateEmailInfo;
    };
}

export interface CreateDeliveryDetails {
    deliveryPrimaryInfo?: CreateDeliveryPrimaryInfo;
    deliveryCommonInfo?: CreateDeliveryCommonInfo;
}

export interface CreateCarrierDetails {
    pickupDetails?: CreatePickupDetails;
    linehaulDetails?: CreateLinehaulDetails;
    deliveryDetails?: CreateDeliveryDetails;
}

export interface CreateAccessorial {
    accessorialId?: number;
    accessorialName?: string;
    chargeType?: string;
    chargeValue?: number;
    notes?: CreateNotes[];
}

export interface CreateRateDetails {
    rateType?: string;
    multiplicationFactor?: number;
    multiplicationFactorUOM?: string;
    rateValue?: number;
    totalRate?: number;
}

export interface CreateInvoiceDetails {
    shipmentId?: number;
    invoiceNumber?: string;
    invoiceType?: 'PICKUP' | 'LINE_HAUL' | 'DELIVERY';
    subTotalRate?: number;
    approvalStatus?: 'Y' | 'N';
    approvedBy?: number;
    approvedDate?: CreateDate;
}

export interface CreatePickupRateDetails {
    invoiceNumber?: string;
    rateDetails?: CreateRateDetails[];
    pickupSubTotalRate?: number;
    invoiceApprovalStatus?: 'Y' | 'N';
    approvedBy?: number;
    approvedDate?: CreateDate;
}

export interface CreateLinehaulRateDetails {
    invoiceNumber?: string;
    rateDetails?: CreateRateDetails[];
    linehaulSubTotalRate?: number;
    invoiceApprovalStatus?: 'Y' | 'N';
    approvedBy?: number;
    approvedDate?: CreateDate;
}

export interface CreateDeliveryRateDetails {
    invoiceNumber?: string;
    rateDetails?: CreateRateDetails[];
    deliverySubTotalRate?: number;
    invoiceApprovalStatus?: 'Y' | 'N';
    approvedBy?: number;
    approvedDate?: CreateDate;
}

export interface CreateCarrierRateDetails {
    pickupRateDetails?: CreatePickupRateDetails;
    linehaulRateDetails?: CreateLinehaulRateDetails;
    deliveryRateDetails?: CreateDeliveryRateDetails;
    totalCarrierRate?: number;
}

export interface CreateCustomerRateDetails {
    rateDetails?: CreateRateDetails[];
    totalCustomerRate?: number;
}

export interface CreateShipmentRateDetails {
    carrierRateDetails?: CreateCarrierRateDetails;
    customerRateDetails?: CreateCustomerRateDetails;
}

export interface CreateShipmentPayload {
    shipmentDetails?: CreateShipmentDetails;
    customerDetails?: CreateCustomerDetails;
    commodityDetails?: CreateCommodityDetails;
    carrierDetails?: CreateCarrierDetails;
    shipmentRateDetails?: CreateShipmentRateDetails;
    [key: string]: unknown;
}
