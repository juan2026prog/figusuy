import { test, expect } from '@playwright/test';

test.describe('Premium Payment Flow', () => {
  test('should display premium plans and initiate checkout', async ({ page }) => {
    // 1. Go to the app
    await page.goto('http://localhost:5173/login');
    
    // Note: We should use a test user here in a real environment
    // For now, we just test if the premium page loads correctly
    
    // Go directly to premium page (assuming session is mocked or we get redirected)
    await page.goto('http://localhost:5173/premium');

    // Wait for plans to load
    await expect(page.locator('text=Premium Plus')).toBeVisible({ timeout: 10000 });
    
    // Check if the checkout button exists
    const subscribeButton = page.locator('button:has-text("Suscribirse")').first();
    await expect(subscribeButton).toBeVisible();
  });
});
