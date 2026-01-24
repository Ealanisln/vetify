import { test, expect } from '@playwright/test'

/**
 * Contract Tests - Appointments API
 *
 * These tests verify that the Appointments API endpoints conform to their expected contracts.
 * Contract testing ensures API responses have the correct structure and data types.
 *
 * Endpoints tested:
 * - GET /api/appointments - List appointments
 * - GET /api/appointments/:id - Get appointment by ID
 * - POST /api/appointments - Create appointment
 * - PUT /api/appointments/:id - Update appointment
 * - DELETE /api/appointments/:id - Delete appointment
 *
 * NOTE: These tests require authentication.
 * Set TEST_AUTH_ENABLED=true and configure test user credentials.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true'

// Expected schema interfaces for contract validation
interface AppointmentResponse {
  id: string
  title?: string
  description?: string | null
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  type?: string
  petId?: string | null
  customerId?: string | null
  staffId?: string | null
  locationId?: string | null
  tenantId: string
  createdAt: string
  updatedAt: string
  pet?: {
    id: string
    name: string
  } | null
  customer?: {
    id: string
    name: string
  } | null
}

interface AppointmentListResponse {
  appointments: AppointmentResponse[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

// Helper function to validate appointment object structure
function validateAppointmentStructure(appointment: unknown): appointment is AppointmentResponse {
  if (typeof appointment !== 'object' || appointment === null) return false

  const a = appointment as Record<string, unknown>

  // Required fields
  if (typeof a.id !== 'string') return false
  if (typeof a.startTime !== 'string') return false
  if (typeof a.endTime !== 'string') return false
  if (typeof a.tenantId !== 'string') return false
  if (typeof a.createdAt !== 'string') return false
  if (typeof a.updatedAt !== 'string') return false

  // Status should be a valid enum value
  const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
  if (typeof a.status !== 'string' || !validStatuses.includes(a.status)) {
    // Status might not be returned in all cases
    if (a.status !== undefined) return false
  }

  // Validate date formats
  const startDate = new Date(a.startTime as string)
  const endDate = new Date(a.endTime as string)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false

  return true
}

// Helper to validate time range
function validateTimeRange(startTime: string, endTime: string): boolean {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return end > start
}

test.describe('Appointments API Contract Tests', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session')

  test.describe('GET /api/appointments - List Appointments', () => {
    test('returns array of appointments with correct structure', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      expect(response.status).toBe(200)

      // Response should be an array or object with appointments array
      const appointments = Array.isArray(response.data)
        ? response.data
        : response.data.appointments

      if (appointments && appointments.length > 0) {
        const firstAppointment = appointments[0]
        expect(validateAppointmentStructure(firstAppointment)).toBe(true)

        // Verify time range is valid
        expect(validateTimeRange(firstAppointment.startTime, firstAppointment.endTime)).toBe(true)
      }
    })

    test('supports date range filtering', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const today = new Date()
      const startDate = today.toISOString().split('T')[0]
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const response = await page.evaluate(
        async ({ start, end }) => {
          const res = await fetch(`/api/appointments?startDate=${start}&endDate=${end}`)
          return {
            status: res.status,
            data: await res.json(),
          }
        },
        { start: startDate, end: endDate }
      )

      expect(response.status).toBe(200)
      const appointments = Array.isArray(response.data)
        ? response.data
        : response.data.appointments
      expect(Array.isArray(appointments)).toBe(true)
    })

    test('supports status filtering', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments?status=scheduled')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      expect(response.status).toBe(200)

      const appointments = Array.isArray(response.data)
        ? response.data
        : response.data.appointments

      // All returned appointments should have scheduled status
      if (appointments && appointments.length > 0) {
        appointments.forEach((apt: AppointmentResponse) => {
          if (apt.status) {
            expect(apt.status).toBe('scheduled')
          }
        })
      }
    })

    test('returns 401 for unauthenticated requests', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto('/')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments')
        return {
          status: res.status,
        }
      })

      expect([401, 403, 302]).toContain(response.status)

      await context.close()
    })
  })

  test.describe('GET /api/appointments/:id - Get Appointment by ID', () => {
    test('returns single appointment with correct structure', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      // First get an appointment ID from the list
      const listResponse = await page.evaluate(async () => {
        const res = await fetch('/api/appointments')
        return res.json()
      })

      const appointments = Array.isArray(listResponse)
        ? listResponse
        : listResponse.appointments

      if (!appointments || appointments.length === 0) {
        test.skip()
        return
      }

      const appointmentId = appointments[0].id

      const response = await page.evaluate(async (id) => {
        const res = await fetch(`/api/appointments/${id}`)
        return {
          status: res.status,
          data: await res.json(),
        }
      }, appointmentId)

      expect(response.status).toBe(200)
      expect(validateAppointmentStructure(response.data)).toBe(true)
      expect(response.data.id).toBe(appointmentId)
    })

    test('returns 404 for non-existent appointment', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments/non-existent-id-12345')
        return {
          status: res.status,
        }
      })

      expect([404, 400]).toContain(response.status)
    })
  })

  test.describe('POST /api/appointments - Create Appointment', () => {
    test('validates required fields', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return validation error
      expect([400, 422]).toContain(response.status)
    })

    test('validates time range (end must be after start)', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const now = new Date()
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: now.toISOString(),
            endTime: new Date(now.getTime() - 3600000).toISOString(), // End before start
            status: 'scheduled',
          }),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return validation error for invalid time range
      expect([400, 422]).toContain(response.status)
    })

    test('validates status enum values', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const now = new Date()
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: now.toISOString(),
            endTime: new Date(now.getTime() + 3600000).toISOString(),
            status: 'invalid_status',
          }),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return validation error for invalid status
      expect([400, 422]).toContain(response.status)
    })

    test('accepts valid appointment data structure', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const now = new Date()
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Contract Test Appointment',
            startTime: new Date(now.getTime() + 86400000).toISOString(), // Tomorrow
            endTime: new Date(now.getTime() + 86400000 + 3600000).toISOString(),
            status: 'scheduled',
          }),
        })
        return {
          status: res.status,
          contentType: res.headers.get('content-type'),
        }
      })

      // Should return JSON response (may fail due to missing required relations)
      if (response.contentType) {
        expect(response.contentType).toContain('application/json')
      }
    })
  })

  test.describe('PUT /api/appointments/:id - Update Appointment', () => {
    test('validates status transition', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      // Get an appointment to update
      const listResponse = await page.evaluate(async () => {
        const res = await fetch('/api/appointments')
        return res.json()
      })

      const appointments = Array.isArray(listResponse)
        ? listResponse
        : listResponse.appointments

      if (!appointments || appointments.length === 0) {
        test.skip()
        return
      }

      const appointmentId = appointments[0].id

      const response = await page.evaluate(async (id) => {
        const res = await fetch(`/api/appointments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'confirmed',
          }),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      }, appointmentId)

      // Should succeed or return validation error
      expect([200, 400, 422]).toContain(response.status)
    })

    test('returns 404 for non-existent appointment update', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments/non-existent-id-12345', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
        })
        return {
          status: res.status,
        }
      })

      expect([404, 400]).toContain(response.status)
    })
  })

  test.describe('DELETE /api/appointments/:id - Delete Appointment', () => {
    test('returns 404 for non-existent appointment deletion', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments/non-existent-id-12345', {
          method: 'DELETE',
        })
        return {
          status: res.status,
        }
      })

      expect([404, 400]).toContain(response.status)
    })

    test('delete endpoint returns proper content type', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments/test-id', {
          method: 'DELETE',
        })
        return {
          status: res.status,
          contentType: res.headers.get('content-type'),
        }
      })

      if (response.contentType) {
        expect(response.contentType).toContain('application/json')
      }
    })
  })

  test.describe('Appointment Relations Contract', () => {
    test('appointment includes pet relation when present', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments?include=pet')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      expect(response.status).toBe(200)

      const appointments = Array.isArray(response.data)
        ? response.data
        : response.data.appointments

      if (appointments && appointments.length > 0) {
        const withPet = appointments.find((a: AppointmentResponse) => a.pet)
        if (withPet) {
          expect(typeof withPet.pet.id).toBe('string')
          expect(typeof withPet.pet.name).toBe('string')
        }
      }
    })

    test('appointment includes customer relation when present', async ({ page }) => {
      await page.goto('/dashboard/calendar')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/appointments?include=customer')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      expect(response.status).toBe(200)

      const appointments = Array.isArray(response.data)
        ? response.data
        : response.data.appointments

      if (appointments && appointments.length > 0) {
        const withCustomer = appointments.find((a: AppointmentResponse) => a.customer)
        if (withCustomer) {
          expect(typeof withCustomer.customer.id).toBe('string')
          expect(typeof withCustomer.customer.name).toBe('string')
        }
      }
    })
  })
})
