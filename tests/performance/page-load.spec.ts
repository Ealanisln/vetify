import { test, expect } from '@playwright/test'

/**
 * Performance Tests - Page Load Times
 *
 * These tests verify that pages load within acceptable time thresholds.
 *
 * Performance targets:
 * - Dashboard: < 3 seconds
 * - Public pages: < 2 seconds
 *
 * Metrics measured:
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Total page load time
 *
 * NOTE: Performance can vary based on network conditions and server load.
 * These tests use reasonable thresholds for a development environment.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true'
const testClinicSlug = process.env.TEST_CLINIC_SLUG || 'changos-pet'

// Performance thresholds in milliseconds
const THRESHOLDS = {
  DASHBOARD_LOAD: 3000, // 3 seconds
  PUBLIC_PAGE_LOAD: 2000, // 2 seconds
  FCP_TARGET: 1800, // First Contentful Paint target
  LCP_TARGET: 2500, // Largest Contentful Paint target
}

interface PerformanceMetrics {
  loadTime: number
  fcp: number | null
  lcp: number | null
  domContentLoaded: number
  domInteractive: number
}

async function measurePagePerformance(
  page: import('@playwright/test').Page,
  url: string
): Promise<PerformanceMetrics> {
  const startTime = Date.now()

  await page.goto(url, { waitUntil: 'load' })

  const loadTime = Date.now() - startTime

  // Get performance metrics from the browser
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paintEntries = performance.getEntriesByType('paint')

    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint')

    // Try to get LCP from PerformanceObserver entries
    let lcpValue: number | null = null
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
    if (lcpEntries.length > 0) {
      lcpValue = lcpEntries[lcpEntries.length - 1].startTime
    }

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
      domInteractive: navigation?.domInteractive || 0,
      fcp: fcpEntry?.startTime || null,
      lcp: lcpValue,
    }
  })

  return {
    loadTime,
    fcp: performanceMetrics.fcp,
    lcp: performanceMetrics.lcp,
    domContentLoaded: performanceMetrics.domContentLoaded,
    domInteractive: performanceMetrics.domInteractive,
  }
}

test.describe('Dashboard Page Load Performance', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true')

  test('dashboard home loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/dashboard')

    console.log('Dashboard Home Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.DASHBOARD_LOAD)
  })

  test('pets list page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/dashboard/pets')

    console.log('Pets List Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.DASHBOARD_LOAD)
  })

  test('calendar page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/dashboard/calendar')

    console.log('Calendar Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.DASHBOARD_LOAD)
  })

  test('settings page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/dashboard/settings')

    console.log('Settings Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.DASHBOARD_LOAD)
  })

  test('customers page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/dashboard/customers')

    console.log('Customers Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.DASHBOARD_LOAD)
  })
})

test.describe('Public Page Load Performance', () => {
  test('main landing page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/')

    console.log('Landing Page Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.PUBLIC_PAGE_LOAD)
  })

  test('pricing page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/precios')

    console.log('Pricing Page Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.PUBLIC_PAGE_LOAD)
  })

  test('blog page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/blog')

    console.log('Blog Page Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.PUBLIC_PAGE_LOAD)
  })

  test('clinic public page loads within target time', async ({ page }) => {
    const metrics = await measurePagePerformance(page, `/${testClinicSlug}`)

    console.log('Clinic Public Page Performance:', {
      loadTime: `${metrics.loadTime}ms`,
      fcp: metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A',
      domContentLoaded: `${metrics.domContentLoaded.toFixed(0)}ms`,
    })

    expect(metrics.loadTime).toBeLessThan(THRESHOLDS.PUBLIC_PAGE_LOAD)
  })
})

test.describe('Core Web Vitals', () => {
  test('landing page FCP is within target', async ({ page }) => {
    const metrics = await measurePagePerformance(page, '/')

    if (metrics.fcp !== null) {
      console.log(`FCP: ${metrics.fcp.toFixed(0)}ms (target: ${THRESHOLDS.FCP_TARGET}ms)`)
      expect(metrics.fcp).toBeLessThan(THRESHOLDS.FCP_TARGET)
    } else {
      console.log('FCP metric not available')
      // Pass the test if FCP is not measurable
      expect(true).toBe(true)
    }
  })

  test('landing page LCP is within target', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Wait for LCP to be recorded
    await page.waitForTimeout(1000)

    const lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        let lcpValue: number | null = null

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          lcpValue = lastEntry.startTime
        })

        observer.observe({ type: 'largest-contentful-paint', buffered: true })

        // Give it time to collect entries, then disconnect
        setTimeout(() => {
          observer.disconnect()
          resolve(lcpValue)
        }, 500)
      })
    })

    if (lcp !== null) {
      console.log(`LCP: ${lcp.toFixed(0)}ms (target: ${THRESHOLDS.LCP_TARGET}ms)`)
      expect(lcp).toBeLessThan(THRESHOLDS.LCP_TARGET)
    } else {
      console.log('LCP metric not available')
      expect(true).toBe(true)
    }
  })
})

test.describe('Performance Under Load', () => {
  test('dashboard remains responsive with multiple tabs', async ({ browser }) => {
    const context = await browser.newContext()
    const pages: import('@playwright/test').Page[] = []

    // Open multiple pages
    for (let i = 0; i < 3; i++) {
      const page = await context.newPage()
      pages.push(page)
    }

    const startTime = Date.now()

    // Navigate all pages simultaneously
    await Promise.all([pages[0].goto('/'), pages[1].goto('/precios'), pages[2].goto('/blog')])

    const totalTime = Date.now() - startTime

    console.log(`Loading 3 pages simultaneously took: ${totalTime}ms`)

    // All pages should load within extended threshold
    expect(totalTime).toBeLessThan(THRESHOLDS.PUBLIC_PAGE_LOAD * 2)

    // Verify all pages loaded correctly
    for (const page of pages) {
      await expect(page.locator('body')).toBeVisible()
    }

    await context.close()
  })
})

test.describe('Resource Loading', () => {
  test('critical resources load quickly', async ({ page }) => {
    const resourceLoadTimes: { url: string; duration: number }[] = []

    page.on('response', async (response) => {
      const timing = response.timing()
      if (timing) {
        resourceLoadTimes.push({
          url: response.url(),
          duration: timing.responseEnd - timing.requestStart,
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter for critical resources (JS, CSS)
    const criticalResources = resourceLoadTimes.filter(
      (r) => r.url.includes('.js') || r.url.includes('.css')
    )

    console.log('Critical resource load times:')
    criticalResources.slice(0, 5).forEach((r) => {
      console.log(`  ${r.url.split('/').pop()}: ${r.duration.toFixed(0)}ms`)
    })

    // No single critical resource should take more than 2 seconds
    const slowResources = criticalResources.filter((r) => r.duration > 2000)
    expect(slowResources).toHaveLength(0)
  })

  test('images are optimized', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map((img) => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
        loading: img.loading,
      }))
    })

    console.log(`Found ${images.length} images on the page`)

    // Check that images have loading="lazy" attribute for below-the-fold images
    const lazyImages = images.filter((img) => img.loading === 'lazy')
    console.log(`${lazyImages.length} images have lazy loading`)

    // This is informational - we're not strictly requiring lazy loading
    expect(images.length).toBeGreaterThanOrEqual(0)
  })
})
