export interface CargoAPI {
    apiId: number;
    apiName: string;
    apiEndPoint: string;
    apiKey: string;
    activeStatus: 'Y' | 'N';
}

export interface CreateCargoAPIRequest {
    apiName: string;
    apiEndPoint: string;
    apiKey: string;
    activeStatus: 'Y' | 'N';
}

export interface UpdateCargoAPIRequest {
    apiName?: string;
    apiEndPoint?: string;
    apiKey?: string;
    activeStatus?: 'Y' | 'N';
}

export interface CargoAPIResponse extends CargoAPI { }