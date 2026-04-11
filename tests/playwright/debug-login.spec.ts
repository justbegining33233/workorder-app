import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test('debug admin login network', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('request', (req) => {
    console.log('REQUEST', req.method(), req.url());
  });
  page.on('response', async (res) => {
    try {
      const body = await res.text();
      console.log('RESPONSE', res.url(), res.status(), body.substring(0, 200));
    } catch (e) { console.error('Error reading response body', e); }
  });

  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' });
  
  // Login via API directly
  const loginResponse = await page.request.post(`${BASE}/api/auth/admin`, {
    data: { username: 'admin1006', password: '10062001' }
  });
  const loginData = await loginResponse.json();
  console.log('LOGIN RESPONSE:', loginData);
  
  // Set token in localStorage
  await page.evaluate((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userName', 'admin1006');
    localStorage.setItem('userId', data.id);
  }, { token: loginData.accessToken, id: loginData.id });
  
  // Navigate to admin dashboard
  await page.goto(`${BASE}/admin/home`, { waitUntil: 'networkidle' });
  
  const currentUrl = page.url();
  console.log('CURRENT URL:', currentUrl);
  
  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log('TOKEN:', token);
  
  const bodyText = await page.locator('body').textContent();
  console.log('BODY TEXT:', bodyText?.substring(0, 1000));
  
  // Check if admin dashboard loaded
  const hasAdminContent = bodyText?.includes('Admin Dashboard') || bodyText?.includes('System Control Center');
  console.log('HAS ADMIN CONTENT:', hasAdminContent);
  
  expect(currentUrl).toContain('/admin');
  expect(token).not.toBeNull();
});