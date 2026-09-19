import { test, expect } from '@playwright/test'
import { setupAuthenticatedState } from './authHelper'

test.describe('Mobile Chat Page & Actions', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Should hide bottom nav, show kebab menu and dropdown with Ver perfil', async ({ page }) => {
    await setupAuthenticatedState(page)
    await page.goto('/chat/mock-chat-1')

    // BottomNav must NOT be visible on mobile chat page
    const bottomNav = page.locator('.bottom-nav')
    await expect(bottomNav).toBeHidden()

    // Kebab menu button (⋮) must be visible on mobile
    const kebabBtn = page.locator('.chat-kebab-btn')
    await expect(kebabBtn).toBeVisible()

    // Click kebab menu to open dropdown
    await kebabBtn.click()

    // Dropdown menu must appear
    const dropdownMenu = page.locator('.chat-dropdown-menu')
    await expect(dropdownMenu).toBeVisible()

    // Dropdown must contain "Ver perfil"
    const profileBtn = dropdownMenu.locator('button:has-text("Ver perfil")')
    await expect(profileBtn).toBeVisible()
  })
})
