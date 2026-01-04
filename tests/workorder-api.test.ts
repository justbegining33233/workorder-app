import { describe, it, expect } from '@jest/globals';
import fetch from 'node-fetch';

describe('WorkOrder API', () => {
  it('should return paginated work orders for authenticated user', async () => {
    // Replace with actual test user token and endpoint
    const res = await fetch('http://localhost:3000/api/workorders?page=1&limit=2', {
      headers: { Authorization: 'Bearer TEST_TOKEN' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.workOrders)).toBe(true);
    expect(data.pagination).toBeDefined();
  });

  it('should not allow unauthenticated access', async () => {
    const res = await fetch('http://localhost:3000/api/workorders');
    expect(res.status).toBe(401);
  });
});
