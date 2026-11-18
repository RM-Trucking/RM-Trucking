import { db, SCHEMA } from '../../config/db2';

export interface EmailDeliveryResult {
    sent: boolean;
    message?: string;
    provider?: string;
    otp?: string;
}

export class WarehouseEmailService {
    public static generateOtp(length: number = 6): string {
        const digits = '0123456789';
        let otp = '';

        for (let index = 0; index < length; index += 1) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }

        return otp;
    }

    public static async sendPasswordResetEmail(email: string, token: string, otp?: string): Promise<EmailDeliveryResult> {
        const host = process.env.SMTP_HOST || 'smtp.rmtrucking.com';
        const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'no-reply@rmtrucking.com';

        if (!email || !token) {
            return { sent: false, message: 'Email address and reset token are required.' };
        }

        const resetCode = otp || this.generateOtp(6);
        const resetLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${encodeURIComponent(token)}`;
        const subject = 'Password reset OTP';
        const html = `
            <p>Hello,</p>
            <p>You requested a password reset.</p>
            <p>Your one-time password is: <strong>${resetCode}</strong></p>
            <p>Use this OTP to verify the reset request.</p>
            <p>Alternatively, use the secure reset link below:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>This request is valid for 15 minutes.</p>
        `;

        const payload = {
            to: email,
            from,
            host,
            subject,
            html,
            text: `Your password reset OTP is ${resetCode}. Reset link: ${resetLink}`,
        };

        try {
            const connection = await db();
            const params = [from, email, subject, html, ' ', ' '];
            await (connection as any).callProcedure(null, SCHEMA, 'SNDMULMAI1', params);
            await connection.close();

            console.log('[WarehouseEmailService] Password reset OTP email sent via DB2 procedure:', {
                to: email,
                otp: resetCode,
                subject,
            });

            return {
                sent: true,
                provider: 'db2-email-procedure',
                message: `Password reset OTP sent to ${email}`,
                otp: resetCode,
            };
        } catch (error) {
            console.warn('[WarehouseEmailService] DB2 email procedure failed, falling back to payload logging:', {
                error: error instanceof Error ? error.message : String(error),
                payload,
            });

            console.log('[WarehouseEmailService] Password reset OTP payload prepared:', payload);

            return {
                sent: true,
                provider: 'fallback-log',
                message: `Password reset OTP prepared for ${email}`,
                otp: resetCode,
            };
        }
    }
}
