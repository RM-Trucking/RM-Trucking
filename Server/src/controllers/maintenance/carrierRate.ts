import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as rateService from '../../services/maintenance/carrierRate';

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


export async function getCarrierTransportRateQuote(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const originZip = req.query.originZip as string | undefined;
        const destinationZip = req.query.destinationZip as string | undefined;
        const weight = Number(req.query.weight);
        const terminalId = Number(req.query.terminalId);

        const result = await rateService.getCarrierTransportRateQuoteService(conn, originZip || '', destinationZip || '', weight, terminalId);
        res.json({ success: true, data: result });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Failed to fetch transport rate quote', message: (error as Error).message });
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
            rateType as 'WAREHOUSE' | 'TRANSPORT' | 'AIRPORT' | undefined,
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
        const page = Number(req.query.page as string) || 1;
        const pageSize = Number(req.query.pageSize as string) || 10;

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

// -------------------- Airport Rate --------------------
export async function createCarrierAirportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = req.user?.userId || 0;
        const rate = await rateService.createCarrierAirportRateService(conn, req.body, userId);
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create airport rate', message: (error as Error).message });
    }
}

export async function getCarrierAirportRateQuote(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await rateService.getCarrierAirportRateQuoteService(
            conn,
            req.query.originZip as string || '',
            req.query.destinationZip as string || '',
            Number(req.query.weight),
            Number(req.query.terminalId)
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch airport rate quote', message: (error as Error).message });
    }
}

export async function getCarrierAirportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.getCarrierAirportRateService(conn, Number(req.params.id));
        if (!rate) {
            res.status(404).json({ error: 'Airport rate not found' });
            return;
        }
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch airport rate', message: (error as Error).message });
    }
}

export async function updateCarrierAirportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const rate = await rateService.updateCarrierAirportRateService(conn, Number(req.params.id), req.body, req.user?.userId || 0);
        res.json({ success: true, data: rate });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update airport rate', message: (error as Error).message });
    }
}

export async function deleteCarrierAirportRate(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        await rateService.deleteCarrierAirportRateService(conn, Number(req.params.id));
        res.json({ success: true, message: 'Airport rate deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete airport rate', message: (error as Error).message });
    }
}

export async function listCarrierAirportRates(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await rateService.listCarrierAirportRatesService(
            conn,
            {
                originZoneId: req.query.originZoneId ? Number(req.query.originZoneId) : undefined,
                originZipOrRange: req.query.originZipOrRange as string | undefined,
                destinationZoneId: req.query.destinationZoneId ? Number(req.query.destinationZoneId) : undefined,
                destinationZipOrRange: req.query.destinationZipOrRange as string | undefined
            },
            Number(req.query.page || 1),
            Number(req.query.pageSize || 10)
        );
        res.json({ success: true, data: result.rates, pagination: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch airport rates', message: (error as Error).message });
    }
}

export async function listCarrierAirportRatesByZone(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const result = await rateService.listCarrierAirportRatesByZoneService(
            conn,
            Number(req.query.zoneId),
            Number(req.query.page || 1),
            Number(req.query.pageSize || 10)
        );
        res.json({ success: true, data: result.rates, pagination: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (error) {
        res.status(400).json({ error: 'Failed to fetch airport rates', message: (error as Error).message });
    }
}
