/**
 * Rate Limiting Utility
 * Version: 0.0.2
 * 
 * Simple in-memory rate limiter for authentication endpoints
 * Prevents brute force attacks on login routes
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Usually IP address or email
 * @param options - Rate limit configuration
 * @returns Rate limit result with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 15 * 60 * 1000 } // 5 requests per 15 minutes default
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  // First request or expired window
  if (!existing || now > existing.resetTime) {
    const resetTime = now + options.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetTime,
    };
  }

  // Within window - check if limit exceeded
  if (existing.count >= options.maxRequests) {
    const remainingSeconds = Math.ceil((existing.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: existing.resetTime,
      message: `Too many login attempts. Please try again in ${remainingSeconds} seconds.`,
    };
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(identifier, existing);

  return {
    success: true,
    remaining: options.maxRequests - existing.count,
    resetTime: existing.resetTime,
  };
}

/**
 * Get client IP address from request
 * Handles proxies and load balancers
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Reset rate limit for a specific identifier
 * Useful after successful login or for testing
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): RateLimitResult | null {
  const entry = rateLimitStore.get(identifier);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now > entry.resetTime) {
    rateLimitStore.delete(identifier);
    return null;
  }

  return {
    success: entry.count < 5,
    remaining: Math.max(0, 5 - entry.count),
    resetTime: entry.resetTime,
  };
}
