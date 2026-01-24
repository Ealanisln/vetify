import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests - Dashboard Pages
 *
 * These tests capture screenshots of dashboard pages and compare them
 * against baseline images to detect unintended visual changes.
 *
 * Pages tested:
 * - Dashboard home
 * - Pets list
 * - Calendar (Appointments)
 * - Settings
 *
 * NOTE: These tests require authentication and proper test user setup.
 * Set TEST_AUTH_ENABLED=true and configure test user credentials.
 *
 * First run will create baseline screenshots in __screenshots__ folder.
 * Subsequent runs will compare against these baselines.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true'

test.describe('Dashboard Visual Regression', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true')

  test.beforeEach(async ({ page }) => {
    // Wait for page to fully load and animations to complete
    await page.waitForLoadState('networkidle')
    // Wait for any CSS animations to complete
    await page.waitForTimeout(500)
  })

  test.describe('Dashboard Home', () => {
    test('dashboard home page visual', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      // Wait for stats cards and charts to render
      await page.waitForTimeout(1000)

      // Hide dynamic content that changes between runs
      await page.evaluate(() => {
        // Hide timestamps and dynamic counters
        document.querySelectorAll('time, [data-testid*="timestamp"]').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('dashboard-home.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('dashboard home page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await page.evaluate(() => {
        document.querySelectorAll('time, [data-testid*="timestamp"]').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('dashboard-home-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('dashboard home page - mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await page.evaluate(() => {
        document.querySelectorAll('time, [data-testid*="timestamp"]').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('dashboard-home-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Pets List', () => {
    test('pets list page visual', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('pets-list.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('pets list page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('pets-list-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('pets list page - tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('pets-list-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('pets empty state visual', async ({ page }) => {
      // Navigate to pets with a search that likely returns no results
      await page.goto('/dashboard/pets?search=xyznonexistent123')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('pets-empty-state.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Calendar (Appointments)', () => {
    test('calendar page visual', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')
      // Wait for calendar to render
      await page.waitForTimeout(1000)

      // Hide dynamic date elements
      await page.evaluate(() => {
        document.querySelectorAll('[data-date], .fc-day-today').forEach((el) => {
          (el as HTMLElement).style.backgroundColor = 'transparent'
        })
      })

      await expect(page).toHaveScreenshot('calendar.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('calendar page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await page.evaluate(() => {
        document.querySelectorAll('[data-date], .fc-day-today').forEach((el) => {
          (el as HTMLElement).style.backgroundColor = 'transparent'
        })
      })

      await expect(page).toHaveScreenshot('calendar-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('calendar page - week view', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Click week view button if available
      const weekButton = page.locator('button:has-text("Semana"), button:has-text("Week")')
      if (await weekButton.isVisible()) {
        await weekButton.click()
        await page.waitForTimeout(500)
      }

      await expect(page).toHaveScreenshot('calendar-week.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Settings', () => {
    test('settings page visual', async ({ page }) => {
      await page.goto('/dashboard/settings')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('settings.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('settings page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/dashboard/settings')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('settings-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('settings subscription tab visual', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=subscription')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Hide dynamic subscription dates
      await page.evaluate(() => {
        document.querySelectorAll('[data-testid*="date"], time').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('settings-subscription.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('settings clinic tab visual', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=clinic')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('settings-clinic.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })
})
