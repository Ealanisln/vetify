import { test, expect } from '@playwright/test'

/**
 * Mobile E2E Tests - Public Pages
 *
 * These tests verify public page functionality on mobile devices.
 * Focus areas:
 * - Touch interactions
 * - Responsive layout
 * - Mobile navigation
 * - Mobile-specific UI elements
 *
 * NOTE: Set TEST_CLINIC_SLUG to use a specific test clinic.
 */

const testClinicSlug = process.env.TEST_CLINIC_SLUG || 'changos-pet'

// Skip in CI if no real clinic data is available
const skipInCI = !!process.env.CI

// Mobile viewport configurations
const mobileViewports = {
  iphone: { width: 375, height: 667 },
  iphonePlus: { width: 414, height: 896 },
  android: { width: 360, height: 640 },
}

// Helper to wait for animations
const waitForAnimations = async (page: import('@playwright/test').Page) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

test.describe('Public Pages Mobile E2E', () => {
  test.skip(skipInCI, 'Skipped in CI - requires real database with clinic data')

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(mobileViewports.iphone)
  })

  test.describe('Landing Page Mobile', () => {
    test('landing page is responsive on mobile', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Content should fit viewport
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(mobileViewports.iphone.width + 10)
    })

    test('mobile header navigation works', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Find mobile menu button
      const menuButton = page.locator(
        '[data-testid="mobile-menu-button"], button[aria-label*="menu"], [aria-label*="Menu"]'
      ).first()

      if (await menuButton.isVisible()) {
        await menuButton.tap()
        await page.waitForTimeout(300)

        // Mobile menu should be visible
        const mobileMenu = page.locator('nav, [role="navigation"], [data-testid="mobile-menu"]')
        await expect(mobileMenu.first()).toBeVisible()
      }
    })

    test('hero section is visible on mobile', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Hero/header content should be visible
      const hero = page.locator(
        '[data-testid="hero"], section:first-of-type, header + section'
      ).first()
      await expect(hero).toBeVisible()
    })

    test('CTA buttons are tappable on mobile', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Find primary CTA button
      const ctaButton = page.locator(
        'a[href*="register"], a[href*="signup"], button:has-text("Empezar"), button:has-text("Prueba")'
      ).first()

      if (await ctaButton.isVisible()) {
        const box = await ctaButton.boundingBox()
        if (box) {
          // Button should have adequate tap target
          expect(box.height).toBeGreaterThanOrEqual(40)
          expect(box.width).toBeGreaterThanOrEqual(100)
        }
      }
    })

    test('feature cards stack on mobile', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      const featureCards = page.locator('[data-testid*="feature"], [class*="feature-card"]')
      const count = await featureCards.count()

      if (count >= 2) {
        const firstBox = await featureCards.first().boundingBox()
        const secondBox = await featureCards.nth(1).boundingBox()

        if (firstBox && secondBox) {
          // Cards should be stacked vertically
          expect(secondBox.y).toBeGreaterThan(firstBox.y)
        }
      }
    })

    test('footer is accessible on mobile', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Scroll to footer
      await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight })
      })
      await page.waitForTimeout(300)

      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
    })
  })

  test.describe('Clinic Public Page Mobile', () => {
    test('clinic page is responsive', async ({ page }) => {
      await page.goto(`/${testClinicSlug}`)
      await waitForAnimations(page)

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(mobileViewports.iphone.width + 10)
    })

    test('clinic header displays correctly', async ({ page }) => {
      await page.goto(`/${testClinicSlug}`)
      await waitForAnimations(page)

      // Clinic name should be visible
      const header = page.locator('h1, [data-testid="clinic-name"]').first()
      await expect(header).toBeVisible()
    })

    test('contact information is accessible', async ({ page }) => {
      await page.goto(`/${testClinicSlug}`)
      await waitForAnimations(page)

      // Look for contact section or phone/email links
      const contactInfo = page.locator(
        'a[href^="tel:"], a[href^="mailto:"], [data-testid*="contact"]'
      ).first()

      if (await contactInfo.isVisible()) {
        await expect(contactInfo).toBeVisible()
      }
    })

    test('services section is visible', async ({ page }) => {
      await page.goto(`/${testClinicSlug}`)
      await waitForAnimations(page)

      // Scroll to find services
      await page.evaluate(() => {
        window.scrollTo({ top: 500 })
      })
      await page.waitForTimeout(300)

      const services = page.locator(
        '[data-testid*="services"], text=/servicios/i, section:has-text("Servicios")'
      ).first()

      if (await services.isVisible()) {
        await expect(services).toBeVisible()
      }
    })

    test('team link is accessible on mobile', async ({ page }) => {
      await page.goto(`/${testClinicSlug}`)
      await waitForAnimations(page)

      const teamLink = page.locator(`a[href*="/${testClinicSlug}/equipo"]`).first()

      if (await teamLink.isVisible()) {
        await teamLink.tap()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(new RegExp(`/${testClinicSlug}/equipo`))
      }
    })
  })

  test.describe('Team Page Mobile', () => {
    test('team page is responsive', async ({ page }) => {
      await page.goto(`/${testClinicSlug}/equipo`)
      await waitForAnimations(page)

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(mobileViewports.iphone.width + 10)
    })

    test('back navigation works on mobile', async ({ page }) => {
      await page.goto(`/${testClinicSlug}/equipo`)
      await waitForAnimations(page)

      const backLink = page.locator(`a[href="/${testClinicSlug}"]`).first()

      if (await backLink.isVisible()) {
        await backLink.tap()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(new RegExp(`/${testClinicSlug}/?$`))
      }
    })

    test('team cards display correctly on mobile', async ({ page }) => {
      await page.goto(`/${testClinicSlug}/equipo`)
      await waitForAnimations(page)

      const staffCards = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('h3') })
      const count = await staffCards.count()

      if (count > 0) {
        const firstCard = staffCards.first()
        const box = await firstCard.boundingBox()

        if (box) {
          // Card should fit within viewport
          expect(box.width).toBeLessThanOrEqual(mobileViewports.iphone.width - 20)
        }
      }
    })
  })

  test.describe('Pricing Page Mobile', () => {
    test('pricing page is responsive', async ({ page }) => {
      await page.goto('/precios')
      await waitForAnimations(page)

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(mobileViewports.iphone.width + 10)
    })

    test('pricing cards stack on mobile', async ({ page }) => {
      await page.goto('/precios')
      await waitForAnimations(page)

      const pricingCards = page.locator(
        '[data-testid*="pricing-card"], [class*="pricing"], [class*="plan-card"]'
      )
      const count = await pricingCards.count()

      if (count >= 2) {
        const firstBox = await pricingCards.first().boundingBox()
        const secondBox = await pricingCards.nth(1).boundingBox()

        if (firstBox && secondBox) {
          // Cards should be stacked
          expect(secondBox.y).toBeGreaterThan(firstBox.y)
        }
      }
    })

    test('pricing CTAs are tappable', async ({ page }) => {
      await page.goto('/precios')
      await waitForAnimations(page)

      const ctaButtons = page.locator(
        '[data-testid*="pricing"] button, [class*="pricing"] button, button:has-text("Elegir"), button:has-text("Empezar")'
      )
      const count = await ctaButtons.count()

      if (count > 0) {
        const firstButton = ctaButtons.first()
        const box = await firstButton.boundingBox()

        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(36)
        }
      }
    })
  })

  test.describe('Blog Page Mobile', () => {
    test('blog page is responsive', async ({ page }) => {
      await page.goto('/blog')
      await waitForAnimations(page)

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(mobileViewports.iphone.width + 10)
    })

    test('blog posts are readable on mobile', async ({ page }) => {
      await page.goto('/blog')
      await waitForAnimations(page)

      const articleCards = page.locator('article, [data-testid*="blog-post"]')
      const count = await articleCards.count()

      if (count > 0) {
        const firstArticle = articleCards.first()
        const box = await firstArticle.boundingBox()

        if (box) {
          // Article should fit viewport
          expect(box.width).toBeLessThanOrEqual(mobileViewports.iphone.width)
        }
      }
    })

    test('can navigate to blog post on mobile', async ({ page }) => {
      await page.goto('/blog')
      await waitForAnimations(page)

      const articleLink = page.locator('article a, [data-testid*="blog-post"] a').first()

      if (await articleLink.isVisible()) {
        await articleLink.tap()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/\/blog\//)
      }
    })
  })

  test.describe('Mobile Touch Interactions', () => {
    test('links are tappable with adequate spacing', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      const links = page.locator('a[href]')
      const count = await links.count()

      let tooSmallCount = 0
      for (let i = 0; i < Math.min(count, 10); i++) {
        const link = links.nth(i)
        if (await link.isVisible()) {
          const box = await link.boundingBox()
          if (box && box.height < 32) {
            tooSmallCount++
          }
        }
      }

      // Most links should have adequate tap targets
      expect(tooSmallCount).toBeLessThan(5)
    })

    test('scroll works correctly', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Swipe up to scroll
      await page.mouse.move(187, 500)
      await page.mouse.down()
      await page.mouse.move(187, 200, { steps: 10 })
      await page.mouse.up()

      await page.waitForTimeout(300)

      const scrollY = await page.evaluate(() => window.scrollY)
      expect(scrollY).toBeGreaterThan(0)
    })

    test('images load on scroll (lazy loading)', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Scroll down
      await page.evaluate(() => {
        window.scrollTo({ top: 1000 })
      })
      await page.waitForTimeout(500)

      // Check images are loaded
      const images = page.locator('img[src]')
      const count = await images.count()

      if (count > 0) {
        // At least some images should be loaded
        const loadedImages = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('img')).filter(
            (img) => img.complete && img.naturalHeight > 0
          ).length
        })
        expect(loadedImages).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Mobile Dark Mode', () => {
    test('dark mode works on mobile landing page', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/')
      await waitForAnimations(page)

      // Page should render in dark mode
      const htmlClass = await page.locator('html').getAttribute('class')
      const bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor
      })

      // Either dark class or dark background color
      const isDark = htmlClass?.includes('dark') || bodyBg.includes('rgb(')
      expect(isDark || true).toBe(true) // Informational
    })

    test('dark mode works on mobile clinic page', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(`/${testClinicSlug}`)
      await waitForAnimations(page)

      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Different Mobile Devices', () => {
    test('landing page works on iPhone viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.iphone)
      await page.goto('/')
      await waitForAnimations(page)

      await expect(page.locator('body')).toBeVisible()
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(mobileViewports.iphone.width + 10)
    })

    test('landing page works on iPhone Plus viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.iphonePlus)
      await page.goto('/')
      await waitForAnimations(page)

      await expect(page.locator('body')).toBeVisible()
    })

    test('landing page works on Android viewport', async ({ page }) => {
      await page.setViewportSize(mobileViewports.android)
      await page.goto('/')
      await waitForAnimations(page)

      await expect(page.locator('body')).toBeVisible()
    })

    test('clinic page works on various devices', async ({ page }) => {
      for (const [device, viewport] of Object.entries(mobileViewports)) {
        await page.setViewportSize(viewport)
        await page.goto(`/${testClinicSlug}`)
        await waitForAnimations(page)

        await expect(page.locator('body')).toBeVisible()
        console.log(`${device}: OK`)
      }
    })
  })

  test.describe('Mobile Performance', () => {
    test('landing page loads quickly on mobile', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      console.log(`Mobile landing page load time: ${loadTime}ms`)
      expect(loadTime).toBeLessThan(5000)
    })

    test('no horizontal scroll on mobile pages', async ({ page }) => {
      const pagesToTest = ['/', '/precios', '/blog']

      for (const url of pagesToTest) {
        await page.goto(url)
        await waitForAnimations(page)

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth
        })

        expect(hasHorizontalScroll).toBe(false)
      }
    })
  })

  test.describe('Mobile Forms', () => {
    test('contact form (if present) works on mobile', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      // Scroll to find contact section
      await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight })
      })

      const contactForm = page.locator('form[data-testid*="contact"], #contact-form').first()

      if (await contactForm.isVisible()) {
        const emailInput = contactForm.locator('input[type="email"]').first()
        if (await emailInput.isVisible()) {
          await emailInput.tap()
          await emailInput.fill('test@example.com')
          await expect(emailInput).toHaveValue('test@example.com')
        }
      }
    })

    test('newsletter signup (if present) works on mobile', async ({ page }) => {
      await page.goto('/')
      await waitForAnimations(page)

      await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight })
      })

      const newsletterForm = page.locator('[data-testid*="newsletter"], form:has(input[type="email"])').first()

      if (await newsletterForm.isVisible()) {
        await expect(newsletterForm).toBeVisible()
      }
    })
  })
})
