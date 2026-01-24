import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests - Public Pages
 *
 * These tests capture screenshots of public-facing pages and compare them
 * against baseline images to detect unintended visual changes.
 *
 * Pages tested:
 * - Public clinic page (landing)
 * - Team page
 * - Landing page sections
 *
 * NOTE: Set TEST_CLINIC_SLUG to use a specific test clinic.
 *
 * First run will create baseline screenshots in __screenshots__ folder.
 * Subsequent runs will compare against these baselines.
 */

const testClinicSlug = process.env.TEST_CLINIC_SLUG || 'changos-pet'

// Skip in CI if no real clinic data is available
const skipInCI = !!process.env.CI

test.describe('Public Pages Visual Regression', () => {
  test.skip(skipInCI, 'Skipped in CI - requires real database with clinic data')

  test.beforeEach(async ({ page }) => {
    await page.waitForLoadState('networkidle')
    // Wait for Framer Motion animations to complete
    await page.waitForTimeout(800)
  })

  test.describe('Public Clinic Landing', () => {
    test('clinic landing page visual', async ({ page }) => {
      await page.goto(`/${testClinicSlug}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('clinic-landing.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('clinic landing page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(`/${testClinicSlug}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('clinic-landing-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('clinic landing page - mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`/${testClinicSlug}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('clinic-landing-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('clinic landing page - tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(`/${testClinicSlug}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('clinic-landing-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Team Page', () => {
    test('team page visual', async ({ page }) => {
      await page.goto(`/${testClinicSlug}/equipo`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('team-page.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('team page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(`/${testClinicSlug}/equipo`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('team-page-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('team page - mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`/${testClinicSlug}/equipo`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('team-page-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Main Landing Page', () => {
    test('main landing page visual', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Hide dynamic elements like testimonial carousels
      await page.evaluate(() => {
        document.querySelectorAll('[data-testid*="carousel"], .swiper-slide').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('landing-page.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('main landing page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await page.evaluate(() => {
        document.querySelectorAll('[data-testid*="carousel"], .swiper-slide').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('landing-page-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('main landing page - mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await page.evaluate(() => {
        document.querySelectorAll('[data-testid*="carousel"], .swiper-slide').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('landing-page-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Pricing Page', () => {
    test('pricing page visual', async ({ page }) => {
      await page.goto('/precios')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('pricing-page.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('pricing page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/precios')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('pricing-page-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Blog Pages', () => {
    test('blog listing page visual', async ({ page }) => {
      await page.goto('/blog')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Hide dynamic dates
      await page.evaluate(() => {
        document.querySelectorAll('time').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('blog-listing.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('blog listing page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/blog')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await page.evaluate(() => {
        document.querySelectorAll('time').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })

      await expect(page).toHaveScreenshot('blog-listing-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Component Screenshots', () => {
    test('header component visual', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const header = page.locator('header').first()
      if (await header.isVisible()) {
        await expect(header).toHaveScreenshot('header-component.png', {
          animations: 'disabled',
        })
      }
    })

    test('footer component visual', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const footer = page.locator('footer').first()
      if (await footer.isVisible()) {
        await expect(footer).toHaveScreenshot('footer-component.png', {
          animations: 'disabled',
        })
      }
    })

    test('navigation menu - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Open mobile menu
      const menuButton = page.locator('button[aria-label*="menu"], [data-testid="mobile-menu-button"]')
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(300)

        await expect(page).toHaveScreenshot('mobile-menu-open.png', {
          animations: 'disabled',
        })
      }
    })
  })
})
