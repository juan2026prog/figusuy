import { test, expect } from '@playwright/test'
import { setupAuthenticatedState } from './authHelper'

test.describe('Mobile Chat Page & Actions Certification', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Should satisfy all mobile chat layout, actions, and touch target requirements', async ({ page }) => {
    await setupAuthenticatedState(page)
    await page.goto('/chat/mock-chat-1')

    // 1. BottomNav global oculta en mobile chat
    const bottomNav = page.locator('.bottom-nav')
    await expect(bottomNav).toBeHidden()

    // 2. Botón kebab ⋮ visible en mobile
    const kebabBtn = page.locator('.chat-kebab-btn')
    await expect(kebabBtn).toBeVisible()

    // 3. Abrir dropdown y verificar opciones
    await kebabBtn.click()

    const dropdownMenu = page.locator('.chat-dropdown-menu')
    await expect(dropdownMenu).toBeVisible()

    // 4. Ver perfil visible
    const profileBtn = dropdownMenu.locator('button:has-text("Ver perfil")')
    await expect(profileBtn).toBeVisible()

    // 5. Bloquear usuario visible
    const blockBtn = dropdownMenu.locator('button:has-text("Bloquear usuario")')
    await expect(blockBtn).toBeVisible()

    // 6. Reportar visible
    const reportBtn = dropdownMenu.locator('button:has-text("Reportar")')
    await expect(reportBtn).toBeVisible()

    // 7. Input / composer de mensajes visible
    const chatInput = page.locator('.chat-input')
    await expect(chatInput).toBeVisible()

    // 8. Botón Enviar visible
    const sendBtn = page.locator('.send-btn')
    await expect(sendBtn).toBeVisible()

    // 9. Área táctil del botón Enviar >= 44x44 px
    const box = await sendBtn.boundingBox()
    expect(box).not.toBeNull()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})
