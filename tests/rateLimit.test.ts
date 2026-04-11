import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  checkRateLimit,
  getClientIP,
  resetRateLimit,
  getRateLimitStatus,
  type RateLimitOptions,
  type RateLimitResult
} from '../src/lib/rateLimit';

describe('Rate Limiting Module', () => {
  const testIdentifier = 'test-user-123';
  const defaultOptions: RateLimitOptions = {
    maxRequests: 5,
    windowMs: 60 * 1000 // 1 minute
  };

  beforeEach(async () => {
    // Reset rate limit for clean tests
    await resetRateLimit(testIdentifier);
  });

  afterEach(async () => {
    // Clean up after each test
    await resetRateLimit(testIdentifier);
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(testIdentifier, defaultOptions);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(defaultOptions.maxRequests - i - 1);
        expect(result.resetTime).toBeGreaterThan(Date.now());
      }
    });

    it('should block requests over limit', async () => {
      // Use up all requests
      for (let i = 0; i < defaultOptions.maxRequests; i++) {
        await checkRateLimit(testIdentifier, defaultOptions);
      }

      // Next request should be blocked
      const result = await checkRateLimit(testIdentifier, defaultOptions);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('Too many requests');
    });

    it('should reset after window expires', async () => {
      // Use up all requests
      for (let i = 0; i < defaultOptions.maxRequests; i++) {
        await checkRateLimit(testIdentifier, defaultOptions);
      }

      // Mock time to be after window expiry
      const originalNow = Date.now;
      const futureTime = Date.now() + defaultOptions.windowMs + 1000;
      (global as any).Date.now = jest.fn(() => futureTime);

      const result = await checkRateLimit(testIdentifier, defaultOptions);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(defaultOptions.maxRequests - 1);

      // Restore original Date.now
      (global as any).Date.now = originalNow;
    });

    it('should handle custom options', async () => {
      const customOptions: RateLimitOptions = {
        maxRequests: 3,
        windowMs: 30 * 1000 // 30 seconds
      };

      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(`${testIdentifier}-custom`, customOptions);
        expect(result.success).toBe(true);
      }

      const result = await checkRateLimit(`${testIdentifier}-custom`, customOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.100, 10.0.0.1';
            return null;
          })
        }
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe('192.168.1.100');
    });

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-real-ip') return '10.0.0.50';
            return null;
          })
        }
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe('10.0.0.50');
    });

    it('should extract IP from cf-connecting-ip header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'cf-connecting-ip') return '203.0.113.1';
            return null;
          })
        }
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe('203.0.113.1');
    });

    it('should return unknown when no IP headers present', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe('unknown');
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit counter', async () => {
      // Use up some requests
      for (let i = 0; i < 3; i++) {
        await checkRateLimit(testIdentifier, defaultOptions);
      }

      // Reset the limit
      await resetRateLimit(testIdentifier);

      // Should be able to make requests again
      const result = await checkRateLimit(testIdentifier, defaultOptions);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(defaultOptions.maxRequests - 1);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return null for unused identifier', async () => {
      const status = await getRateLimitStatus('unused-identifier');
      expect(status).toBeNull();
    });

    it('should return status for active rate limit', async () => {
      // Make some requests
      for (let i = 0; i < 2; i++) {
        await checkRateLimit(testIdentifier, defaultOptions);
      }

      const status = await getRateLimitStatus(testIdentifier);
      expect(status).not.toBeNull();
      expect(status?.success).toBe(true);
      expect(status?.remaining).toBe(3); // 5 - 2 = 3
      expect(status?.resetTime).toBeGreaterThan(Date.now());
    });

    it('should return blocked status when over limit', async () => {
      // Use up all requests
      for (let i = 0; i < defaultOptions.maxRequests; i++) {
        await checkRateLimit(testIdentifier, defaultOptions);
      }

      const status = await getRateLimitStatus(testIdentifier);
      expect(status).not.toBeNull();
      expect(status?.success).toBe(false);
      expect(status?.remaining).toBe(0);
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent requests correctly', async () => {
      const promises = [];
      const concurrentRequests = 10;

      // Make many concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(checkRateLimit(`${testIdentifier}-concurrent`, defaultOptions));
      }

      const results = await Promise.all(promises);

      // Count successful and failed requests
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      expect(successful).toBe(defaultOptions.maxRequests);
      expect(failed).toBe(concurrentRequests - defaultOptions.maxRequests);
    });
  });
});