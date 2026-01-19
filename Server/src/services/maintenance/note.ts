import { Connection } from 'odbc';
import * as noteDB from '../../database/maintenance';
import { NoteMessage } from '../../entities/maintenance';

export async function addNoteService(
    conn: Connection,
    noteThreadId: number,
    messageText: string,
    userId: number
): Promise<NoteMessage> {
    const noteMessageId = await noteDB.createNoteMessage(conn, noteThreadId, messageText, userId);
    const notes = await noteDB.getMessagesByThread(conn, noteThreadId);

    // Return the newly created note message
    const newNote = notes.find(n => n.noteMessageId === noteMessageId);
    if (!newNote) throw new Error('Failed to create note');
    return newNote;
}

export async function getNotesByThreadService(
    conn: Connection,
    noteThreadId: number
): Promise<NoteMessage[]> {
    return await noteDB.getMessagesByThread(conn, noteThreadId);
}
