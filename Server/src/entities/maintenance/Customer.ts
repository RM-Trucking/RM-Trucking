import { AddressRequest, AddressResponse, AddressUpdateRequest } from "./Address";
import { NoteMessageRequest, NoteMessageResponse } from "./Note";

export interface Customer {
    customerId: number;
    customerName: string;
    rmAccountNumber: string;
    phoneNumber: string;
    website: string;
    activeStatus: 'Y' | 'N';
    createdAt: Date;
    createdBy: number;
    updatedAt: Date;
    updatedBy: number;
    noteThreadId: number | null;
    entityId: number;
    activeStatusReason: string;
    corporateBillingSame: 'Y' | 'N';

}

export interface CreateCustomerRequest {
    customerName: string;
    rmAccountNumber: string;
    phoneNumber: string;
    website: string;
    corporateBillingSame: 'Y' | 'N';
    addresses: AddressRequest[];
    note?: NoteMessageRequest;

}

export interface UpdateCustomerRequest {
    customerId: number;
    customerName?: string;
    rmAccountNumber?: string;
    phoneNumber?: string;
    website?: string;
    corporateBillingSame?: 'Y' | 'N';
    activeStatusReason?: string;
    addresses?: AddressUpdateRequest[];
}

/**
 * Customer response (without sensitive data)
 */
export interface CustomerResponse {
    customerId: number;
    customerName: string;
    rmAccountNumber: string;
    phoneNumber: string;
    website: string;
    activeStatus: 'Y' | 'N';
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
