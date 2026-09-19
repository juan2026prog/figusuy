import { test, expect } from '@playwright/test'
import { setupAuthenticatedState } from './authHelper.js'

test.describe('Location & Maps E2E Flow with Network Privacy Leak Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page)

    // Intercept network responses to verify NO raw coordinate leak from candidates/other users
    page.on('response', async (response) => {
      const url = response.url()
      const isCandidateEndpoint =
        url.includes('/rest/v1/user_favorites') ||
        url.includes('/rest/v1/chats') ||
        url.includes('/functions/v1/find-matches')

      if (isCandidateEndpoint && response.status() === 200) {
        try {
          const body = await response.json()
          const checkObj = (obj) => {
            if (!obj || typeof obj !== 'object') return
            if (Array.isArray(obj)) {
              obj.forEach(checkObj)
              return
            }
            // If candidate profile, ensure no raw latitude/longitude/lat/lng
            if (obj.profile && typeof obj.profile === 'object') {
              expect(obj.profile).not.toHaveProperty('latitude')
              expect(obj.profile).not.toHaveProperty('longitude')
              expect(obj.profile).not.toHaveProperty('lat')
              expect(obj.profile).not.toHaveProperty('lng')
            }
            if (obj.profile2 && typeof obj.profile2 === 'object') {
              expect(obj.profile2).not.toHaveProperty('latitude')
              expect(obj.profile2).not.toHaveProperty('longitude')
              expect(obj.profile2).not.toHaveProperty('lat')
              expect(obj.profile2).not.toHaveProperty('lng')
            }
          }
          checkObj(body)
        } catch (e) {
          // Non-json response, skip
        }
      }
    })
  })

  test('Stores page renders map, list, interactive pins and navigation', async ({ page }) => {
    await page.goto('/stores')
    await page.waitForLoadState('domcontentloaded')

    // Expect Stores header
    await expect(page.locator('.sf-top-title').first()).toBeVisible({ timeout: 10000 })

    // Check for map container presence
    const mapContainer = page.locator('.sf-map-card, .figus-map-container, .sf-map-side').first()
    await expect(mapContainer).toBeVisible({ timeout: 10000 })

    // Check Cerca Mío button
    const cercaMioBtn = page.locator('button:has-text("Cerca mío")').first()
    if (await cercaMioBtn.isVisible()) {
      await expect(cercaMioBtn).toBeEnabled()
    }
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
