import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock the database and external services for integration tests
jest.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  getClientIP: jest.fn(),
  resetRateLimit: jest.fn(),
}));

jest.mock('@/lib/csrf', () => ({
  generateCsrfToken: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  generateAccessToken: jest.fn(),
  generateRandomToken: jest.fn(),
  refreshExpiryDate: jest.fn(),
}));

// Import after mocking
import { NextRequest } from 'next/server';
import { POST as customerLogin } from '../src/app/api/auth/customer/route';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcrypt';
import { checkRateLimit, getClientIP, resetRateLimit } from '../src/lib/rateLimit';
import { generateCsrfToken } from '../src/lib/csrf';
import { generateAccessToken, generateRandomToken, refreshExpiryDate } from '../src/lib/auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;
const mockGetClientIP = getClientIP as jest.MockedFunction<typeof getClientIP>;
const mockResetRateLimit = resetRateLimit as jest.MockedFunction<typeof resetRateLimit>;
const mockGenerateCsrfToken = generateCsrfToken as jest.MockedFunction<typeof generateCsrfToken>;
const mockGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>;
const mockGenerateRandomToken = generateRandomToken as jest.MockedFunction<typeof generateRandomToken>;
const mockRefreshExpiryDate = refreshExpiryDate as jest.MockedFunction<typeof refreshExpiryDate>;

describe('Authentication API Integration Tests', () => {
  beforeAll(() => {
    // Set up test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    // Clean up
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up default mock implementations
    mockGetClientIP.mockReturnValue('127.0.0.1');
    mockRateLimit.mockResolvedValue({
      success: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
    });
    mockGenerateAccessToken.mockReturnValue('mock-access-token');
    mockGenerateRandomToken.mockReturnValue('mock-refresh-token');
    mockRefreshExpiryDate.mockReturnValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    mockGenerateCsrfToken.mockReturnValue('mock-csrf-token');
    mockBcrypt.compare.mockResolvedValue(true);
    mockBcrypt.hash.mockResolvedValue('hashed-refresh-token');
  });

  describe('POST /api/auth/customer', () => {
    it('should successfully authenticate valid customer credentials', async () => {
      // Mock database response
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
      });

      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'refresh-123',
        tokenHash: 'hashed-refresh-token',
        adminId: null,
        metadata: JSON.stringify({ customerId: 'customer-123' }),
        expiresAt: new Date(),
      });

      // Create mock request
      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'test-agent',
        },
      });

      const response = await customerLogin(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        id: 'customer-123',
        username: 'test@example.com',
        fullName: 'John Doe',
        email: 'test@example.com',
        role: 'customer',
        accessToken: 'mock-access-token',
        emailVerified: true,
      });

      // Verify mocks were called correctly
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: 'test@example.com' },
            { username: 'test@example.com' },
          ],
        },
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockRateLimit).toHaveBeenCalledWith('customer_login:127.0.0.1:test@example.com');
      expect(mockResetRateLimit).toHaveBeenCalledWith('customer_login:127.0.0.1:test@example.com');
    });

    it('should reject invalid email format', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await customerLogin(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toBeDefined();
    });

    it('should reject non-existent customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await customerLogin(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid credentials');
    });

    it('should reject incorrect password', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
      });

      mockBcrypt.compare.mockResolvedValue(false);

      const requestBody = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await customerLogin(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid credentials');
    });

    it('should reject unverified email accounts', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await customerLogin(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toContain('verify your email address');
    });

    it('should enforce rate limiting', async () => {
      mockRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        message: 'Too many requests. Please try again in 60 seconds.',
      });

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await customerLogin(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error).toBe('Too many requests. Please try again in 60 seconds.');
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should handle server errors gracefully', async () => {
      mockPrisma.customer.findFirst.mockRejectedValue(new Error('Database connection failed'));

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await customerLogin(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Login failed');
    });

    it('should set appropriate cookies on successful login', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
      });

      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'refresh-123',
        tokenHash: 'hashed-refresh-token',
        adminId: null,
        metadata: JSON.stringify({ customerId: 'customer-123' }),
        expiresAt: new Date(),
      });

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'test-agent',
        },
      });

      const response = await customerLogin(request);

      expect(response.status).toBe(200);

      // Check that cookies are set
      const cookies = response.cookies;
      expect(cookies.get('refresh_id')).toBeDefined();
      expect(cookies.get('refresh_sig')).toBeDefined();
      expect(cookies.get('csrf_token')).toBeDefined();
      expect(cookies.get('sos_auth')).toBeDefined();
    });
  });
});