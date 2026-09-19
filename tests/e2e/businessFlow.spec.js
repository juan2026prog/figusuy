import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './authHelper';

test.describe('Flujo de Solicitud Comercial (Business Apply)', () => {
  test('Debería cargar el formulario real de solicitud de local con todos sus controles', async ({ page }) => {
    await setupAuthenticatedState(page);
    await page.goto('/business/apply');

    // Confirmar URL
    await expect(page).toHaveURL(/.*\/business\/apply/);

    // Título principal visible
    const heading = page.locator('h2:has-text("Registrar Local")');
    await expect(heading).toBeVisible();

    // Texto descriptivo del flujo comercial
    const introText = page.locator('text=Completa los datos del local para aparecer en FigusUY');
    await expect(introText).toBeVisible();

    // Campos y controles reales del formulario
    const nameInput = page.locator('input[placeholder="Ej: Kiosco El Pibe"]');
    await expect(nameInput).toBeVisible();

    const addressField = page.locator('label:has-text("Dirección Completa")');
    await expect(addressField).toBeVisible();

    const deptSelect = page.locator('select[name="department"]');
    await expect(deptSelect).toBeVisible();

    const planSelect = page.locator('label:has-text("Plan Seleccionado")');
    await expect(planSelect).toBeVisible();

    // Botón / CTA de envío
    const submitBtn = page.locator('button.submit-btn:has-text("Enviar Solicitud")');
    await expect(submitBtn).toBeVisible();
  });
});
