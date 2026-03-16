import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Authenticate a request using an API key (Bearer token starting with "ft_live_").
 * Returns the shopId and scopes if valid, or null if not an API key request.
 */
export async function authenticateApiKey(request: NextRequest): Promise<{ shopId: string; scopes: string[] } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ft_live_')) return null;

  const rawKey = authHeader.substring(7); // Remove "Bearer "
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  try {
    const prisma = (await import('@/lib/prisma')).default;
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });

    if (!apiKey || apiKey.revoked) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update last used timestamp (fire-and-forget)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return {
      shopId: apiKey.shopId,
      scopes: apiKey.scopes.split(',').map(s => s.trim()),
    };
  } catch {
    return null;
  }
}

/**
 * Check if an API key has the required scope.
 */
export function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes('*') || scopes.includes(required) || scopes.includes('read');
}
