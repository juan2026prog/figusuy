import { test, expect } from '@playwright/test';

test.describe('Flujo de Acceso Comercial (Business Access)', () => {
  test('Debería cargar la página de solicitud de local', async ({ page }) => {
    await page.goto('/business/apply');
    await expect(page).toHaveURL(/.*\/business\/apply/);
  });
});
