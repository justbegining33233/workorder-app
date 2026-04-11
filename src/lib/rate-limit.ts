// Rate limiting utility for API endpoints
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL is set (production),
// falls back to in-memory store for local development.
import { NextRequest, NextResponse } from 'next/server';

// ─── Upstash Redis client (lazy-init) ────────────────────────────────────────
let redisClient: any | null = null;
let redisInitAttempted = false;

async function getRedis() {
  if (redisClient) return redisClient;
  if (redisInitAttempted) return null; // already tried and failed
  redisInitAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch {
    return null;
  }
}

// ─── In-memory fallback (dev / missing Redis) ────────────────────────────────
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const memoryStore: RateLimitStore = {};

// Evict expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(memoryStore)) {
      if (memoryStore[key].resetTime < now) delete memoryStore[key];
    }
  }, 5 * 60 * 1000);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 15,
    message: 'Too many authentication attempts, please try again later',
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later',
  },
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Rate limit exceeded, please slow down',
  },
};

export function rateLimit(config: RateLimitConfig) {
  const windowSec = Math.ceil(config.windowMs / 1000);

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    const pathname = new URL(request.url).pathname;
    const key = `rl:${ip}:${pathname}`;

    // ── Try Redis first ────────────────────────────────────────────────────
    const redis = await getRedis();
    if (redis) {
      try {
        const count = await redis.incr(key);
        if (count === 1) {
          // First hit — set expiry for the window
          await redis.expire(key, windowSec);
        }
        if (count > config.maxRequests) {
          const ttl = await redis.ttl(key);
          return NextResponse.json(
            { error: config.message || 'Rate limit exceeded' },
            {
              status: 429,
              headers: {
                'Retry-After': String(ttl > 0 ? ttl : windowSec),
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
              },
            },
          );
        }
        return null; // allow
      } catch (err) {
        console.error('[rate-limit] Redis error, falling through to memory:', err);
        // fall through to in-memory
      }
    }

    // ── In-memory fallback ─────────────────────────────────────────────────
    const now = Date.now();
    const record = memoryStore[key];

    if (!record || record.resetTime < now) {
      memoryStore[key] = { count: 1, resetTime: now + config.windowMs };
      return null;
    }

    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return NextResponse.json(
        { error: config.message || 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString(),
          },
        },
      );
    }

    record.count++;
    return null;
  };
}

// Helper to add rate limit headers to successful responses
export function addRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  currentCount: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', (config.maxRequests - currentCount).toString());
  return response;
}
