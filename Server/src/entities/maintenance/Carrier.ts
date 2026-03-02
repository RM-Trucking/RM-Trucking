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
    insuranceExpiry?: Date;
    tariffRenewalDate?: Date;
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
}

export interface CreateCarrierRequest {
    carrierName: string;
    carrierType: string;
    carrierStatus: 'Active' | 'Inactive' | 'Incomplete';
    tsaCertified?: 'Y' | 'N';
    ustDotNo?: string;
    mcnNo?: string;
    insuranceExpiry?: string;
    tariffRenewalDate?: string;
    salesRepName?: string;
    salesRepPhone?: string;
    salesRepEmail?: string;
    addresses: AddressRequest[];
    note?: NoteMessageRequest;
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
    insuranceExpiry?: Date;
    tariffRenewalDate?: Date;
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

    // Nested collections
    addresses: AddressResponse[];
    notes?: NoteMessageResponse[];
}
