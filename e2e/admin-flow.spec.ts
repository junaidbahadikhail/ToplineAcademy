import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// These tests require a seeded admin account. Set via env:
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@toplineacademy.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';

test.describe('Admin approval flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
  });

  test('S3-04-1: admin dashboard loads', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page.getByText(/Admin Dashboard/i)).toBeVisible({ timeout: 10000 });
  });

  test('S3-04-2: admin can see users tab', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8000 });
  });

  test('S3-04-3: admin can see enrollments tab', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /Enrollments/i }).click();
    // Either a table or empty state should appear
    const content = await page.locator('table, [class*="empty"]').first().isVisible({ timeout: 8000 });
    expect(content).toBe(true);
  });

  test('S3-04-4: admin can see classes tab and create class form', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: 'Classes' }).click();
    await page.getByRole('button', { name: /New class/i }).click();
    await expect(page.getByPlaceholder(/e.g. AI Fundamentals/i)).toBeVisible({ timeout: 5000 });
  });

  test('S3-04-5: health check panel shows database status', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page.getByText(/Service health/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Database/i)).toBeVisible();
  });

  test('S3-04-6: non-admin sees access denied', async ({ page }) => {
    // Log out first by clearing cookies
    await page.context().clearCookies();
    await page.goto(`${BASE}/admin`);
    // Either redirected to login or shows Access Denied
    const denied = await page.getByText(/Access Denied/i).isVisible({ timeout: 5000 }).catch(() => false);
    const loginPrompt = await page.getByText(/login/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(denied || loginPrompt).toBe(true);
  });
});
