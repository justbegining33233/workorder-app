import { describe, it, expect } from '@jest/globals';
import fetch from 'node-fetch';

describe('WorkOrder E2E', () => {
  it('should create a new work order for a customer', async () => {
    // Replace with actual test user token and payload
    const payload = {
      shopId: 'test-shop-id',
      vehicleType: 'Sedan',
      issueDescription: { symptoms: 'Engine noise' },
    };
    const res = await fetch('http://localhost:3000/api/workorders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer TEST_CUSTOMER_TOKEN',
      },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.shopId).toBe(payload.shopId);
    expect(data.vehicleType).toBe(payload.vehicleType);
  });
});
