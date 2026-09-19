import { test, expect } from '@playwright/test';

test.describe('Public & Static Pages Flow', () => {
  test('should display login page and auth elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });
});
