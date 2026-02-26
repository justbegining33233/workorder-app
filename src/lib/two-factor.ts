import crypto from 'crypto';

// In-memory store: userId → 2FA enabled state
// Resets on server restart — integrate with DB for persistence
const twoFactorStore = new Map<string, boolean>();

// Temp OTP store: userId → { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

/** Generate a 6-digit OTP and store it for 10 minutes */
export function generateOTP(userId: string): string {
  const code = String(crypto.randomInt(100000, 999999));
  otpStore.set(userId, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  return code;
}

/** Verify a submitted OTP code for a user. Clears the OTP on success. */
export function verifyOTP(userId: string, code: string): boolean {
  const entry = otpStore.get(userId);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(userId);
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(userId);
  return true;
}

/** Check if 2FA is enabled for a user */
export function is2FAEnabled(userId: string): boolean {
  return twoFactorStore.get(userId) === true;
}

/** Enable 2FA for a user */
export function enable2FA(userId: string): void {
  twoFactorStore.set(userId, true);
}

/** Disable 2FA for a user */
export function disable2FA(userId: string): void {
  twoFactorStore.set(userId, false);
  otpStore.delete(userId);
}
