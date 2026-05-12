import { AddressRequest, AddressResponse, AddressUpdateRequest } from "./Address";
import { NoteMessageRequest, NoteMessageResponse } from "./Note";

export interface Carrier {
    carrierId: number;
    carrierName: string;
    carrierType: string;
    carrierStatus: 'Active' | 'Inactive' | 'Incomplete';
    tsaCertified: 'Y' | 'N';
    ustDotNo?: string;
    mcnNo?: string;
    insuranceExpiry?: Date | null;
    tariffRenewalDate?: Date | null;
    totalShipments: number;
    rmOnTimePercent: number;
    lateShipments: number;
    salesRepName?: string;
    salesRepPhone?: string;
    salesRepEmail?: string;
    createdAt: Date;
    createdBy: number;
    updatedAt: Date;
    updatedBy: number;
    noteThreadId: number | null;
    entityId: number;
    corporateBillingSame: 'Y' | 'N';
    corporatePhoneNumber?: string;
    isParcelCarrier?: 'Y' | 'N';
}

export interface CreateCarrierRequest {
    carrierName: string;
    carrierType: string;
    carrierStatus: 'Active' | 'Inactive' | 'Incomplete';
    tsaCertified?: 'Y' | 'N';
    ustDotNo?: string;
    mcnNo?: string;
    insuranceExpiry?: string | Date | null;
    tariffRenewalDate?: string | Date | null;
    salesRepName?: string;
    salesRepPhone?: string;
    salesRepEmail?: string;
    corporateBillingSame: 'Y' | 'N';
    addresses: AddressRequest[];
    note?: NoteMessageRequest;
    corporatePhoneNumber?: string;
    isParcelCarrier?: 'Y' | 'N';
}

export interface UpdateCarrierRequest {
    carrierId: number;
    carrierName?: string;
    carrierType?: string;
    carrierStatus?: 'Active' | 'Inactive' | 'Incomplete';
    tsaCertified?: 'Y' | 'N';
    ustDotNo?: string;
    mcnNo?: string;
    insuranceExpiry?: string;
    tariffRenewalDate?: string;
    totalShipments?: number;
    rmOnTimePercent?: number;
    lateShipments?: number;
    salesRepName?: string;
    salesRepPhone?: string;
    salesRepEmail?: string;
    corporateBillingSame: 'Y' | 'N';
    corporatePhoneNumber?: string;
    isParcelCarrier?: 'Y' | 'N';
    addresses?: AddressUpdateRequest[];
}

export interface CarrierResponse {
    carrierId: number;
    carrierName: string;
    carrierType: string;
    carrierStatus: 'Active' | 'Inactive' | 'Incomplete';
    tsaCertified: 'Y' | 'N';
    ustDotNo?: string;
    mcnNo?: string;
    insuranceExpiry?: Date | null;
    tariffRenewalDate?: Date | null;
    totalShipments: number;
    rmOnTimePercent: number;
    lateShipments: number;
    salesRepName?: string;
    salesRepPhone?: string;
    salesRepEmail?: string;
    createdAt: Date | null;
    createdBy: number;
    updatedAt: Date | null;
    updatedBy: number;
    noteThreadId: number | null;
    entityId: number;
    corporateBillingSame: 'Y' | 'N';
    // Nested collections
    addresses: AddressResponse[];
    notes?: NoteMessageResponse[];
}
