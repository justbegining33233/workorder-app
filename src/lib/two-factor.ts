/**
 * two-factor.ts
 * TOTP-based 2FA utilities using speakeasy.
 * State is persisted in the Shop DB row (twoFactorEnabled, twoFactorSecret).
 * These helpers work on secrets directly; routes handle DB read/write.
 */
import speakeasy from 'speakeasy';

export interface TotpSecret {
  base32: string;
  otpauthUrl: string;
}

/** Generate a new TOTP secret for a shop */
export function generateTotpSecret(shopEmail: string): TotpSecret {
  const secret = speakeasy.generateSecret({
    name: `FixTray (${shopEmail})`,
    issuer: 'FixTray',
    length: 20,
  });
  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  };
}

/** Verify a TOTP token against a stored base32 secret */
export function verifyTotpToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: token.replace(/\s/g, ''),
    window: 1, // Allow ±30s clock drift
  });
}

// ─── Legacy in-memory stubs (kept for backward compat, no longer authoritative) ───

const twoFactorStore = new Map<string, boolean>();
const otpStore = new Map<string, { code: string; expiresAt: number }>();

import crypto from 'crypto';

export function generateOTP(userId: string): string {
  const code = String(crypto.randomInt(100000, 999999));
  otpStore.set(userId, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
  return code;
}

export function verifyOTP(userId: string, code: string): boolean {
  const entry = otpStore.get(userId);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { otpStore.delete(userId); return false; }
  if (entry.code !== code) return false;
  otpStore.delete(userId);
  return true;
}

export function is2FAEnabled(userId: string): boolean { return twoFactorStore.get(userId) === true; }
export function enable2FA(userId: string): void { twoFactorStore.set(userId, true); }
export function disable2FA(userId: string): void { twoFactorStore.set(userId, false); otpStore.delete(userId); }

