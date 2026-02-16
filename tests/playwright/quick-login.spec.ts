import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' });
});

async function uiLogin(page, username: string, password: string, expectedPath: string) {
  await page.fill('input[placeholder="Enter your username"]', username);
  await page.fill('input[placeholder="••••••••"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
    page.click('form.sos-form button[type=submit]'),
  ]).catch(() => {});

  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  if (expectedPath) {
    await expect(page).toHaveURL(new RegExp(expectedPath));
  }
}

test('admin login redirects to admin home', async ({ page }) => {
  await uiLogin(page, 'admin1006', '10062001', '/admin/home');
});

test('shop login redirects to shop admin', async ({ page }) => {
  await uiLogin(page, 'ras', 'password123', '/shop/admin');
});

test('tech login redirects to tech or manager home', async ({ page }) => {
  await uiLogin(page, 'man1@gmail.com', 'password123', '/(tech|manager)');
});

test('live updates connect after login (shop home)', async ({ page }) => {
  await uiLogin(page, 'ras', 'password123', '/shop/admin');

  // navigate to shop home where RealTimeWorkOrders is rendered
  await page.goto(`${BASE}/shop/home`, { waitUntil: 'networkidle' });
  const live = page.locator('text=Live Updates').first();
  await expect(live).toBeVisible({ timeout: 10000 });
});
