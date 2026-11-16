export interface EmailDeliveryResult {
    sent: boolean;
    message?: string;
    provider?: string;
}

import { db, SCHEMA } from '../config/db2';

export async function sendPasswordResetOtpEmail(email: string, otp: string, expiryMinutes: number): Promise<EmailDeliveryResult> {
    if (!email || !otp) throw new Error('Email address and OTP are required');
    const connection = await db();
    try {
        const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'no-reply@rmtrucking.com';
        const subject = 'Password reset code';
        const body = `Your password reset code is ${otp}. It expires in ${expiryMinutes} minutes. If you did not request a reset, ignore this email.`;
        await (connection as any).callProcedure(null, SCHEMA, 'SNDMULMAI1', [from, email, subject, body, ' ', ' ']);
        return { sent: true, provider: 'db2-email-procedure', message: 'Password reset code sent' };
    } finally {
        await connection.close();
    }
}
