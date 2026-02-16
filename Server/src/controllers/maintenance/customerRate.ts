import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as rateService from '../../services/maintenance/customerRate';

// -------------------- Warehouse Rate --------------------
export async function createWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.createWarehouseRateService(conn, req.body);
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        console.log(error);

        res.status(400).json({ error: 'Failed to create warehouse rate', message: (error as Error).message });
    }
}

export async function getWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.getWarehouseRateService(conn, Number(req.params.id));
        if (!rate) {
            res.status(404).json({ error: 'Warehouse rate not found' });
            return;
        }
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch warehouse rate', message: (error as Error).message });
    }
}

export async function updateWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.updateWarehouseRateService(conn, Number(req.params.id), req.body);
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update warehouse rate', message: (error as Error).message });
    }
}

export async function deleteWarehouseRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await rateService.deleteWarehouseRateService(conn, Number(req.params.id));
        res.json({ success: true, message: 'Warehouse rate deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete warehouse rate', message: (error as Error).message });
    }
}

// -------------------- Transport Rate --------------------
export async function createTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = req.user?.userId || 0;
        const rate = await rateService.createTransportRateService(conn, req.body, userId);
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create transport rate', message: (error as Error).message });
    }
}


export async function getTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.getTransportRateService(conn, Number(req.params.id));
        if (!rate) {
            res.status(404).json({ error: 'Transport rate not found' });
            return;
        }
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch transport rate', message: (error as Error).message });
    }
}

export async function updateTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.updateTransportRateService(conn, Number(req.params.id), req.body);
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update transport rate', message: (error as Error).message });
    }
}

export async function deleteTransportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await rateService.deleteTransportRateService(conn, Number(req.params.id));
        res.json({ success: true, message: 'Transport rate deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete transport rate', message: (error as Error).message });
    }
}

// -------------------- Station Rate Map --------------------
export async function assignRateToStation(
    req: Request,
    res: Response,
    conn: Connection
): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 'system';
        // Expect req.body to contain an array of mappings
        const maps = await rateService.assignRateToStationService(conn, req.body, userId);
        res.status(201).json({ success: true, data: maps });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: 'Failed to assign rate(s) to station',
            message: (error as Error).message
        });
    }
}


export async function getStationRates(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const stationId = Number(req.query.stationId);
        const { rateType } = req.query;

        const maps = await rateService.getStationRatesService(
            conn,
            stationId,
            rateType as 'WAREHOUSE' | 'TRANSPORT' | undefined
        );

        res.json({ success: true, data: maps });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch station rates', message: (error as Error).message });
    }
}

export async function deleteStationRateMap(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await rateService.deleteStationRateMapService(conn, Number(req.params.id));
        res.json({ success: true, message: 'Station rate mapping deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete station rate mapping', message: (error as Error).message });
    }
}

export async function listWarehouseRates(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { search, page = 1, pageSize = 10 } = req.query;
        const result = await rateService.listWarehouseRatesService(
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

export async function listTransportRates(
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

        const result = await rateService.listTransportRatesService(
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
                total: result.total,
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

export async function listTransportRatesByZone(
    req: Request,
    res: Response,
    conn: Connection
): Promise<void> {
    try {
        const zoneId = Number(req.query.zoneId);
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

        const result = await rateService.listTransportRatesByZoneService(conn, zoneId, page, pageSize);

        res.status(200).json({
            success: true,
            data: result.rates,
            pagination: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize
            }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}
