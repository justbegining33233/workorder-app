import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock all external dependencies
jest.mock('@/lib/prisma', () => ({
  default: {
    workOrder: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/csrf', () => ({
  validateCsrf: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => jest.fn()),
  rateLimitConfigs: {
    api: {},
  },
}));

jest.mock('@/lib/emailService', () => ({
  sendWorkOrderCreatedEmail: jest.fn(),
}));

jest.mock('@/lib/sanitize', () => ({
  sanitizeObject: jest.fn((obj) => obj),
}));

// Import after mocking
import { NextRequest } from 'next/server';
import { GET as getWorkOrders, POST as createWorkOrder } from '../src/app/api/workorders/route';
import prisma from '../src/lib/prisma';
import { requireAuth } from '../src/lib/middleware';
import { validateCsrf } from '../src/lib/csrf';
import { rateLimit } from '../src/lib/rate-limit';
import { sendWorkOrderCreatedEmail } from '../src/lib/emailService';
import { sanitizeObject } from '../src/lib/sanitize';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockValidateCsrf = validateCsrf as jest.MockedFunction<typeof validateCsrf>;
const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>;
const mockSendEmail = sendWorkOrderCreatedEmail as jest.MockedFunction<typeof sendWorkOrderCreatedEmail>;
const mockSanitizeObject = sanitizeObject as jest.MockedFunction<typeof sanitizeObject>;

describe('Work Orders API Integration Tests', () => {
  const mockCustomerAuth = {
    id: 'customer-123',
    email: 'customer@example.com',
    role: 'customer' as const,
  };

  const mockShopAuth = {
    id: 'shop-456',
    email: 'shop@example.com',
    role: 'shop' as const,
  };

  const mockWorkOrder = {
    id: 'wo-123',
    customerId: 'customer-123',
    shopId: 'shop-456',
    vehicleType: 'truck',
    serviceLocation: 'in-shop',
    issueDescription: 'Engine making strange noise',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@example.com',
      phone: '+1234567890',
    },
    shop: {
      id: 'shop-456',
      shopName: 'Test Shop',
      phone: '+0987654321',
    },
    assignedTo: null,
    repairs: ['Oil change', 'Filter replacement'],
    maintenance: [],
    partsMaterials: [],
    pictures: [],
    location: null,
    estimate: null,
    techLabor: null,
    partsUsed: null,
    workPhotos: [],
    completion: null,
  };

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockRateLimit.mockReturnValue(jest.fn().mockResolvedValue(null));
    mockSendEmail.mockResolvedValue(undefined);
    mockSanitizeObject.mockImplementation((obj) => obj);
  });

  describe('GET /api/workorders', () => {
    it('should return work orders for authenticated customer', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockPrisma.workOrder.count.mockResolvedValue(1);
      mockPrisma.workOrder.findMany.mockResolvedValue([mockWorkOrder]);

      const request = new NextRequest('http://localhost:3000/api/workorders?page=1&limit=20');

      const response = await getWorkOrders(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.workOrders).toHaveLength(1);
      expect(responseData.workOrders[0].id).toBe('wo-123');
      expect(responseData.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
      });

      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should return work orders for authenticated shop', async () => {
      mockRequireAuth.mockReturnValue(mockShopAuth);
      mockPrisma.workOrder.count.mockResolvedValue(2);
      mockPrisma.workOrder.findMany.mockResolvedValue([mockWorkOrder, { ...mockWorkOrder, id: 'wo-124' }]);

      const request = new NextRequest('http://localhost:3000/api/workorders?page=1&limit=10');

      const response = await getWorkOrders(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.workOrders).toHaveLength(2);
      expect(responseData.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        pages: 1,
      });

      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith({
        where: { shopId: 'shop-456' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by status', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockPrisma.workOrder.count.mockResolvedValue(1);
      mockPrisma.workOrder.findMany.mockResolvedValue([mockWorkOrder]);

      const request = new NextRequest('http://localhost:3000/api/workorders?status=pending');

      const response = await getWorkOrders(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
          status: 'pending'
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should search work orders', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockPrisma.workOrder.count.mockResolvedValue(1);
      mockPrisma.workOrder.findMany.mockResolvedValue([mockWorkOrder]);

      const request = new NextRequest('http://localhost:3000/api/workorders?search=engine');

      const response = await getWorkOrders(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
          OR: [
            { id: { contains: 'engine', mode: 'insensitive' } },
            { issueDescription: { contains: 'engine', mode: 'insensitive' } },
            { vehicleType: { contains: 'engine', mode: 'insensitive' } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle sorting', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockPrisma.workOrder.count.mockResolvedValue(1);
      mockPrisma.workOrder.findMany.mockResolvedValue([mockWorkOrder]);

      const request = new NextRequest('http://localhost:3000/api/workorders?sortBy=status&sortOrder=asc');

      const response = await getWorkOrders(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        include: expect.any(Object),
        orderBy: { status: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should validate pagination parameters', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);

      const request = new NextRequest('http://localhost:3000/api/workorders?page=0&limit=150');

      const response = await getWorkOrders(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Invalid');
    });

    it('should reject unauthenticated requests', async () => {
      mockRequireAuth.mockReturnValue(new Response('Unauthorized', { status: 401 }));

      const request = new NextRequest('http://localhost:3000/api/workorders');

      const response = await getWorkOrders(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockPrisma.workOrder.count.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/workorders');

      const response = await getWorkOrders(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to fetch work orders');
    });
  });

  describe('POST /api/workorders', () => {
    it('should create work order for authenticated customer', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockValidateCsrf.mockResolvedValue(true);
      mockPrisma.workOrder.create.mockResolvedValue(mockWorkOrder);
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-123',
        customerId: 'customer-123',
        type: 'workorder',
        title: 'Work Order Created',
        message: 'Your work order wo-123 has been created successfully',
        workOrderId: 'wo-123',
        deliveryMethod: 'in-app',
        createdAt: new Date(),
        readAt: null,
      });

      const requestBody = {
        shopId: 'shop-456',
        vehicleType: 'truck',
        serviceLocationType: 'in-shop',
        issueDescription: 'Engine making strange noise',
        services: {
          repairs: ['Oil change', 'Filter replacement'],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/workorders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await createWorkOrder(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.id).toBe('wo-123');
      expect(responseData.customerId).toBe('customer-123');
      expect(responseData.shopId).toBe('shop-456');

      expect(mockPrisma.workOrder.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-123',
          shopId: 'shop-456',
          vehicleType: 'truck',
          serviceLocation: 'in-shop',
          repairs: ['Oil change', 'Filter replacement'],
          maintenance: [],
          partsMaterials: undefined,
          issueDescription: 'Engine making strange noise',
          pictures: undefined,
          vinPhoto: undefined,
          location: undefined,
          status: 'pending',
        },
        include: {
          customer: true,
          shop: true,
        },
      });

      expect(mockSendEmail).toHaveBeenCalledWith('customer@example.com', 'wo-123');
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should reject non-customer roles', async () => {
      mockRequireAuth.mockReturnValue(mockShopAuth);

      const requestBody = {
        shopId: 'shop-456',
        vehicleType: 'truck',
        issueDescription: 'Engine making strange noise',
      };

      const request = new NextRequest('http://localhost:3000/api/workorders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await createWorkOrder(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Only customers can create work orders');
    });

    it('should validate CSRF for cookie-based auth', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockValidateCsrf.mockResolvedValue(false);

      const requestBody = {
        shopId: 'shop-456',
        vehicleType: 'truck',
        issueDescription: 'Engine making strange noise',
      };

      const request = new NextRequest('http://localhost:3000/api/workorders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
          // No Authorization header = cookie-based auth
        },
      });

      const response = await createWorkOrder(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('CSRF validation failed');
    });

    it('should handle rate limiting', async () => {
      const rateLimitResponse = new Response('Rate limited', { status: 429 });
      mockRateLimit.mockReturnValue(jest.fn().mockResolvedValue(rateLimitResponse));
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockValidateCsrf.mockResolvedValue(true);

      const requestBody = {
        shopId: 'shop-456',
        vehicleType: 'truck',
        issueDescription: 'Engine making strange noise',
      };

      const request = new NextRequest('http://localhost:3000/api/workorders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await createWorkOrder(request);

      expect(response.status).toBe(429);
    });

    it('should handle creation errors gracefully', async () => {
      mockRequireAuth.mockReturnValue(mockCustomerAuth);
      mockValidateCsrf.mockResolvedValue(true);
      mockPrisma.workOrder.create.mockRejectedValue(new Error('Database constraint violation'));

      const requestBody = {
        shopId: 'shop-456',
        vehicleType: 'truck',
        issueDescription: 'Engine making strange noise',
      };

      const request = new NextRequest('http://localhost:3000/api/workorders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await createWorkOrder(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to create work order');
    });
  });
});