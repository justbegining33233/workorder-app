import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' });
});

import { Page } from '@playwright/test';

async function uiLogin(page: Page, username: string, password: string, expectedPath: string) {
  await page.fill('input[placeholder="Enter your username"]', username);
  await page.fill('input[placeholder="••••••••"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }),
    page.click('text=Sign In'),
  ]).catch(() => {});

  // Check for token in localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  // Expect to be on expected path or to contain expected element
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

// Quick smoke: check live updates indicator exists on a dashboard where applicable
test('live updates connect after login (shop)', async ({ page }) => {
  await uiLogin(page, 'ras', 'password123', '/shop/admin');
  const live = await page.locator('text=Live Updates').first();
  await expect(live).toBeVisible({ timeout: 10000 });
});
