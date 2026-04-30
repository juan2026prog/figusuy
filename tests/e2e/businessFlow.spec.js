import { test, expect } from '@playwright/test';

// Utilidad para generar un email único
const uniqueEmail = `negociotest_${Date.now()}@test.com`;
const password = '123456';

test.describe('Flujo de Acceso Comercial (Business Access)', () => {
  // Aumentamos el timeout ya que involucra varios pasos
  test.setTimeout(60000);

  test('Debería permitir a un usuario solicitar un local, y al admin aprobarlo', async ({ page, browser }) => {
    // === PASO 1: Registro del usuario NegocioTest ===
    await page.goto('http://localhost:5173/login');
    
    // Asumiendo que hay un botón de registro o se puede ir a /register
    // Cambiar a la vista de registro si es necesario
    await page.click('text="¿No tienes cuenta?"'); // O el texto equivalente para ir al registro

    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', password);
    // Asumiendo que hay un campo para el nombre
    const nameInput = page.locator('input[placeholder*="nombre" i]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Negocio Test');
    }

    await page.click('button[type="submit"]');

    // Esperar a estar logueado (ej. ver el dashboard o el avatar)
    await expect(page.locator('text="Álbum"').first()).toBeVisible({ timeout: 10000 });

    // === PASO 2: Enviar solicitud de local ===
    await page.goto('http://localhost:5173/business/apply');
    
    // Llenar el formulario
    await page.fill('input[name="name"]', 'Mi Kiosko de Prueba');
    await page.fill('input[name="address"]', 'Calle Falsa 123');
    await page.fill('input[name="city"]', 'Montevideo');
    await page.fill('input[name="whatsapp"]', '099123456');
    
    // Seleccionar el plan (simulando click en el plan Gratis)
    await page.click('text="Plan Básico"'); // O el texto que identifique al plan

    // Enviar solicitud
    await page.click('button[type="submit"]:has-text("Enviar Solicitud")');

    // Debe redirigir a /business/pending
    await expect(page).toHaveURL(/.*\/business\/pending/);
    await expect(page.locator('text="Solicitud en Revisión"')).toBeVisible();

    // Intentar acceder a /business directamente debería redirigir a pending
    await page.goto('http://localhost:5173/business');
    await expect(page).toHaveURL(/.*\/business\/pending/);

    // === PASO 3: Loguearse como Admin y Aprobar ===
    // Cerrar sesión
    await page.click('.avatar-circle'); // O el botón para abrir el menú de perfil
    await page.click('text="Cerrar sesión"');
    await expect(page).toHaveURL(/.*\/login/);

    // Iniciar sesión como admin (reemplazar con credenciales de admin local)
    await page.fill('input[type="email"]', 'juanmacastillo2008@gmail.com');
    await page.fill('input[type="password"]', 'contraseña_del_admin'); // Ajustar si es necesario
    await page.click('button[type="submit"]');
    
    // Ir al panel de solicitudes de locales
    await page.goto('http://localhost:5173/admin/locations/requests');
    
    // Esperar a que cargue la solicitud de "Mi Kiosko de Prueba"
    const requestCard = page.locator('div:has-text("Mi Kiosko de Prueba")').first();
    await expect(requestCard).toBeVisible({ timeout: 10000 });

    // Clic en Aprobar
    // Manejar el window.confirm
    page.once('dialog', dialog => dialog.accept());
    await requestCard.locator('button:has-text("Aprobar")').click();

    // Esperar a que cambie el estado a aprobado
    await expect(requestCard.locator('text="Aprobado"')).toBeVisible();

    // === PASO 4: Verificar acceso habilitado para NegocioTest ===
    // Cerrar sesión
    await page.click('.avatar-circle');
    await page.click('text="Cerrar sesión"');
    
    // Volver a iniciar sesión como NegocioTest
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Verificar en el Sidebar que aparece "Mi local"
    const businessLink = page.locator('nav a:has-text("Mi local")');
    await expect(businessLink).toBeVisible({ timeout: 10000 });

    // Acceder a /business
    await page.goto('http://localhost:5173/business');
    
    // Ya no debe redirigir a pending, debe cargar el dashboard de negocio
    await expect(page).not.toHaveURL(/.*\/business\/pending/);
    await expect(page.locator('h1', { hasText: /Dashboard Comercial/i })).toBeVisible();
  });
});
