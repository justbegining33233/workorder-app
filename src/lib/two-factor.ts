/**
 * two-factor.ts
 * TOTP-based 2FA utilities using speakeasy.
 * TOTP secrets are encrypted with AES-256-GCM before being stored in the DB.
 * Set TOTP_ENCRYPTION_KEY (32-byte hex) in your env vars.
 */
import speakeasy from 'speakeasy';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — recommended for GCM

function getEncryptionKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('TOTP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Add it to your env vars.');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a raw base32 TOTP secret for DB storage.
 * Returns a string of format: iv:authTag:ciphertext (all hex).
 */
export function encryptSecret(base32: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(base32, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a stored encrypted TOTP secret back to its raw base32 form.
 * Handles legacy unencrypted secrets (plain base32) gracefully during migration.
 */
export function decryptSecret(stored: string): string {
  // If it doesn't contain ':', it's a legacy plaintext secret — return as-is
  if (!stored.includes(':')) return stored;

  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted secret format');

  const [ivHex, tagHex, encHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

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

/** Verify a TOTP token against a raw (decrypted) base32 secret */
export function verifyTotpToken(rawBase32: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: rawBase32,
    encoding: 'base32',
    token: token.replace(/\s/g, ''),
    window: 1, // Allow ±30s clock drift
  });
}

// ─── Legacy in-memory stubs (kept for backward compat, no longer authoritative) ───

const twoFactorStore = new Map<string, boolean>();
const otpStore = new Map<string, { code: string; expiresAt: number }>();

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

