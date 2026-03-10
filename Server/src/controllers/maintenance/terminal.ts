import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as terminalService from '../../services/maintenance/terminal';

export async function createTerminal(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const adminId = (req as any).user?.userId || 1;
        const { terminal } = await terminalService.createTerminal(conn, req.body, adminId);
        res.status(201).json({ success: true, data: terminal });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: 'Failed to create terminal',
            message: (error as Error).message
        });
    }
}

export async function getTerminal(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const terminalId = parseInt(req.params.terminalId, 10);
        const terminal = await terminalService.getTerminalById(conn, terminalId);
        if (!terminal) {
            res.status(404).json({ success: false, message: 'Terminal not found' });
            return;
        }
        res.status(200).json({ success: true, data: terminal });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: 'Failed to fetch terminal',
            message: (error as Error).message
        });
    }
}

export async function getTerminalsForCarrier(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const carrierId = parseInt(req.params.carrierId, 10);
        const terminals = await terminalService.getTerminalsForCarrier(conn, carrierId);
        res.status(200).json({ success: true, data: terminals });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: 'Failed to fetch terminals for carrier',
            message: (error as Error).message
        });
    }
}

export async function updateTerminal(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const terminalId = parseInt(req.params.terminalId, 10);
        const adminId = (req as any).user?.userId || 1;
        const terminal = await terminalService.updateTerminalService(conn, terminalId, req.body, adminId);
        res.status(200).json({ success: true, data: terminal });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: 'Failed to update terminal',
            message: (error as Error).message
        });
    }
}

export async function deleteTerminal(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const terminalId = parseInt(req.params.terminalId, 10);
        const adminId = (req as any).user?.userId || 1;
        await terminalService.deleteTerminal(conn, terminalId, adminId);
        res.status(200).json({ success: true, message: 'Terminal deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: 'Failed to delete terminal',
            message: (error as Error).message
        });
    }
}
