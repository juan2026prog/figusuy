import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './authHelper';

test.describe('Flujo de Planes y Suscripciones Premium', () => {
  test('Debería renderizar la página Premium con sus planes reales y CTAs accesibles', async ({ page }) => {
    await setupAuthenticatedState(page);
    await page.goto('/premium');

    // Confirmar URL
    await expect(page).toHaveURL(/.*\/premium/);

    // Confirmar título principal de la sección de planes
    const sectionHeading = page.locator('h2:has-text("Elegí tu ritmo para completar")');
    await expect(sectionHeading).toBeVisible();

    // Confirmar sección de estado actual
    const currentStatusHeading = page.locator('h2:has-text("Tu estado actual")');
    await expect(currentStatusHeading).toBeVisible();

    // Confirmar que existen las 3 cards de planes reales configurados
    const planCards = page.locator('article.plan');
    await expect(planCards).toHaveCount(3);

    const gratisPlan = page.locator('article.plan:has(h3.plan-name:text-is("Gratis"))');
    await expect(gratisPlan).toBeVisible();

    const plusPlan = page.locator('article.plan:has(h3.plan-name:text-is("Plus"))');
    await expect(plusPlan).toBeVisible();

    const proPlan = page.locator('article.plan:has(h3.plan-name:text-is("Pro"))');
    await expect(proPlan).toBeVisible();

    // Confirmar que las acciones de upgrade / suscripción están disponibles y accesibles
    const upgradeBtns = page.locator('article.plan button');
    await expect(upgradeBtns.first()).toBeVisible();

    // Verificar CTA de upgrade para plan Plus o Pro
    const plusCta = plusPlan.locator('button');
    await expect(plusCta).toBeVisible();
    await expect(plusCta).toBeEnabled();

    const proCta = proPlan.locator('button');
    await expect(proCta).toBeVisible();
    await expect(proCta).toBeEnabled();
  });
});
