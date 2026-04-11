import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateTempToken,
  generateRandomToken,
  verifyToken,
  refreshExpiryDate,
  authenticateRequest,
  requireRole,
  getAuthToken,
  type AuthUser
} from '../src/lib/auth';

describe('Authentication Module', () => {
  const testUser: AuthUser = {
    id: '123',
    email: 'test@example.com',
    role: 'customer',
    shopId: 'shop-123'
  };

  const testPassword = 'testPassword123!';

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const hashed = await hashPassword(testPassword);
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const hashed = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hashed = await hashPassword(testPassword);
      const isValid = await verifyPassword('wrongPassword', hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate access token', () => {
      const token = generateAccessToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate temporary token', () => {
      const token = generateTempToken(testUser, '5m');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate random token', () => {
      const token = generateRandomToken(32);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 hex chars per byte
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      const token = generateAccessToken(testUser);
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      const expiredToken = generateTempToken(testUser, '-1s');
      const decoded = verifyToken(expiredToken);
      expect(decoded).toBeNull();
    });
  });

  describe('Refresh Expiry', () => {
    it('should calculate refresh expiry date', () => {
      const expiryDate = refreshExpiryDate(7);
      const expectedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(expiryDate.getTime()).toBeCloseTo(expectedDate.getTime(), -1000); // Allow 1 second tolerance
    });

    it('should use default expiry days', () => {
      const expiryDate = refreshExpiryDate();
      const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      expect(expiryDate.getTime()).toBeCloseTo(expectedDate.getTime(), -1000);
    });
  });

  describe('Request Authentication', () => {
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {
          get: jest.fn(),
          cookie: ''
        },
        cookies: {
          get: jest.fn()
        }
      };
    });

    it('should extract token from Authorization header', () => {
      mockRequest.headers.get.mockReturnValue('Bearer test-token');
      const token = getAuthToken(mockRequest);
      expect(token).toBe('test-token');
    });

    it('should extract token from cookie', () => {
      mockRequest.cookies.get.mockReturnValue({ value: 'cookie-token' });
      const token = getAuthToken(mockRequest);
      expect(token).toBe('cookie-token');
    });

    it('should return null when no token present', () => {
      mockRequest.headers.get.mockReturnValue(null);
      mockRequest.cookies.get.mockReturnValue(null);
      const token = getAuthToken(mockRequest);
      expect(token).toBeNull();
    });

    it('should authenticate valid request', () => {
      const token = generateAccessToken(testUser);
      mockRequest.headers.get.mockReturnValue(`Bearer ${token}`);

      const user = authenticateRequest(mockRequest);
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe(testUser.email);
    });

    it('should return null for invalid request', () => {
      mockRequest.headers.get.mockReturnValue('Bearer invalid-token');
      const user = authenticateRequest(mockRequest);
      expect(user).toBeNull();
    });
  });

  describe('Role-based Access Control', () => {
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {
          get: jest.fn(),
          cookie: ''
        },
        cookies: {
          get: jest.fn()
        }
      };
    });

    it('should allow access for correct role', () => {
      const token = generateAccessToken({ ...testUser, role: 'admin' });
      mockRequest.headers.get.mockReturnValue(`Bearer ${token}`);

      const result = requireRole(mockRequest, ['admin', 'superadmin']);
      expect(result).toBeDefined();
      expect((result as AuthUser).role).toBe('admin');
    });

    it('should deny access for insufficient role', () => {
      const token = generateAccessToken(testUser); // customer role
      mockRequest.headers.get.mockReturnValue(`Bearer ${token}`);

      const result = requireRole(mockRequest, ['admin']);
      expect(result).toHaveProperty('status', 403);
      expect(result).toHaveProperty('json');
    });

    it('should deny access for unauthenticated request', () => {
      mockRequest.headers.get.mockReturnValue(null);
      const result = requireRole(mockRequest, ['admin']);
      expect(result).toHaveProperty('status', 401);
      expect(result).toHaveProperty('json');
    });
  });
});
