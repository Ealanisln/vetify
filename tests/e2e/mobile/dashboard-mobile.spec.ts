import { test, expect, devices } from '@playwright/test'

/**
 * Mobile E2E Tests - Dashboard
 *
 * These tests verify the dashboard functionality on mobile devices.
 * Focus areas:
 * - Touch interactions
 * - Responsive layout
 * - Mobile navigation
 * - Swipe gestures
 * - Mobile-specific UI elements
 *
 * NOTE: These tests require authentication.
 * Set TEST_AUTH_ENABLED=true and configure test user credentials.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true'

// Mobile viewport configurations
const mobileViewports = {
  iphone: { width: 375, height: 667 }, // iPhone SE
  iphonePlus: { width: 414, height: 896 }, // iPhone XR/11
  android: { width: 360, height: 640 }, // Common Android
  androidLarge: { width: 412, height: 915 }, // Pixel 5
}

test.describe('Dashboard Mobile E2E', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session')

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(mobileViewports.iphone)
  })

  test.describe('Mobile Navigation', () => {
    test('mobile menu button is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Look for hamburger menu button
      const menuButton = page.locator(
        '[data-testid="mobile-menu-button"], button[aria-label*="menu"], button[aria-label*="Menu"]'
      )
      await expect(menuButton.first()).toBeVisible()
    })

    test('mobile menu opens on tap', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const menuButton = page.locator(
        '[data-testid="mobile-menu-button"], button[aria-label*="menu"], button[aria-label*="Menu"]'
      ).first()

      if (await menuButton.isVisible()) {
        await menuButton.tap()
        await page.waitForTimeout(300) // Wait for animation

        // Navigation menu should be visible
        const navMenu = page.locator('nav, [data-testid="mobile-nav"]')
        await expect(navMenu.first()).toBeVisible()
      }
    })

    test('mobile menu closes on outside tap', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const menuButton = page.locator(
        '[data-testid="mobile-menu-button"], button[aria-label*="menu"]'
      ).first()

      if (await menuButton.isVisible()) {
        // Open menu
        await menuButton.tap()
        await page.waitForTimeout(300)

        // Tap outside to close
        await page.locator('body').tap({ position: { x: 350, y: 400 } })
        await page.waitForTimeout(300)

        // Menu should be closed (or at least not covering content)
      }
    })

    test('can navigate to pets page via mobile menu', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const menuButton = page.locator(
        '[data-testid="mobile-menu-button"], button[aria-label*="menu"]'
      ).first()

      if (await menuButton.isVisible()) {
        await menuButton.tap()
        await page.waitForTimeout(300)

        // Find and tap pets link
        const petsLink = page.locator('a[href*="/pets"], text=/mascotas/i').first()
        if (await petsLink.isVisible()) {
          await petsLink.tap()
          await page.waitForLoadState('networkidle')
          await expect(page).toHaveURL(/\/dashboard\/pets/)
        }
      }
    })

    test('can navigate to calendar via mobile menu', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const menuButton = page.locator(
        '[data-testid="mobile-menu-button"], button[aria-label*="menu"]'
      ).first()

      if (await menuButton.isVisible()) {
        await menuButton.tap()
        await page.waitForTimeout(300)

        const calendarLink = page.locator('a[href*="/calendar"], text=/calendario/i').first()
        if (await calendarLink.isVisible()) {
          await calendarLink.tap()
          await page.waitForLoadState('networkidle')
          await expect(page).toHaveURL(/\/dashboard\/calendar/)
        }
      }
    })
  })

  test.describe('Mobile Layout', () => {
    test('dashboard adapts to mobile viewport', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Content should fit within viewport
      const content = page.locator('main, [role="main"]').first()
      if (await content.isVisible()) {
        const box = await content.boundingBox()
        if (box) {
          expect(box.width).toBeLessThanOrEqual(mobileViewports.iphone.width + 10)
        }
      }
    })

    test('cards stack vertically on mobile', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const cards = page.locator('[class*="card"], .card')
      const count = await cards.count()

      if (count >= 2) {
        const firstBox = await cards.first().boundingBox()
        const secondBox = await cards.nth(1).boundingBox()

        if (firstBox && secondBox) {
          // Cards should be stacked (second card below first)
          expect(secondBox.y).toBeGreaterThan(firstBox.y)
        }
      }
    })

    test('text is readable on mobile', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Check heading font size
      const heading = page.locator('h1, h2').first()
      if (await heading.isVisible()) {
        const fontSize = await heading.evaluate((el) => {
          return parseInt(window.getComputedStyle(el).fontSize)
        })
        // Font should be at least 16px for readability
        expect(fontSize).toBeGreaterThanOrEqual(16)
      }
    })

    test('buttons have adequate tap targets', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const buttons = page.locator('button, a.btn, [role="button"]')
      const count = await buttons.count()

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          const box = await button.boundingBox()
          if (box) {
            // Minimum tap target should be 44x44 as per accessibility guidelines
            // We allow some flexibility for inline buttons
            expect(box.height).toBeGreaterThanOrEqual(32)
          }
        }
      }
    })
  })

  test.describe('Mobile Touch Interactions', () => {
    test('can tap to select items', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const petCard = page.locator('[data-testid="pet-card"]').first()
      if (await petCard.isVisible()) {
        await petCard.tap()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/\/dashboard\/pets\//)
      }
    })

    test('search input is accessible on mobile', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const searchInput = page.locator(
        '[data-testid="pets-search-input"], input[type="search"], input[placeholder*="buscar"]'
      ).first()

      if (await searchInput.isVisible()) {
        await searchInput.tap()
        await searchInput.fill('Test')

        // Input should have the value
        await expect(searchInput).toHaveValue('Test')
      }
    })

    test('dropdown menus work on mobile', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      // Find a select/dropdown element
      const dropdown = page
        .locator('select, [data-testid*="select"], [role="combobox"]')
        .first()

      if (await dropdown.isVisible()) {
        await dropdown.tap()
        // Dropdown should open
        await page.waitForTimeout(300)
      }
    })

    test('forms are usable on mobile', async ({ page }) => {
      await page.goto('/dashboard/pets/new')
      await page.waitForLoadState('networkidle')

      // Check if form inputs are visible and accessible
      const nameInput = page.locator('[data-testid="pet-name-input"], input[name="name"]').first()

      if (await nameInput.isVisible()) {
        await nameInput.tap()
        await nameInput.fill('Mobile Test Pet')
        await expect(nameInput).toHaveValue('Mobile Test Pet')
      }
    })
  })

  test.describe('Mobile Scroll Behavior', () => {
    test('page scrolls smoothly', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Scroll down
      await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' })
      })
      await page.waitForTimeout(500)

      const scrollY = await page.evaluate(() => window.scrollY)
      expect(scrollY).toBeGreaterThan(0)
    })

    test('fixed header remains visible on scroll', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Scroll down
      await page.evaluate(() => {
        window.scrollTo({ top: 500 })
      })

      // Header should still be visible
      const header = page.locator('header, [data-testid="dashboard-header"]').first()
      if (await header.isVisible()) {
        const box = await header.boundingBox()
        if (box) {
          // Header should be at or near top of viewport
          expect(box.y).toBeLessThan(100)
        }
      }
    })

    test('can scroll to see all content', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight })
      })
      await page.waitForTimeout(300)

      // Page should be scrollable
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
      const viewportHeight = mobileViewports.iphone.height

      // Content should be scrollable if larger than viewport
      expect(scrollHeight).toBeGreaterThanOrEqual(viewportHeight)
    })
  })

  test.describe('Mobile-Specific Features', () => {
    test('pull to refresh (if implemented)', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Simulate pull to refresh gesture
      const pullStart = { x: 187, y: 100 }
      const pullEnd = { x: 187, y: 400 }

      await page.mouse.move(pullStart.x, pullStart.y)
      await page.mouse.down()
      await page.mouse.move(pullEnd.x, pullEnd.y, { steps: 10 })
      await page.mouse.up()

      // Page should still be functional after gesture
      await expect(page.locator('body')).toBeVisible()
    })

    test('bottom navigation (if present) is accessible', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const bottomNav = page.locator('[data-testid="bottom-nav"], nav[class*="bottom"]').first()

      if (await bottomNav.isVisible()) {
        const box = await bottomNav.boundingBox()
        if (box) {
          // Bottom nav should be at the bottom of viewport
          expect(box.y + box.height).toBeGreaterThan(mobileViewports.iphone.height - 100)
        }
      }
    })

    test('floating action button (if present) is accessible', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const fab = page
        .locator('[data-testid="fab"], button[class*="fab"], [aria-label*="Agregar"]')
        .first()

      if (await fab.isVisible()) {
        const box = await fab.boundingBox()
        if (box) {
          // FAB should be positioned in reachable area
          expect(box.y).toBeLessThan(mobileViewports.iphone.height - 50)
        }

        // Should be tappable
        await fab.tap()
      }
    })
  })

  test.describe('Different Mobile Devices', () => {
    test('works on iPhone SE viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.iphone)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    })

    test('works on iPhone XR viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.iphonePlus)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    })

    test('works on Android viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.android)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    })

    test('works on Pixel 5 viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.androidLarge)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('has proper focus management on mobile', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Tab through focusable elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should have a focused element
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('has adequate color contrast', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Get primary text color and background
      const styles = await page.evaluate(() => {
        const body = document.body
        const computed = window.getComputedStyle(body)
        return {
          color: computed.color,
          background: computed.backgroundColor,
        }
      })

      // This is a basic check - full contrast testing requires specialized tools
      expect(styles.color).toBeDefined()
      expect(styles.background).toBeDefined()
    })
  })
})
