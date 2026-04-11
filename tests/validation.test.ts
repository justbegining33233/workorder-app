import { describe, it, expect } from '@jest/globals';
import {
  customerRegistrationSchema,
  customerLoginSchema,
  shopRegistrationSchema,
  workOrderCreateSchema,
  workOrderUpdateSchema,
  techCreateSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  inventoryCreateSchema,
  inventoryUpdateSchema,
  paymentIntentSchema,
  vehicleCreateSchema,
  estimateCreateSchema,
  validateRequest
} from '../src/lib/validation';

describe('Validation Schemas', () => {
  describe('Customer Validation', () => {
    describe('customerRegistrationSchema', () => {
      it('should validate valid customer registration', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          company: 'Test Company'
        };

        const result = customerRegistrationSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe(validData.email);
          expect(result.data.firstName).toBe(validData.firstName);
        }
      });

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        };

        const result = customerRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject short password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '123',
          firstName: 'John',
          lastName: 'Doe'
        };

        const result = customerRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject missing required fields', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password123'
          // Missing firstName and lastName
        };

        const result = customerRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('customerLoginSchema', () => {
      it('should validate valid login credentials', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const result = customerLoginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty email', () => {
        const invalidData = {
          email: '',
          password: 'password123'
        };

        const result = customerLoginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: ''
        };

        const result = customerLoginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Shop Validation', () => {
    describe('shopRegistrationSchema', () => {
      it('should validate valid shop registration', () => {
        const validData = {
          username: 'testshop',
          password: 'password123',
          shopName: 'Test Shop',
          ownerName: 'John Doe',
          email: 'shop@example.com',
          phone: '+1234567890',
          zipCode: '12345',
          address: '123 Main St',
          city: 'Test City',
          state: 'TS',
          shopType: 'diesel' as const
        };

        const result = shopRegistrationSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject short username', () => {
        const invalidData = {
          username: 'ab',
          password: 'password123',
          shopName: 'Test Shop',
          ownerName: 'John Doe',
          email: 'shop@example.com',
          phone: '+1234567890',
          zipCode: '12345'
        };

        const result = shopRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should validate all shop types', () => {
        const shopTypes = ['diesel', 'gas', 'small-engine', 'heavy-equipment', 'resurfacing', 'welding', 'tire', 'mixed'];

        shopTypes.forEach(type => {
          const validData = {
            username: 'testshop',
            password: 'password123',
            shopName: 'Test Shop',
            ownerName: 'John Doe',
            email: 'shop@example.com',
            phone: '+1234567890',
            zipCode: '12345',
            shopType: type as any
          };

          const result = shopRegistrationSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('Work Order Validation', () => {
    describe('workOrderCreateSchema', () => {
      it('should validate valid work order creation', () => {
        const validData = {
          customerId: 'customer-123',
          shopId: 'shop-456',
          vehicleId: 'vehicle-789',
          vehicleType: 'truck',
          serviceLocation: 'in-shop' as const,
          issueDescription: 'This is a detailed description of the issue that needs to be fixed.'
        };

        const result = workOrderCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject short description', () => {
        const invalidData = {
          customerId: 'customer-123',
          shopId: 'shop-456',
          vehicleType: 'truck',
          serviceLocation: 'in-shop' as const,
          issueDescription: 'Short'
        };

        const result = workOrderCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should validate service locations', () => {
        const validLocations = ['roadside', 'in-shop'];

        validLocations.forEach(location => {
          const validData = {
            customerId: 'customer-123',
            shopId: 'shop-456',
            vehicleType: 'truck',
            serviceLocation: location as any,
            issueDescription: 'This is a detailed description of the issue.'
          };

          const result = workOrderCreateSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('workOrderUpdateSchema', () => {
      it('should validate valid work order update', () => {
        const validData = {
          status: 'in-progress' as const,
          assignedTechId: 'tech-123',
          paymentStatus: 'paid' as const,
          totalCost: 299.99
        };

        const result = workOrderUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate all status values', () => {
        const validStatuses = ['pending', 'assigned', 'in-progress', 'waiting-estimate', 'waiting-for-payment', 'closed', 'denied-estimate'];

        validStatuses.forEach(status => {
          const validData = { status: status as any };
          const result = workOrderUpdateSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });

      it('should validate payment statuses', () => {
        const validStatuses = ['unpaid', 'pending', 'paid', 'refunded'];

        validStatuses.forEach(status => {
          const validData = { paymentStatus: status as any };
          const result = workOrderUpdateSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('Tech Validation', () => {
    describe('techCreateSchema', () => {
      it('should validate valid tech creation', () => {
        const validData = {
          email: 'tech@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1234567890',
          role: 'tech' as const,
          hourlyRate: 25.50
        };

        const result = techCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate tech roles', () => {
        const validRoles = ['tech', 'manager'];

        validRoles.forEach(role => {
          const validData = {
            email: 'tech@example.com',
            password: 'password123',
            firstName: 'Jane',
            lastName: 'Smith',
            role: role as any
          };

          const result = techCreateSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });

      it('should reject negative hourly rate', () => {
        const invalidData = {
          email: 'tech@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'tech' as const,
          hourlyRate: -10
        };

        const result = techCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Service Validation', () => {
    describe('serviceCreateSchema', () => {
      it('should validate valid service creation', () => {
        const validData = {
          shopId: 'shop-123',
          serviceName: 'Oil Change',
          category: 'diesel' as const,
          price: 49.99,
          duration: 60,
          description: 'Complete oil change service'
        };

        const result = serviceCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate service categories', () => {
        const validCategories = ['diesel', 'gas', 'small-engine', 'heavy-equipment', 'resurfacing', 'welding', 'tire'];

        validCategories.forEach(category => {
          const validData = {
            shopId: 'shop-123',
            serviceName: 'Test Service',
            category: category as any
          };

          const result = serviceCreateSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('Inventory Validation', () => {
    describe('inventoryCreateSchema', () => {
      it('should validate valid inventory creation', () => {
        const validData = {
          shopId: 'shop-123',
          type: 'part',
          name: 'Brake Pad Set',
          sku: 'BP-001',
          quantity: 50,
          price: 89.99,
          reorderPoint: 10,
          supplier: 'AutoParts Inc',
          notes: 'High quality brake pads'
        };

        const result = inventoryCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative quantity', () => {
        const invalidData = {
          shopId: 'shop-123',
          type: 'part',
          name: 'Brake Pad Set',
          quantity: -5,
          price: 89.99
        };

        const result = inventoryCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative price', () => {
        const invalidData = {
          shopId: 'shop-123',
          type: 'part',
          name: 'Brake Pad Set',
          quantity: 50,
          price: -10
        };

        const result = inventoryCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Payment Validation', () => {
    describe('paymentIntentSchema', () => {
      it('should validate valid payment intent', () => {
        const validData = {
          workOrderId: 'wo-123',
          amount: 299.99
        };

        const result = paymentIntentSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject zero amount', () => {
        const invalidData = {
          workOrderId: 'wo-123',
          amount: 0
        };

        const result = paymentIntentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative amount', () => {
        const invalidData = {
          workOrderId: 'wo-123',
          amount: -50
        };

        const result = paymentIntentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Vehicle Validation', () => {
    describe('vehicleCreateSchema', () => {
      it('should validate valid vehicle creation', () => {
        const validData = {
          customerId: 'customer-123',
          vehicleType: 'truck',
          make: 'Ford',
          model: 'F-150',
          year: 2020,
          vin: '1FTFW1ET5DFC12345',
          licensePlate: 'ABC-123'
        };

        const result = vehicleCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate year range', () => {
        const validYears = [1900, 2000, 2023, 2100];

        validYears.forEach(year => {
          const validData = {
            customerId: 'customer-123',
            vehicleType: 'truck',
            year
          };

          const result = vehicleCreateSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid year', () => {
        const invalidYears = [1899, 2101];

        invalidYears.forEach(year => {
          const invalidData = {
            customerId: 'customer-123',
            vehicleType: 'truck',
            year
          };

          const result = vehicleCreateSchema.safeParse(invalidData);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Estimate Validation', () => {
    describe('estimateCreateSchema', () => {
      it('should validate valid estimate creation', () => {
        const validData = {
          workOrderId: 'wo-123',
          lineItems: [
            {
              description: 'Oil change',
              quantity: 1,
              unitPrice: 49.99,
              total: 49.99
            },
            {
              description: 'Brake pads',
              quantity: 1,
              unitPrice: 89.99,
              total: 89.99
            }
          ],
          subtotal: 139.98,
          tax: 11.20,
          total: 151.18,
          notes: 'Estimate for maintenance work'
        };

        const result = estimateCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty line items', () => {
        const invalidData = {
          workOrderId: 'wo-123',
          lineItems: [],
          subtotal: 0,
          tax: 0,
          total: 0
        };

        const result = estimateCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateRequest Function', () => {
    it('should return success for valid data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await validateRequest(customerRegistrationSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(validData.email);
      }
    });

    it('should return errors for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: ''
      };

      const result = await validateRequest(customerRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.issues.length).toBeGreaterThan(0);
      }
    });
  });
});