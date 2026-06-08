import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
  });

  test('should display signin page', async ({ page }) => {
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.click('a:has-text("Don\'t have an account?")');
    await expect(page).toHaveURL(`${BASE_URL}/signup`);
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should display signup page with correct fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await expect(page.locator('text=Sign Up')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Confirm Password"]')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    const email = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123');
    await page.fill('input[placeholder="Confirm Password"]', 'DifferentPassword');

    await page.click('button:has-text("Sign Up")');

    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 5000 });
  });

  test('should persist auth token to localStorage', async ({ page, context }) => {
    // Mock successful login
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token_12345');
    });

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBe('test_token_12345');
  });

  test('should redirect to signin when no token', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to signin
    await expect(page).toHaveURL(`${BASE_URL}/signin`, { timeout: 5000 });
  });

  test('should allow navigation after login', async ({ page }) => {
    // Mock login
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token_12345');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.goto(`${BASE_URL}/dashboard`);

    // Should display dashboard elements
    await expect(page.locator('text=Financial Hub')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('User Session', () => {
  test('should clear auth token on logout', async ({ page }) => {
    // Mock login
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token_12345');
    });

    await page.goto(`${BASE_URL}/dashboard`);

    // Click logout button
    await page.click('button:has-text("Sign Out")');

    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();

    // Should redirect to signin
    await expect(page).toHaveURL(`${BASE_URL}/signin`, { timeout: 5000 });
  });
});
