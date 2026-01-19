import { Request, Response } from 'express';
import { Connection } from 'odbc';
import * as noteService from '../../services/maintenance/';

export async function addNote(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const userId = (req as any).user?.userId || 1;
        const { noteThreadId, messageText } = req.body;

        if (!noteThreadId || !messageText) {
            res.status(400).json({ error: 'noteThreadId and messageText are required' });
            return;
        }

        const note = await noteService.addNoteService(conn, noteThreadId, messageText, userId);
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to add note',
            message: (error as Error).message
        });
    }
}

export async function getNotesByThread(req: Request, res: Response, conn: Connection): Promise<void> {
    try {
        const { noteThreadId } = req.params;
        const notes = await noteService.getNotesByThreadService(conn, parseInt(noteThreadId, 10));
        res.status(200).json({ success: true, data: notes });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to fetch notes',
            message: (error as Error).message
        });
    }
}
