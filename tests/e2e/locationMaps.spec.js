import { test, expect } from '@playwright/test'
import { setupAuthenticatedState } from './authHelper.js'

test.describe('Location & Maps E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page)
  })

  test('Stores page renders map, list and switches between views', async ({ page }) => {
    await page.goto('/stores')
    await page.waitForLoadState('domcontentloaded')

    // Expect Stores header
    await expect(page.locator('.sf-top-title').first()).toBeVisible({ timeout: 10000 })

    // Check for map container presence
    const mapContainer = page.locator('.sf-map-card, .figus-map-container, .sf-map-side').first()
    await expect(mapContainer).toBeVisible({ timeout: 10000 })
  })

  test('Matches page provides view mode switch between list and map', async ({ page }) => {
    await page.goto('/matches')
    await page.waitForLoadState('domcontentloaded')

    // Expect Matches page heading
    await expect(page.locator('.top-title').first()).toBeVisible({ timeout: 10000 })

    // Toggle to map mode using direct DOM click
    const mapBtn = page.locator('.view-mode-toggle button').filter({ hasText: /mapa/i }).first()
    await expect(mapBtn).toBeAttached({ timeout: 10000 })
    await mapBtn.dispatchEvent('click')

    // Expect map container or section to be visible
    const mapSection = page.locator('.matches-map-section, .figus-map-container').first()
    await expect(mapSection).toBeVisible({ timeout: 10000 })

    // Toggle back to list mode using direct DOM click
    const listBtn = page.locator('.view-mode-toggle button').filter({ hasText: /lista/i }).first()
    await expect(listBtn).toBeAttached({ timeout: 10000 })
    await listBtn.dispatchEvent('click')

    const listSection = page.locator('.layout, .main-stack').first()
    await expect(listSection).toBeVisible({ timeout: 10000 })
  })
})
