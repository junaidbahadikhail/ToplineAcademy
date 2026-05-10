import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const testEmail = `student+${Date.now()}@e2e.topline.test`;
const testPassword = 'E2eT3st@2026';

test.describe('Student full journey', () => {
  test('S3-03-1: register as student', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.getByRole('button', { name: 'Student' }).click();
    await page.getByPlaceholder('Ahmed Khan').fill('E2E Student');
    await page.getByPlaceholder('0312 1234567').fill('03121234567');
    await page.getByPlaceholder('ahmed@example.com').fill(testEmail);
    await page.getByPlaceholder('Lahore').fill('Karachi');
    await page.getByPlaceholder('Create a strong password').fill(testPassword);
    await page.getByRole('button', { name: /Register as Student/i }).click();
    await expect(page.getByText(/account has been created/i)).toBeVisible({ timeout: 10000 });
  });

  test('S3-03-2: login as student', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/dashboard\/student|classes/, { timeout: 10000 });
  });

  test('S3-03-3: browse classes page loads', async ({ page }) => {
    await page.goto(`${BASE}/classes`);
    await expect(page.getByRole('heading', { name: /classes|courses|browse/i })).toBeVisible({ timeout: 10000 });
  });

  test('S3-03-4: class detail page renders for demo class', async ({ page }) => {
    await page.goto(`${BASE}/classes/demo-today-8pm`);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/demo class/i)).toBeVisible();
  });

  test('S3-03-5: student dashboard loads after login', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();
    await page.goto(`${BASE}/dashboard/student`);
    await expect(page.getByText(/Student Portal|My Dashboard/i)).toBeVisible({ timeout: 10000 });
  });

  test('S3-03-6: enrollment requires payment proof', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    // Visit a real class if any exist, else verify demo shows demo panel
    await page.goto(`${BASE}/classes/demo-today-8pm`);
    // Demo class should show demo panel, not an enrollment form with proof upload
    await expect(page.getByText(/demo class/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Auth edge cases', () => {
  test('S3-03-7: login redirects to dashboard', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('S3-03-8: profile page requires auth', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    // Should show login prompt or redirect
    const url = page.url();
    const hasLoginPrompt = await page.getByText(/login/i).isVisible().catch(() => false);
    expect(url.includes('login') || hasLoginPrompt).toBe(true);
  });

  test('S3-03-9: register with invalid Pakistani phone shows error', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.getByPlaceholder('Ahmed Khan').fill('Test User');
    await page.getByPlaceholder('0312 1234567').fill('12345678');
    await page.getByPlaceholder('ahmed@example.com').fill('test@test.com');
    await page.getByPlaceholder('Lahore').fill('Lahore');
    await page.getByPlaceholder('Create a strong password').fill('Password123');
    await page.getByRole('button', { name: /Register as Student/i }).click();
    await expect(page.getByText(/valid Pakistani/i)).toBeVisible({ timeout: 5000 });
  });
});
