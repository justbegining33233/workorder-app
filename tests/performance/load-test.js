import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
    errors: ['rate<0.1'],             // Custom error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test scenarios
export default function () {
  // Health check
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  responseTime.add(healthResponse.timings.duration);

  // Login simulation (if auth is required)
  const loginPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword123',
  });

  const loginResponse = http.post(`${BASE_URL}/api/auth/customer`, loginPayload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(loginResponse, {
    'login response status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  responseTime.add(loginResponse.timings.duration);

  // Get work orders (requires auth in real scenario)
  const workOrdersResponse = http.get(`${BASE_URL}/api/workorders?page=1&limit=10`);
  check(workOrdersResponse, {
    'work orders response status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  responseTime.add(workOrdersResponse.timings.duration);

  // Simulate user think time
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Setup function - runs before the test starts
export function setup() {
  console.log('Starting performance test...');
  return {};
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('Performance test completed.');
}