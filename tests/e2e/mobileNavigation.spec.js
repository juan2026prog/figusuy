import { test, expect } from '@playwright/test'
import { setupAuthenticatedState } from './authHelper'

const viewports = [
  { name: 'iPhone X / 12 mini (375x812)', width: 375, height: 812 },
  { name: 'iPhone 13 / 14 (390x844)', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max (430x932)', width: 430, height: 932 },
  { name: 'iPad Mini (768x1024)', width: 768, height: 1024 },
  { name: 'iPad Air (820x1180)', width: 820, height: 1180 },
]

for (const vp of viewports) {
  test.describe(`Mobile Navigation on ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    test('Should display bottom navigation with canonical 5 tabs and navigate smoothly', async ({ page }) => {
      await setupAuthenticatedState(page)
      await page.goto('/home')

      const bottomNav = page.locator('.bottom-nav')
      await expect(bottomNav).toBeVisible()

      // Verify canonical 5 tabs
      const navLinks = bottomNav.locator('a')
      await expect(navLinks).toHaveCount(5)

      await expect(navLinks.nth(0)).toContainText('Inicio')
      await expect(navLinks.nth(1)).toContainText('Álbum')
      await expect(navLinks.nth(2)).toContainText('Intercambios')
      await expect(navLinks.nth(3)).toContainText('Chats')
      await expect(navLinks.nth(4)).toContainText('Lugares')

      // Navigate to Álbum
      await navLinks.nth(1).click()
      await expect(page).toHaveURL(/.*\/album/)
      await expect(page.locator('.bottom-nav')).toBeVisible()

      // Navigate to Intercambios
      await navLinks.nth(2).click()
      await expect(page).toHaveURL(/.*\/matches/)
      await expect(page.locator('.bottom-nav')).toBeVisible()

      // Navigate to Chats
      await navLinks.nth(3).click()
      await expect(page).toHaveURL(/.*\/chats/)
      await expect(page.locator('.bottom-nav')).toBeVisible()

      // Navigate to Lugares
      await navLinks.nth(4).click()
      await expect(page).toHaveURL(/.*\/stores/)
      await expect(page.locator('.bottom-nav')).toBeVisible()

      // Return to Inicio
      await navLinks.nth(0).click()
      await expect(page).toHaveURL(/.*\/home/)
      await expect(page.locator('.bottom-nav')).toBeVisible()
    })
  })
}
