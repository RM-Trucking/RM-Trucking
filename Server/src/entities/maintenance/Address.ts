export interface Address {
    addressId: number;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    createdAt: Date;
    createdBy: number;
    updatedAt: Date;
    updatedBy: number;
    addressRole: 'Corporate' | 'Billing' | 'Primary';
}

export interface AddressRequest {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    addressRole: 'Corporate' | 'Billing' | 'Primary';
}

export interface AddressUpdateRequest {
    addressId: number;
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string;
    zipCode?: string;
    addressRole?: 'Corporate' | 'Billing' | 'Primary';
}

export interface AddressResponse {
    addressId: number;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    addressRole: 'Corporate' | 'Billing' | 'Primary';
}
