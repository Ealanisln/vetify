import { test, expect } from '@playwright/test'

/**
 * Contract Tests - Subscription API
 *
 * These tests verify that the Subscription API endpoints conform to their expected contracts.
 * Contract testing ensures API responses have the correct structure and data types.
 *
 * Endpoints tested:
 * - GET /api/subscription/status - Get subscription status
 * - GET /api/trial/check-access - Check trial access
 * - POST /api/subscription/create-checkout - Create Stripe checkout
 * - POST /api/subscription/create-portal - Create Stripe portal
 *
 * NOTE: These tests require authentication.
 * Set TEST_AUTH_ENABLED=true and configure test user credentials.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true'

// Expected schema interfaces for contract validation
interface SubscriptionStatus {
  isActive: boolean
  isTrialPeriod: boolean
  planName: string | null
  planId: string | null
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'past_due' | 'none'
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  trialEndsAt?: string | null
  daysRemaining?: number | null
}

interface TrialAccessResponse {
  hasAccess: boolean
  isTrialPeriod: boolean
  trialEndsAt?: string | null
  daysRemaining?: number | null
  message?: string
}

interface CheckoutResponse {
  url: string
  sessionId: string
}

interface PortalResponse {
  url: string
}

// Helper function to validate subscription status structure
function validateSubscriptionStatusStructure(status: unknown): status is SubscriptionStatus {
  if (typeof status !== 'object' || status === null) return false

  const s = status as Record<string, unknown>

  // Required boolean fields
  if (typeof s.isActive !== 'boolean') return false
  if (typeof s.isTrialPeriod !== 'boolean') return false

  // Status should be a valid enum value
  const validStatuses = ['active', 'trial', 'expired', 'cancelled', 'past_due', 'none']
  if (typeof s.status !== 'string' || !validStatuses.includes(s.status)) return false

  // Plan name can be string or null
  if (s.planName !== null && typeof s.planName !== 'string') return false

  return true
}

// Helper function to validate trial access response
function validateTrialAccessStructure(response: unknown): response is TrialAccessResponse {
  if (typeof response !== 'object' || response === null) return false

  const r = response as Record<string, unknown>

  if (typeof r.hasAccess !== 'boolean') return false
  if (typeof r.isTrialPeriod !== 'boolean') return false

  return true
}

test.describe('Subscription API Contract Tests', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session')

  test.describe('GET /api/subscription/status - Subscription Status', () => {
    test('returns subscription status with correct structure', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/status')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      // May return 401 if not properly authenticated
      if (response.status === 200) {
        expect(validateSubscriptionStatusStructure(response.data)).toBe(true)

        // Verify boolean fields
        expect(typeof response.data.isActive).toBe('boolean')
        expect(typeof response.data.isTrialPeriod).toBe('boolean')

        // Verify status is one of expected values
        expect([
          'active',
          'trial',
          'expired',
          'cancelled',
          'past_due',
          'none',
        ]).toContain(response.data.status)
      } else {
        expect([401, 403]).toContain(response.status)
      }
    })

    test('returns consistent status values', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/status')
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      if (response.status === 200 && response.data) {
        // If isActive is true, status should be 'active' or 'trial'
        if (response.data.isActive) {
          expect(['active', 'trial']).toContain(response.data.status)
        }

        // If isTrialPeriod is true, status should be 'trial'
        if (response.data.isTrialPeriod) {
          expect(response.data.status).toBe('trial')
          expect(response.data.trialEndsAt).toBeDefined()
        }

        // daysRemaining should be a number if present
        if (response.data.daysRemaining !== undefined && response.data.daysRemaining !== null) {
          expect(typeof response.data.daysRemaining).toBe('number')
          expect(response.data.daysRemaining).toBeGreaterThanOrEqual(0)
        }
      }
    })

    test('returns 401 for unauthenticated requests', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto('/')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/status')
        return {
          status: res.status,
        }
      })

      expect([401, 403, 302]).toContain(response.status)

      await context.close()
    })
  })

  test.describe('GET /api/trial/check-access - Trial Access Check', () => {
    test('returns trial access with correct structure', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/trial/check-access')
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      if (response.status === 200) {
        expect(validateTrialAccessStructure(response.data)).toBe(true)

        // Verify boolean fields
        expect(typeof response.data.hasAccess).toBe('boolean')
        expect(typeof response.data.isTrialPeriod).toBe('boolean')
      } else {
        expect([401, 403]).toContain(response.status)
      }
    })

    test('trial access is consistent with subscription status', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const responses = await page.evaluate(async () => {
        const [statusRes, accessRes] = await Promise.all([
          fetch('/api/subscription/status'),
          fetch('/api/trial/check-access'),
        ])

        return {
          status: {
            code: statusRes.status,
            data: await statusRes.json().catch(() => ({})),
          },
          access: {
            code: accessRes.status,
            data: await accessRes.json().catch(() => ({})),
          },
        }
      })

      // If both endpoints return 200, their data should be consistent
      if (responses.status.code === 200 && responses.access.code === 200) {
        // isTrialPeriod should match
        expect(responses.status.data.isTrialPeriod).toBe(responses.access.data.isTrialPeriod)

        // If subscription is active, user should have access
        if (responses.status.data.isActive) {
          expect(responses.access.data.hasAccess).toBe(true)
        }
      }
    })

    test('returns 401 for unauthenticated requests', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto('/')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/trial/check-access')
        return {
          status: res.status,
        }
      })

      expect([401, 403, 302]).toContain(response.status)

      await context.close()
    })
  })

  test.describe('POST /api/subscription/create-checkout - Create Checkout', () => {
    test('validates required priceId parameter', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return validation error for missing priceId
      expect([400, 422]).toContain(response.status)
    })

    test('returns checkout URL structure for valid request', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: 'price_test_123', // Test price ID
          }),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
          contentType: res.headers.get('content-type'),
        }
      })

      // Should return JSON response
      if (response.contentType) {
        expect(response.contentType).toContain('application/json')
      }

      // If successful, should have URL
      if (response.status === 200) {
        expect(typeof response.data.url).toBe('string')
        expect(response.data.url).toContain('stripe.com')
      }
    })

    test('returns 401 for unauthenticated requests', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto('/')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: 'price_test_123' }),
        })
        return {
          status: res.status,
        }
      })

      expect([401, 403, 302]).toContain(response.status)

      await context.close()
    })
  })

  test.describe('POST /api/subscription/create-portal - Create Portal', () => {
    test('returns portal URL structure', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/create-portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
          contentType: res.headers.get('content-type'),
        }
      })

      // Should return JSON response
      if (response.contentType) {
        expect(response.contentType).toContain('application/json')
      }

      // If successful, should have URL
      if (response.status === 200) {
        expect(typeof response.data.url).toBe('string')
        expect(response.data.url).toContain('stripe.com')
      }
    })

    test('returns 401 for unauthenticated requests', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto('/')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/create-portal', {
          method: 'POST',
        })
        return {
          status: res.status,
        }
      })

      expect([401, 403, 302]).toContain(response.status)

      await context.close()
    })
  })

  test.describe('Plan Limits Contract', () => {
    test('plan limits endpoint returns correct structure', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/subscription/limits')
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      if (response.status === 200) {
        // Limits should have numeric values
        const limits = response.data
        if (limits.maxPets !== undefined) {
          expect(typeof limits.maxPets).toBe('number')
        }
        if (limits.maxCustomers !== undefined) {
          expect(typeof limits.maxCustomers).toBe('number')
        }
        if (limits.maxLocations !== undefined) {
          expect(typeof limits.maxLocations).toBe('number')
        }
        if (limits.maxStaff !== undefined) {
          expect(typeof limits.maxStaff).toBe('number')
        }
      }
    })
  })

  test.describe('Feature Access Contract', () => {
    test('feature access check returns correct structure', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const features = ['inventory', 'reports', 'automations', 'multi_location']

      for (const feature of features) {
        const response = await page.evaluate(async (f) => {
          const res = await fetch(`/api/subscription/feature-access?feature=${f}`)
          return {
            status: res.status,
            data: await res.json().catch(() => ({})),
          }
        }, feature)

        if (response.status === 200) {
          // Should have hasAccess boolean
          expect(typeof response.data.hasAccess).toBe('boolean')
        }
      }
    })
  })

  test.describe('Webhook Contract (Structure Only)', () => {
    test('webhook endpoint exists and returns proper error for invalid signature', async ({
      page,
    }) => {
      await page.goto('/')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/webhooks/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 'invalid_signature',
          },
          body: JSON.stringify({ type: 'test' }),
        })
        return {
          status: res.status,
        }
      })

      // Should return error for invalid signature (400 or 401)
      expect([400, 401, 403]).toContain(response.status)
    })
  })
})
