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
    CreateRateDetails,
    CreateShipmentDetails,
    CreateShipperDetails,
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
export type UpdatePickupDetails = UpdateEntityRecord<CreatePickupDetails, "pickupInfoId">;
export type UpdateLinehaulDetails = UpdateEntityRecord<CreateLinehaulDetails, "linehaulInfoId">;
export type UpdateDeliveryDetails = UpdateEntityRecord<CreateDeliveryDetails, "deliveryInfoId">;
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
