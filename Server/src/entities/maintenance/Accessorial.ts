// Accessorial.ts
export interface Accessorial {
    accessorialId: number;
    accessorialName: string;
    createdAt: Date | null;
    createdBy: number;
    updatedAt?: Date | null;
    updatedBy?: number;
    activeStatus?: 'Y' | 'N';
}

export interface CreateAccessorialRequest {
    accessorialName: string;
}

export interface AccessorialResponse extends Accessorial { }
