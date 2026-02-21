import crypto from 'crypto';

export function generateNumericOTP(digits = 6) {
  const max = Math.pow(10, digits);
  const num = Math.floor(Math.random() * max).toString().padStart(digits, '0');
  return num;
}

export function generateTokenHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashTokenSha256(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
