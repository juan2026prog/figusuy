import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './authHelper';

test.describe('Flujo de Acceso Comercial (Business Access)', () => {
  test('Debería cargar la página de solicitud de local', async ({ page }) => {
    await setupAuthenticatedState(page);
    await page.goto('/business/apply');
    await expect(page).toHaveURL(/.*\/business\/apply/);
  });
});
