import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as rateService from '../../services/maintenance/carrierRate';

// -------------------- Warehouse Rate --------------------
export async function createCarrierWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.createCarrierWarehouseRateService(conn, req.body);
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        console.log(error);

        res.status(400).json({ error: 'Failed to create warehouse rate', message: (error as Error).message });
    }
}

export async function getCarrierWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.getCarrierWarehouseRateService(conn, Number(req.params.id));
        if (!rate) {
            res.status(404).json({ error: 'Warehouse rate not found' });
            return;
        }
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch warehouse rate', message: (error as Error).message });
    }
}

export async function updateCarrierWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.updateCarrierWarehouseRateService(conn, Number(req.params.id), req.body);
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update warehouse rate', message: (error as Error).message });
    }
}

export async function deleteCarrierWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await rateService.deleteCarrierWarehouseRateService(conn, Number(req.params.id));
        res.json({ success: true, message: 'Warehouse rate deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete warehouse rate', message: (error as Error).message });
    }
}

// -------------------- Transport Rate --------------------
export async function createCarrierTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = req.user?.userId || 0;
        const rate = await rateService.createCarrierTransportRateService(conn, req.body, userId);
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create transport rate', message: (error as Error).message });
    }
}


export async function getCarrierTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.getCarrierTransportRateService(conn, Number(req.params.id));
        if (!rate) {
            res.status(404).json({ error: 'Transport rate not found' });
            return;
        }
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch transport rate', message: (error as Error).message });
    }
}

export async function updateCarrierTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = req.user?.userId || 0;
        const rate = await rateService.updateCarrierTransportRateService(conn, Number(req.params.id), req.body, userId);
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update transport rate', message: (error as Error).message });
    }
}

export async function deleteCarrierTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await rateService.deleteCarrierTransportRateService(conn, Number(req.params.id));
        res.json({ success: true, message: 'Transport rate deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete transport rate', message: (error as Error).message });
    }
}

// -------------------- Terminal Rate Map --------------------
export async function assignRateToTerminal(
    req: Request,
    res: Response,
    conn: Connection
): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 'system';
        // Expect req.body to contain an array of mappings
        const maps = await rateService.assignRateToTerminalService(conn, req.body, userId);
        res.status(201).json({ success: true, data: maps });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: 'Failed to assign rate(s) to terminal',
            message: (error as Error).message
        });
    }
}


export async function getTerminalRates(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const terminalId = Number(req.query.terminalId);

        console.log(req.query.terminalId);


        const {
            rateType,
            originZoneId,
            originZipOrRange,
            destinationZoneId,
            destinationZipOrRange,
        } = req.query;

        const maps = await rateService.getTerminalRatesService(
            conn,
            terminalId,
            rateType as 'WAREHOUSE' | 'TRANSPORT' | undefined,
            {
                originZoneId: originZoneId ? Number(originZoneId) : undefined,
                originZipOrRange: originZipOrRange as string | undefined,
                destinationZoneId: destinationZoneId ? Number(destinationZoneId) : undefined,
                destinationZipOrRange: destinationZipOrRange as string | undefined
            }
        );

        res.json({ success: true, data: maps });
    } catch (error) {
        console.log(error);

        res.status(400).json({ error: 'Failed to fetch terminal rates', message: (error as Error).message });
    }
}
export async function deleteTerminalRateMap(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await rateService.deleteTerminalRateMapService(conn, Number(req.params.id));
        res.json({ success: true, message: 'Terminal rate mapping deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete terminal rate mapping', message: (error as Error).message });
    }
}

export async function listCarrierWarehouseRates(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { search, page = 1, pageSize = 10 } = req.query;
        const result = await rateService.listCarrierWarehouseRatesService(
            conn,
            search as string,
            Number(page),
            Number(pageSize)
        );
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch warehouse rates', message: (error as Error).message });
    }
}

export async function listCarrierTransportRates(
    req: Request,
    res: Response,
    conn: Connection
): Promise<void> {
    try {
        const {
            originZoneId,
            originZipOrRange,
            destinationZoneId,
            destinationZipOrRange,
            page = '1',
            pageSize = '10'
        } = req.query;

        const result = await rateService.listCarrierTransportRatesService(
            conn,
            {
                originZoneId: originZoneId ? Number(originZoneId) : undefined,
                originZipOrRange: originZipOrRange as string | undefined,
                destinationZoneId: destinationZoneId ? Number(destinationZoneId) : undefined,
                destinationZipOrRange: destinationZipOrRange as string | undefined
            },
            Number(page),
            Number(pageSize)
        );

        res.status(200).json({
            success: true,
            data: result.rates,
            pagination: {
                total: result.total || 0,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error) {
        console.log(error);

        res.status(400).json({
            error: 'Failed to fetch transport rates',
            message: (error as Error).message
        });
    }
}

export async function listCarrierTransportRatesByZone(
    req: Request,
    res: Response,
    conn: Connection
): Promise<void> {
    try {

        const zoneId = Number(req.query.zoneId);
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

        const result = await rateService.listCarrierTransportRatesByZoneService(conn, zoneId, page, pageSize);

        res.status(200).json({
            success: true,
            data: result.rates,
            pagination: {
                total: result.total || 0,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error: any) {
        console.log(error);

        res.status(400).json({ success: false, message: error.message });
    }
}
