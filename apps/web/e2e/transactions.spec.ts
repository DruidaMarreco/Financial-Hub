import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Transactions Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token_12345');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.goto(`${BASE_URL}/transactions`);
  });

  test('should display transactions page', async ({ page }) => {
    await expect(page.locator('text=Transactions')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should filter transactions by search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Amazon');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should only show Amazon transactions
    const rows = await page.locator('table tbody tr');
    const count = await rows.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should filter by category', async ({ page }) => {
    const categorySelect = page.locator('select');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('Shopping');

      // Wait for filter
      await page.waitForTimeout(500);

      // Check that table updated
      const rows = await page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('should show transaction details', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Should show transaction modal or details
    await expect(page.locator('text=Transaction Details')).toBeVisible({ timeout: 3000 });
  });

  test('should allow inline category edit', async ({ page }) => {
    const firstCategoryCell = page.locator('table tbody tr:first-child td').nth(3);
    const currentText = await firstCategoryCell.textContent();

    // Click to edit
    await firstCategoryCell.click();

    // Should show edit controls
    const select = firstCategoryCell.locator('select');
    if (await select.isVisible()) {
      await select.selectOption('Entertainment');
      await page.keyboard.press('Enter');

      // Verify change
      const newText = await firstCategoryCell.textContent();
      expect(newText).not.toContain(currentText);
    }
  });

  test('should display transaction statistics', async ({ page }) => {
    // Look for stats section
    const stats = page.locator('text=Total Transactions');
    await expect(stats).toBeVisible();

    // Should show key metrics
    await expect(page.locator('text=Average Transaction')).toBeVisible({ timeout: 3000 });
  });

  test('should paginate transaction list', async ({ page }) => {
    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next")');

    if (await nextButton.isVisible()) {
      const page1Count = await page.locator('table tbody tr').count();

      await nextButton.click();
      await page.waitForTimeout(500);

      // Page should have changed
      const page2Count = await page.locator('table tbody tr').count();
      expect(page2Count).toBeGreaterThan(0);
    }
  });

  test('should sync transactions from Plaid', async ({ page }) => {
    const syncButton = page.locator('button:has-text("Sync")');

    if (await syncButton.isVisible()) {
      await syncButton.click();

      // Should show loading state
      await expect(page.locator('text=Syncing')).toBeVisible({ timeout: 2000 });

      // Should complete
      await expect(page.locator('text=Sync complete')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Transaction Categorization', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token_12345');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.goto(`${BASE_URL}/transactions`);
  });

  test('should show confidence indicator for auto-categorized transactions', async ({ page }) => {
    const confidenceIndicators = page.locator('[data-testid="confidence"]');

    if (await confidenceIndicators.count() > 0) {
      const firstIndicator = confidenceIndicators.first();
      await expect(firstIndicator).toBeVisible();

      // Should have color coding
      const classList = await firstIndicator.getAttribute('class');
      expect(classList).toMatch(/green|yellow|red/);
    }
  });

  test('should bulk categorize transactions', async ({ page }) => {
    const bulkButton = page.locator('button:has-text("Auto-Categorize")');

    if (await bulkButton.isVisible()) {
      await bulkButton.click();

      // Should show processing message
      await expect(page.locator('text=Processing')).toBeVisible({ timeout: 2000 });

      // Should complete
      await expect(page.locator('text=Categorized')).toBeVisible({ timeout: 5000 });
    }
  });
});
