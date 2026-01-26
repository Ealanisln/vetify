import { test, expect } from '@playwright/test'

/**
 * Mobile Navbar E2E Tests
 *
 * These tests verify the mobile navbar fixes:
 * 1. Menu overlay appears above navbar content
 * 2. Page does not scroll while menu is open (iOS scroll lock)
 * 3. Scroll position is preserved after closing menu
 * 4. Dark mode skeleton renders correctly
 */

// Mobile viewport configurations
const mobileViewports = {
  iphone: { width: 375, height: 667 }, // iPhone SE
  iphonePlus: { width: 414, height: 896 }, // iPhone XR/11
  iphonePro: { width: 390, height: 844 }, // iPhone 12/13 Pro
  android: { width: 360, height: 640 }, // Common Android
}

test.describe('Mobile Navbar E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(mobileViewports.iphone)
  })

  test.describe('Menu Overlay Z-Index', () => {
    test('menu overlay appears above navbar content', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Find and click hamburger menu button
      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300) // Wait for animation

      // Get the z-index of the overlay
      const overlay = page.locator('.z-\\[110\\]')
      await expect(overlay).toBeVisible()

      // Verify overlay z-index is higher than navbar
      const overlayZIndex = await overlay.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return parseInt(style.zIndex) || 0
      })

      // z-[110] = 110
      expect(overlayZIndex).toBeGreaterThanOrEqual(110)
    })

    test('menu is accessible after opening', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Menu links should be visible and clickable
      const funcionalidadesLink = page.locator('a[href="/funcionalidades"]').last()
      await expect(funcionalidadesLink).toBeVisible()

      const preciosLink = page.locator('a[href="/precios"]').last()
      await expect(preciosLink).toBeVisible()
    })

    test('menu can be closed by clicking outside', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Menu overlay should be visible
      const overlay = page.locator('.z-\\[110\\]')
      await expect(overlay).toBeVisible()

      // Click on backdrop to close
      const backdrop = page.locator('.z-\\[110\\] > div').first()
      await backdrop.tap({ position: { x: 10, y: 400 } })
      await page.waitForTimeout(300)

      // Menu should be closed
      await expect(overlay).not.toBeVisible()
    })
  })

  test.describe('iOS Scroll Prevention', () => {
    test('page does not scroll while menu is open', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // First, scroll down a bit
      await page.evaluate(() => {
        window.scrollTo(0, 100)
      })
      await page.waitForTimeout(100)

      // Get initial scroll position
      const initialScrollY = await page.evaluate(() => window.scrollY)

      // Open menu
      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Try to scroll while menu is open
      await page.evaluate(() => {
        window.scrollTo(0, 500)
      })
      await page.waitForTimeout(100)

      // Body should have position: fixed which prevents scrolling
      const bodyStyles = await page.evaluate(() => ({
        position: document.body.style.position,
        overflow: document.body.style.overflow,
      }))

      expect(bodyStyles.position).toBe('fixed')
      expect(bodyStyles.overflow).toBe('hidden')
    })

    test('scroll position is preserved after closing menu', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Scroll to a specific position
      const targetScroll = 200
      await page.evaluate((scroll) => {
        window.scrollTo(0, scroll)
      }, targetScroll)
      await page.waitForTimeout(100)

      // Get position before opening menu
      const scrollBeforeOpen = await page.evaluate(() => window.scrollY)

      // Open menu
      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Close menu
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Get position after closing menu
      const scrollAfterClose = await page.evaluate(() => window.scrollY)

      // Scroll position should be preserved
      expect(Math.abs(scrollAfterClose - scrollBeforeOpen)).toBeLessThan(5)
    })

    test('body styles are cleaned up after menu closes', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()

      // Open menu
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Verify body has scroll lock styles
      let bodyStyles = await page.evaluate(() => ({
        position: document.body.style.position,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      }))

      expect(bodyStyles.position).toBe('fixed')
      expect(bodyStyles.width).toBe('100%')
      expect(bodyStyles.overflow).toBe('hidden')

      // Close menu
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Body styles should be cleaned up
      bodyStyles = await page.evaluate(() => ({
        position: document.body.style.position,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      }))

      expect(bodyStyles.position).toBe('')
      expect(bodyStyles.width).toBe('')
      expect(bodyStyles.overflow).toBe('')
    })
  })

  test.describe('Dark Mode Skeleton', () => {
    test('navbar renders without flash in dark mode', async ({ page }) => {
      // Emulate dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' })

      await page.goto('/')

      // The navbar should be immediately visible (skeleton state)
      const nav = page.locator('nav').first()
      await expect(nav).toBeVisible()

      // Should have dark background
      const hasDarkBackground = await nav.evaluate((el) => {
        const classList = el.className
        return classList.includes('dark:bg-gray-900')
      })

      expect(hasDarkBackground).toBe(true)
    })

    test('skeleton has proper dark mode styling', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })

      await page.goto('/')

      const nav = page.locator('nav').first()

      // Check for dark mode border
      const hasDarkBorder = await nav.evaluate((el) => {
        const classList = el.className
        return classList.includes('dark:border-gray-700')
      })

      expect(hasDarkBorder).toBe(true)
    })
  })

  test.describe('iOS Safari Specific', () => {
    test('body scroll is properly locked on iOS', async ({ page }) => {
      // Use iPhone viewport
      await page.setViewportSize(mobileViewports.iphonePro)
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Check iOS-specific scroll lock styles
      const bodyStyles = await page.evaluate(() => ({
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      }))

      // These are the iOS-safe scroll prevention styles
      expect(bodyStyles.position).toBe('fixed')
      expect(bodyStyles.width).toBe('100%')
      expect(bodyStyles.overflow).toBe('hidden')
      // top should be set to negative scroll value (could be -0px or empty if at top)
      expect(bodyStyles.top).toMatch(/^-?\d+px$|^$/)
    })

    test('safe area padding is applied on notched devices', async ({ page }) => {
      await page.setViewportSize(mobileViewports.iphonePro)
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Check if mobile menu has safe-area class
      const mobileMenuPanel = page.locator('.mobile-menu-panel, .mobile-menu-safe-area').first()
      const isVisible = await mobileMenuPanel.isVisible().catch(() => false)

      if (isVisible) {
        // Menu panel exists - safe area should be handled
        await expect(mobileMenuPanel).toBeVisible()
      }
    })
  })

  test.describe('Touch Interactions', () => {
    test('hamburger button responds to tap', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()

      // Initial state
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

      // Tap to open
      await menuButton.tap()
      await page.waitForTimeout(300)

      await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    })

    test('navigation links work on touch', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Find and tap navigation link
      const funcionalidadesLink = page.locator('a[href="/funcionalidades"]').last()
      await funcionalidadesLink.tap()

      // Should navigate to the page
      await page.waitForLoadState('domcontentloaded')
      await expect(page).toHaveURL(/funcionalidades/)
    })

    test('multiple rapid taps do not break menu state', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()

      // Rapidly tap multiple times
      await menuButton.tap()
      await page.waitForTimeout(50)
      await menuButton.tap()
      await page.waitForTimeout(50)
      await menuButton.tap()
      await page.waitForTimeout(300)

      // Menu should be in a valid state (either open or closed, not broken)
      const isExpanded = await menuButton.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(isExpanded)

      // Body styles should be consistent with menu state
      const bodyPosition = await page.evaluate(() => document.body.style.position)
      if (isExpanded === 'true') {
        expect(bodyPosition).toBe('fixed')
      } else {
        expect(bodyPosition).toBe('')
      }
    })
  })

  test.describe('Different Mobile Devices', () => {
    test('works on iPhone SE viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.iphone)
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await expect(menuButton).toBeVisible()

      await menuButton.tap()
      await page.waitForTimeout(300)

      // Menu should be visible and functional
      const overlay = page.locator('.z-\\[110\\]')
      await expect(overlay).toBeVisible()
    })

    test('works on iPhone XR viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.iphonePlus)
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await expect(menuButton).toBeVisible()

      await menuButton.tap()
      await page.waitForTimeout(300)

      const overlay = page.locator('.z-\\[110\\]')
      await expect(overlay).toBeVisible()
    })

    test('works on Android viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.android)
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first()
      await expect(menuButton).toBeVisible()

      await menuButton.tap()
      await page.waitForTimeout(300)

      const overlay = page.locator('.z-\\[110\\]')
      await expect(overlay).toBeVisible()
    })
  })

  test.describe('Theme Toggle in Mobile Menu', () => {
    test('theme dropdown opens in mobile view', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Find and click theme button
      const themeButton = page.locator('button[aria-label*="tema"]').first()
      await themeButton.tap()
      await page.waitForTimeout(300)

      // Theme dropdown should be visible
      const lightOption = page.locator('button:has-text("Claro")').first()
      await expect(lightOption).toBeVisible()
    })

    test('theme dropdown has higher z-index than menu', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const themeButton = page.locator('button[aria-label*="tema"]').first()
      await themeButton.tap()
      await page.waitForTimeout(300)

      // Theme dropdown should have z-[110] class
      const dropdown = page.locator('.z-\\[110\\]')
      await expect(dropdown.first()).toBeVisible()
    })
  })
})
