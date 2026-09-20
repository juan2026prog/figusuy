import { test, expect } from '@playwright/test'
import { setupAuthenticatedState } from './authHelper.js'

// Helper recursivo que inspecciona exhaustivamente el payload y falla inmediatamente ante cualquier coordenada no autorizada
export function checkForLeaks(obj, path = '') {
  if (!obj || typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => checkForLeaks(item, `${path}[${idx}]`))
    return
  }

  // Whitelist permitida: approx_point.lat y approx_point.lng
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key
    const isProhibitedKey = ['latitude', 'longitude', 'lat', 'lng'].includes(key.toLowerCase())

    if (isProhibitedKey) {
      // Excepción única permitida: objeto approx_point
      const isApproxPoint = path.endsWith('approx_point') || path.includes('.approx_point')
      if (!isApproxPoint) {
        throw new Error(`SECURITY NETWORK LEAK DETECTED: Prohibited coordinate key "${key}" found at path "${currentPath}" with value ${JSON.stringify(value)}`)
      }
    }

    if (value && typeof value === 'object') {
      checkForLeaks(value, currentPath)
    }
  }
}

test.describe('Location & Maps E2E Flow with Network Privacy Leak Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page)

    // Intercept network responses to verify NO raw coordinate leak from candidates/other users
    page.on('response', async (response) => {
      const url = response.url()
      const isAuditedEndpoint =
        url.includes('/rest/v1/profiles') ||
        url.includes('/rest/v1/user_favorites') ||
        url.includes('/rest/v1/chats') ||
        url.includes('/rest/v1/rpc/get_public_profile') ||
        url.includes('/functions/v1/find-matches')

      if (isAuditedEndpoint && response.status() === 200) {
        let body
        try {
          body = await response.json()
        } catch {
          return // Non-json response, skip parsing
        }

        // ASSERTIONS FUERA DEL CATCH: Cualquier coordenada prohibida hace fallar el test de inmediato
        checkForLeaks(body)
      }
    })
  })

  test('Unit verification: checkForLeaks detector fails immediately when negative leak payload is encountered', () => {
    const leakPayload = {
      profile: {
        latitude: -34.9
      }
    }
    expect(() => checkForLeaks(leakPayload)).toThrow(/SECURITY NETWORK LEAK DETECTED/)

    const safePayload = {
      profile: {
        id: 'user-1',
        approx_point: { lat: -34.91, lng: -56.16 }
      }
    }
    expect(() => checkForLeaks(safePayload)).not.toThrow()
  })

  test('Stores page renders map, list, interactive pins and navigation', async ({ page }) => {
    await page.goto('/stores')
    await page.waitForLoadState('domcontentloaded')

    // Expect Stores header
    await expect(page.locator('.sf-top-title').first()).toBeVisible({ timeout: 10000 })

    // Check for map container presence
    const mapContainer = page.locator('.sf-map-card, .figus-map-container, .sf-map-side').first()
    await expect(mapContainer).toBeVisible({ timeout: 10000 })

    // Check Cerca Mío button (obligatorio en Stores)
    const cercaMioBtn = page.locator('button:has-text("Cerca mío")').first()
    await expect(cercaMioBtn).toBeVisible({ timeout: 10000 })
    await expect(cercaMioBtn).toBeEnabled()
  })

  test('Matches page provides view mode switch between list and map without coordinate leak', async ({ page }) => {
    await page.goto('/matches')
    await page.waitForLoadState('domcontentloaded')

    // Expect Matches page heading
    await expect(page.locator('.top-title').first()).toBeVisible({ timeout: 10000 })

    // Toggle to map mode
    const mapBtn = page.locator('.view-mode-toggle button').filter({ hasText: /mapa/i }).first()
    await expect(mapBtn).toBeAttached({ timeout: 10000 })
    await mapBtn.dispatchEvent('click')

    // Expect map container to be visible
    const mapSection = page.locator('.matches-map-section, .figus-map-container').first()
    await expect(mapSection).toBeVisible({ timeout: 10000 })

    // Toggle back to list mode
    const listBtn = page.locator('.view-mode-toggle button').filter({ hasText: /lista/i }).first()
    await expect(listBtn).toBeAttached({ timeout: 10000 })
    await listBtn.dispatchEvent('click')

    const listSection = page.locator('.layout, .main-stack').first()
    await expect(listSection).toBeVisible({ timeout: 10000 })
  })

  test('Public Profile access respects privacy and does not leak private coords', async ({ page }) => {
    await page.goto('/u/carlosg')
    await page.waitForLoadState('domcontentloaded')

    // Expect profile or container to render safely
    const profilePage = page.locator('.public-profile-page, .flex-center').first()
    await expect(profilePage).toBeVisible({ timeout: 10000 })
  })
})
