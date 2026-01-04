import crypto from 'crypto';
import prisma from './prisma';
import bcrypt from 'bcrypt';
import { NextRequest } from 'next/server';

export function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

export async function validateCsrf(request: NextRequest) {
  const header = request.headers.get('x-csrf-token') || '';
  // Support both new `refresh_id`+`refresh_sig` cookies and legacy `refresh_token` cookie
  let id = request.cookies.get('refresh_id')?.value || '';
  let raw = request.cookies.get('refresh_sig')?.value || '';
  if (!id || !raw) {
    const legacy = request.cookies.get('refresh_token')?.value || '';
    if (legacy) {
      const parts = legacy.split(':');
      id = parts[0] || '';
      raw = parts[1] || '';
    }
  }
  if (!header || !id || !raw) return false;
  const record = await (prisma as any).refreshToken.findUnique({ where: { id } });
  if (!record) return false;
  const matches = await bcrypt.compare(raw, record.tokenHash).catch(() => false);
  if (!matches) return false;
  const meta = record.metadata || {};
  return Boolean(meta.csrfToken && meta.csrfToken === header);
}

// Validate CSRF for public (unauthenticated) flows using double-submit cookie
export function validatePublicCsrf(request: NextRequest) {
  const header = request.headers.get('x-csrf-token') || '';
  const cookie = request.cookies.get('csrf_token')?.value || '';
  if (!header || !cookie) return false;
  return header === cookie;
}
