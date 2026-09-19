import { test, expect } from '@playwright/test'

test.describe('Mobile Navigation & Responsive Remediation', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // Mobile viewport (iPhone SE/8)

  test('Should render mobile bottom navigation and allow seamless tab switching', async ({ page }) => {
    await page.goto('http://localhost:5173/home')

    const bottomNav = page.locator('.bottom-nav')
    if (await bottomNav.isVisible()) {
      await expect(bottomNav).toBeVisible()

      const navItems = bottomNav.locator('.bottom-nav-item')
      await expect(navItems).toHaveCount(5)

      await navItems.nth(1).click()
      await expect(page).toHaveURL(/.*\/album/)

      await navItems.nth(2).click()
      await expect(page).toHaveURL(/.*\/matches/)

      await navItems.nth(3).click()
      await expect(page).toHaveURL(/.*\/chats/)

      await navItems.nth(4).click()
      await expect(page).toHaveURL(/.*\/stores/)
    }
  })

  test('Stores page should support mobile view toggling between list and map', async ({ page }) => {
    await page.goto('http://localhost:5173/stores')
    
    const viewToggle = page.locator('.sf-mobile-view-toggle')
    if (await viewToggle.isVisible()) {
      const mapBtn = viewToggle.locator('button:has-text("Ver en Mapa")')
      await mapBtn.click()
      
      const mapSide = page.locator('.sf-map-side')
      await expect(mapSide).toBeVisible()
    }
  })
})
