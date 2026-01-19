// Accessorial.ts
export interface Accessorial {
    accessorialId: number;
    accessorialName: string;
    createdAt: Date;
    createdBy: number;
    updatedAt?: Date;
    updatedBy?: number;
}

export interface CreateAccessorialRequest {
    accessorialName: string;
}

export interface AccessorialResponse extends Accessorial { }
