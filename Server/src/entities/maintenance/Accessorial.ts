// Accessorial.ts
export interface Accessorial {
    accessorialId: number;
    accessorialName: string;
    createdAt: Date;
    createdBy: number;
    updatedAt?: Date;
    updatedBy?: number;
    activeStatus?: 'Y' | 'N';
}

export interface CreateAccessorialRequest {
    accessorialName: string;
}

export interface AccessorialResponse extends Accessorial { }
