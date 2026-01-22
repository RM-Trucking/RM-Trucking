export interface Department {
    departmentId: number;
    stationId: number;
    departmentName: string;
    phoneNumber: string;
    email: string;
    activeStatus: string;
    noteThreadId?: number | null;
    entityId: number;
    createdAt: Date;
    createdBy: number;
    updatedAt: Date;
    updatedBy: number;
}

export interface CreateDepartmentRequest {
    stationId: number;
    departmentName: string;
    phoneNumber: string;
    email: string;
    note?: { messageText: string };
}

export interface UpdateDepartmentRequest {
    departmentName?: string;
    phoneNumber?: string;
    email?: string;
}

export interface DepartmentResponse extends Department {
    stationName: string;
    customerName: string;
    notes: {
        noteMessageId: number;
        noteThreadId: number;
        messageText: string;
        createdAt: Date;
        createdBy: number;
        createdByName?: string;
    }[];
}
