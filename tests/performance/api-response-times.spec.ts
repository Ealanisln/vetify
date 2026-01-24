import { test, expect } from '@playwright/test'

/**
 * Performance Tests - API Response Times
 *
 * These tests verify that API endpoints respond within acceptable time thresholds.
 *
 * Performance targets:
 * - Standard API endpoints: < 500ms
 * - Health check: < 100ms
 * - Version endpoint: < 100ms
 *
 * NOTE: Some tests require authentication.
 * Set TEST_AUTH_ENABLED=true and configure test user credentials.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true'

// Performance thresholds in milliseconds
const THRESHOLDS = {
  STANDARD_API: 500, // 500ms for standard API calls
  FAST_API: 100, // 100ms for lightweight endpoints
  WEBHOOK_VERIFY: 1000, // 1s for webhook verification
}

interface ApiTimingResult {
  url: string
  method: string
  status: number
  responseTime: number
}

async function measureApiCall(
  page: import('@playwright/test').Page,
  url: string,
  options: {
    method?: string
    body?: string
    headers?: Record<string, string>
  } = {}
): Promise<ApiTimingResult> {
  const { method = 'GET', body, headers } = options

  const startTime = Date.now()

  const response = await page.evaluate(
    async ({ url, method, body, headers }) => {
      const res = await fetch(url, {
        method,
        body,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      })
      return {
        status: res.status,
        ok: res.ok,
      }
    },
    { url, method, body, headers }
  )

  const responseTime = Date.now() - startTime

  return {
    url,
    method,
    status: response.status,
    responseTime,
  }
}

test.describe('Public API Response Times', () => {
  test('health check endpoint responds quickly', async ({ page }) => {
    await page.goto('/')

    const result = await measureApiCall(page, '/api/health')

    console.log(`Health check: ${result.responseTime}ms (target: ${THRESHOLDS.FAST_API}ms)`)

    expect(result.status).toBe(200)
    expect(result.responseTime).toBeLessThan(THRESHOLDS.FAST_API)
  })

  test('version endpoint responds quickly', async ({ page }) => {
    await page.goto('/')

    const result = await measureApiCall(page, '/api/version')

    console.log(`Version endpoint: ${result.responseTime}ms (target: ${THRESHOLDS.FAST_API}ms)`)

    expect(result.status).toBe(200)
    expect(result.responseTime).toBeLessThan(THRESHOLDS.FAST_API)
  })
})

test.describe('Authenticated API Response Times', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session')

  test('trial check endpoint responds within target', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const result = await measureApiCall(page, '/api/trial/check-access')

    console.log(
      `Trial check endpoint: ${result.responseTime}ms (target: ${THRESHOLDS.STANDARD_API}ms)`
    )

    // 401 is acceptable if not authenticated
    expect([200, 401]).toContain(result.status)
    expect(result.responseTime).toBeLessThan(THRESHOLDS.STANDARD_API)
  })

  test('subscription status endpoint responds within target', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const result = await measureApiCall(page, '/api/subscription/status')

    console.log(
      `Subscription status: ${result.responseTime}ms (target: ${THRESHOLDS.STANDARD_API}ms)`
    )

    expect([200, 401, 404]).toContain(result.status)
    expect(result.responseTime).toBeLessThan(THRESHOLDS.STANDARD_API)
  })
})

test.describe('API Response Time Monitoring', () => {
  test('monitor multiple API calls during navigation', async ({ page }) => {
    const apiCalls: ApiTimingResult[] = []

    // Intercept all API calls
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/')) {
        const timing = response.timing()
        apiCalls.push({
          url: url.replace(page.url(), ''),
          method: response.request().method(),
          status: response.status(),
          responseTime: timing ? timing.responseEnd - timing.requestStart : 0,
        })
      }
    })

    // Navigate through the app
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    console.log('API calls during page load:')
    apiCalls.forEach((call) => {
      const status = call.responseTime > THRESHOLDS.STANDARD_API ? '⚠️' : '✓'
      console.log(`  ${status} ${call.method} ${call.url}: ${call.responseTime.toFixed(0)}ms`)
    })

    // Check that no API call exceeded the threshold significantly
    const slowCalls = apiCalls.filter((call) => call.responseTime > THRESHOLDS.STANDARD_API * 2)

    if (slowCalls.length > 0) {
      console.log('Slow API calls detected:')
      slowCalls.forEach((call) => {
        console.log(`  ${call.method} ${call.url}: ${call.responseTime.toFixed(0)}ms`)
      })
    }

    // Allow some tolerance - warn but don't fail for slightly slow calls
    expect(slowCalls.length).toBeLessThan(3)
  })

  test('dashboard navigation API performance', async ({ page }) => {
    test.skip(!isAuthTestEnabled, 'Requires authenticated session')

    const apiCalls: ApiTimingResult[] = []

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/')) {
        const timing = response.timing()
        apiCalls.push({
          url: new URL(url).pathname,
          method: response.request().method(),
          status: response.status(),
          responseTime: timing ? timing.responseEnd - timing.requestStart : 0,
        })
      }
    })

    // Navigate through dashboard pages
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    await page.goto('/dashboard/pets')
    await page.waitForLoadState('networkidle')

    await page.goto('/dashboard/calendar')
    await page.waitForLoadState('networkidle')

    console.log('Dashboard API calls summary:')
    console.log(`  Total API calls: ${apiCalls.length}`)

    if (apiCalls.length > 0) {
      const avgTime = apiCalls.reduce((sum, call) => sum + call.responseTime, 0) / apiCalls.length
      const maxTime = Math.max(...apiCalls.map((call) => call.responseTime))

      console.log(`  Average response time: ${avgTime.toFixed(0)}ms`)
      console.log(`  Max response time: ${maxTime.toFixed(0)}ms`)

      expect(avgTime).toBeLessThan(THRESHOLDS.STANDARD_API)
    }
  })
})

test.describe('API Concurrent Load', () => {
  test('handles multiple concurrent API calls', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const endpoints = ['/api/health', '/api/version']

    const startTime = Date.now()

    const results = await page.evaluate(async (endpoints) => {
      const promises = endpoints.map(async (url) => {
        const start = performance.now()
        const response = await fetch(url)
        const end = performance.now()
        return {
          url,
          status: response.status,
          time: end - start,
        }
      })
      return Promise.all(promises)
    }, endpoints)

    const totalTime = Date.now() - startTime

    console.log('Concurrent API calls results:')
    results.forEach((r) => {
      console.log(`  ${r.url}: ${r.time.toFixed(0)}ms (status: ${r.status})`)
    })
    console.log(`  Total time: ${totalTime}ms`)

    // All calls should succeed
    results.forEach((r) => {
      expect(r.status).toBe(200)
    })

    // Concurrent calls should complete faster than sequential
    expect(totalTime).toBeLessThan(THRESHOLDS.FAST_API * endpoints.length)
  })

  test('API responds consistently under repeated calls', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const iterations = 5
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const result = await measureApiCall(page, '/api/health')
      times.push(result.responseTime)
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const maxTime = Math.max(...times)
    const minTime = Math.min(...times)
    const variance = maxTime - minTime

    console.log(`Health check consistency (${iterations} calls):`)
    console.log(`  Average: ${avgTime.toFixed(0)}ms`)
    console.log(`  Min: ${minTime}ms`)
    console.log(`  Max: ${maxTime}ms`)
    console.log(`  Variance: ${variance}ms`)

    // Response times should be consistent (variance < 200ms)
    expect(variance).toBeLessThan(200)
    expect(avgTime).toBeLessThan(THRESHOLDS.FAST_API)
  })
})

test.describe('API Error Response Times', () => {
  test('404 responses are fast', async ({ page }) => {
    await page.goto('/')

    const result = await measureApiCall(page, '/api/nonexistent-endpoint-12345')

    console.log(`404 response time: ${result.responseTime}ms`)

    expect(result.status).toBe(404)
    // Error responses should be fast
    expect(result.responseTime).toBeLessThan(THRESHOLDS.FAST_API)
  })

  test('unauthorized responses are fast', async ({ page }) => {
    await page.goto('/')

    // Try to access an authenticated endpoint without auth
    const result = await measureApiCall(page, '/api/trial/check-access')

    console.log(`Unauthorized response time: ${result.responseTime}ms`)

    // 401 response should be fast
    expect(result.responseTime).toBeLessThan(THRESHOLDS.STANDARD_API)
  })
})

test.describe('WebSocket/Real-time Performance', () => {
  test.skip(true, 'WebSocket tests not implemented - add when real-time features are added')

  test('websocket connection establishes quickly', async () => {
    // Placeholder for future WebSocket performance tests
  })
})
