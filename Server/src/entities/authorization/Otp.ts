export interface PasswordResetOtp {
  resetOtpId: number;
  userId: number;
  otpHash: string;
  createdAt: Date;
  expiresAt: Date;
  attemptCount: number;
  status: 'PENDING' | 'CONSUMED' | 'INVALIDATED' | 'LOCKED';
  consumedAt: Date | null;
}
