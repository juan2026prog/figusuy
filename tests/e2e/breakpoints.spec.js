import { test, expect } from '@playwright/test'
import { setupAuthenticatedState } from './authHelper'

const mobileBreakpoints = [
  { name: 'Tablet 768px', width: 768, height: 1024 },
  { name: 'Tablet 820px', width: 820, height: 1180 },
  { name: 'Threshold 1023px', width: 1023, height: 800 },
]

for (const bp of mobileBreakpoints) {
  test(`Breakpoint ${bp.name}: BottomNav visible, Sidebar hidden (no dead zones)`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await setupAuthenticatedState(page)
    await page.goto('/home')

    const bottomNav = page.locator('.bottom-nav')
    await expect(bottomNav).toBeVisible()

    const sidebarWrapper = page.locator('.app-sidebar-wrapper')
    await expect(sidebarWrapper).toBeHidden()
  })
}

const desktopBreakpoints = [
  { name: 'Desktop Threshold 1024px', width: 1024, height: 800 },
  { name: 'Desktop HD 1280px', width: 1280, height: 800 },
]

for (const bp of desktopBreakpoints) {
  test(`Breakpoint ${bp.name}: Sidebar visible, BottomNav hidden`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await setupAuthenticatedState(page)
    await page.goto('/home')

    const sidebarWrapper = page.locator('.app-sidebar-wrapper')
    await expect(sidebarWrapper).toBeVisible()

    const bottomNav = page.locator('.bottom-nav')
    await expect(bottomNav).toBeHidden()
  })
}
