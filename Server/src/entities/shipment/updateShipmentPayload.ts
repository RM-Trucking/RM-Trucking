import type {
    CreateAddressDetail,
    CreateAirlineDetails,
    CreateCarrierDetails,
    CreateCommodityDetails,
    CreateConsigneeDetails,
    CreateCustomerDetails,
    CreateCustomerReferenceNumber,
    CreateDeliveryDetails,
    CreateHandlingUnitDetails,
    CreateLinehaulDetails,
    CreatePickupDetails,
    CreateAccessorial,
    CreateRateDetails,
    CreateShipmentDetails,
    CreateShipperDetails,
    CreatePickupAgentTerminalDetails,
    CreatePickupAccessorialDetails,
} from "./createShipmentPayload";

export type UpdateEntityRecord<T, TIdKey extends string = "id"> = Partial<T> & {
    [K in TIdKey]?: number;
} & {
    delete?: boolean;
};

export type UpdateShipmentDetails = UpdateEntityRecord<CreateShipmentDetails, "shipmentId">;
export type UpdateAirlineDetails = UpdateEntityRecord<CreateAirlineDetails, "airlineId">;
export type UpdateShipperDetails = UpdateEntityRecord<CreateShipperDetails, "shipperId">;
export type UpdateConsigneeDetails = UpdateEntityRecord<CreateConsigneeDetails, "consigneeId">;
export type UpdateCustomerReferenceNumber = UpdateEntityRecord<CreateCustomerReferenceNumber, "referenceNumberId">;
export type UpdateCustomerDetails = UpdateEntityRecord<CreateCustomerDetails, "customerInfoId">;
export type UpdateAddressDetail = UpdateEntityRecord<CreateAddressDetail, "addressId">;
export type UpdateAccessorial = UpdateEntityRecord<CreateAccessorial, "accessorialId"> & {
    pickupAccessorialId?: number;
    linehaulAccessorialId?: number;
    deliveryAccessorialId?: number;
    noteThreadId?: number | null;
    entityId?: number;
};
export type UpdatePickupAccessorialDetails = Omit<CreatePickupAccessorialDetails, "accessorials"> & {
    accessorials?: UpdateAccessorial[];
};
export type UpdatePickupAgentTerminalDetails = UpdateEntityRecord<CreatePickupAgentTerminalDetails, "pickupAgentTerminalId"> & {
    editToLocationDetails?: UpdateAddressDetail;
};
export type UpdatePickupDetails = UpdateEntityRecord<Omit<CreatePickupDetails, "editFromLocationDetails" | "pickupAgentTerminalDetails">, "pickupInfoId"> & {
    editFromLocationDetails?: UpdateAddressDetail;
    pickupAgentTerminalDetails?: UpdatePickupAgentTerminalDetails;
};
export type UpdateLinehaulPrimaryInfo = UpdateEntityRecord<Omit<NonNullable<CreateLinehaulDetails["linehaulPrimaryInfo"]>, "editFromLocationDetails" | "editToLocationDetails">, "linehaulInfoId"> & {
    entityId?: number;
    editFromLocationDetails?: UpdateAddressDetail;
    editToLocationDetails?: UpdateAddressDetail;
};
export type UpdateLinehaulCommonInfo = UpdateEntityRecord<NonNullable<CreateLinehaulDetails["linehaulCommonInfo"]>, "linehaulCommonInfoId">;
export type UpdateLinehaulDetails = UpdateEntityRecord<Omit<CreateLinehaulDetails, "linehaulPrimaryInfo" | "linehaulCommonInfo">, "linehaulInfoId"> & {
    linehaulPrimaryInfo?: UpdateLinehaulPrimaryInfo;
    linehaulCommonInfo?: UpdateLinehaulCommonInfo & {
        linehaulAccessorialDetails?: UpdatePickupAccessorialDetails;
    };
};
export type UpdateDeliveryPrimaryInfo = UpdateEntityRecord<Omit<NonNullable<CreateDeliveryDetails["deliveryPrimaryInfo"]>, "editFromLocationDetails" | "editToLocationDetails">, "deliveryInfoId"> & {
    entityId?: number;
    editFromLocationDetails?: UpdateAddressDetail;
    editToLocationDetails?: UpdateAddressDetail;
};
export type UpdateDeliveryCommonInfo = UpdateEntityRecord<NonNullable<CreateDeliveryDetails["deliveryCommonInfo"]>, "deliveryCommonInfoId">;
export type UpdateDeliveryDetails = UpdateEntityRecord<Omit<CreateDeliveryDetails, "deliveryPrimaryInfo" | "deliveryCommonInfo">, "deliveryInfoId"> & {
    deliveryPrimaryInfo?: UpdateDeliveryPrimaryInfo;
    deliveryCommonInfo?: UpdateDeliveryCommonInfo;
};
export type UpdateCarrierDetails = Partial<CreateCarrierDetails> & { delete?: boolean };
export type UpdateHandlingUnitDetails = UpdateEntityRecord<CreateHandlingUnitDetails, "handlingUnitId">;
export type UpdateCommodityDetails = UpdateEntityRecord<CreateCommodityDetails, "commodityId">;
export type UpdateRateDetails = UpdateEntityRecord<CreateRateDetails, "rateId">;

export interface UpdateCustomerRateDetails {
    customerRateId?: number;
    rateDetails?: UpdateRateDetails[];
    totalCustomerRate?: number;
}

export interface UpdateShipmentRateDetails {
    carrierRateId?: number;
    carrierRateDetails?: {
        pickupRateDetails?: {
            invoiceId?: number;
            invoiceNumber?: string;
            rateDetails?: UpdateRateDetails[];
            pickupSubTotalRate?: number;
        };
        linehaulRateDetails?: {
            invoiceId?: number;
            invoiceNumber?: string;
            rateDetails?: UpdateRateDetails[];
            linehaulSubTotalRate?: number;
        };
        deliveryRateDetails?: {
            invoiceId?: number;
            invoiceNumber?: string;
            rateDetails?: UpdateRateDetails[];
            deliverySubTotalRate?: number;
        };
        totalCarrierRate?: number;
    };
    customerRateDetails?: UpdateCustomerRateDetails;
}

export interface UpdateShipmentPayload {
    shipmentDetails?: UpdateShipmentDetails;
    customerDetails?: UpdateCustomerDetails;
    commodityDetails?: UpdateCommodityDetails;
    carrierDetails?: UpdateCarrierDetails;
    shipmentRateDetails?: UpdateShipmentRateDetails;
    [key: string]: unknown;
}
