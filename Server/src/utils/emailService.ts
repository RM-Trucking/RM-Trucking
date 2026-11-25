export interface EmailDeliveryResult {
    sent: boolean;
    message?: string;
    provider?: string;
}

import { db, SCHEMA } from '../config/db2';

export async function sendEmail(
    to: string,
    subject: string,
    body: string,
    attachmentPath?: string,
): Promise<EmailDeliveryResult> {
    if (!to?.trim() || !subject?.trim() || !body?.trim()) {
        throw new Error('Recipient, subject, and body are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
        throw new Error('A valid recipient email address is required');
    }

    const connection = await db();
    try {
        const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'CFSAIREXPORT@RMTRUCKING.COM';
        await (connection as any).callProcedure(null, SCHEMA, 'SNDMULMAI1', [
            from,
            to.trim(),
            subject,
            body,
            attachmentPath || ' ',
            ' ',
        ]);
        return { sent: true, provider: 'db2-email-procedure', message: `Email sent to ${to.trim()}` };
    } finally {
        await connection.close();
    }
}

export async function sendPasswordResetOtpEmail(email: string, otp: string, expiryMinutes: number): Promise<EmailDeliveryResult> {
    if (!otp) throw new Error('Email address and OTP are required');
    const subject = 'Password reset code';
    const body = `Your password reset code is ${otp}. It expires in ${expiryMinutes} minutes. If you did not request a reset, ignore this email.`;
    const result = await sendEmail(email, subject, body);
    return { ...result, message: 'Password reset code sent' };
}
