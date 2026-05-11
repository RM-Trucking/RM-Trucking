export interface Printers {
    printerId: number;
    printerName: string;
    printerIP: string;
    printerPort: number;
    activeStatus: 'Y' | 'N';
}

export interface CreatePrinterRequest {
    printerName: string;
    printerIP: string;
    printerPort: number;
    activeStatus: 'Y' | 'N';
}

export interface UpdatePrinterRequest {
    printerName?: string;
    printerIP?: string;
    printerPort?: number;
    activeStatus?: 'Y' | 'N';
}

export interface PrinterResponse extends Printers { }