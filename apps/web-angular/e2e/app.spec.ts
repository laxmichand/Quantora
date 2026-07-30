import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should load the app', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Auth Flow', () => {
  const uniqueEmail = `e2e-${Date.now()}@test.com`;

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Quantora')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('text=Create Account')).toBeVisible();
  });

  test('should show validation error on empty login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-msg')).toContainText('Please fill in all fields');
  });

  test('should show validation error on empty register', async ({ page }) => {
    await page.goto('/auth/register');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-msg')).toContainText('Please fill in all fields');
  });

  test('should show password mismatch on register', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'E2E User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Test1234');
    await page.fill('input[name="confirmPassword"]', 'Different123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-msg')).toContainText('Passwords do not match');
  });
});

test.describe('Sidebar Navigation', () => {
  test('should show sidebar with nav items', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.nav-item').count()).toBeGreaterThanOrEqual(5);
  });
});
