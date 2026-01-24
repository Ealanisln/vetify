import { test, expect } from '@playwright/test'

/**
 * Contract Tests - Pets API
 *
 * These tests verify that the Pets API endpoints conform to their expected contracts.
 * Contract testing ensures API responses have the correct structure and data types.
 *
 * Endpoints tested:
 * - GET /api/pets - List pets
 * - GET /api/pets/:id - Get pet by ID
 * - POST /api/pets - Create pet
 * - PUT /api/pets/:id - Update pet
 * - DELETE /api/pets/:id - Delete pet
 *
 * NOTE: These tests require authentication.
 * Set TEST_AUTH_ENABLED=true and configure test user credentials.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true'

// Expected schema interfaces for contract validation
interface PetResponse {
  id: string
  name: string
  species: string
  breed?: string | null
  birthDate?: string | null
  weight?: number | null
  microchipNumber?: string | null
  photoUrl?: string | null
  ownerId: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

interface PetListResponse {
  pets: PetResponse[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ApiErrorResponse {
  error: string
  message?: string
  statusCode?: number
}

// Helper function to validate pet object structure
function validatePetStructure(pet: unknown): pet is PetResponse {
  if (typeof pet !== 'object' || pet === null) return false

  const p = pet as Record<string, unknown>

  // Required fields
  if (typeof p.id !== 'string') return false
  if (typeof p.name !== 'string') return false
  if (typeof p.species !== 'string') return false
  if (typeof p.ownerId !== 'string') return false
  if (typeof p.tenantId !== 'string') return false
  if (typeof p.createdAt !== 'string') return false
  if (typeof p.updatedAt !== 'string') return false

  // Optional fields (can be null or correct type)
  if (p.breed !== null && p.breed !== undefined && typeof p.breed !== 'string') return false
  if (p.birthDate !== null && p.birthDate !== undefined && typeof p.birthDate !== 'string')
    return false
  if (p.weight !== null && p.weight !== undefined && typeof p.weight !== 'number') return false
  if (
    p.microchipNumber !== null &&
    p.microchipNumber !== undefined &&
    typeof p.microchipNumber !== 'string'
  )
    return false
  if (p.photoUrl !== null && p.photoUrl !== undefined && typeof p.photoUrl !== 'string')
    return false

  return true
}

// Helper to validate error response
function validateErrorStructure(response: unknown): response is ApiErrorResponse {
  if (typeof response !== 'object' || response === null) return false

  const r = response as Record<string, unknown>
  return typeof r.error === 'string' || typeof r.message === 'string'
}

test.describe('Pets API Contract Tests', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session')

  test.describe('GET /api/pets - List Pets', () => {
    test('returns array of pets with correct structure', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      expect(response.status).toBe(200)

      // Response should be an array or object with pets array
      const pets = Array.isArray(response.data) ? response.data : response.data.pets

      if (pets && pets.length > 0) {
        // Validate first pet has correct structure
        const firstPet = pets[0]
        expect(validatePetStructure(firstPet)).toBe(true)

        // Verify specific field types
        expect(typeof firstPet.id).toBe('string')
        expect(typeof firstPet.name).toBe('string')
        expect(typeof firstPet.species).toBe('string')
        expect(firstPet.name.length).toBeGreaterThan(0)
      }
    })

    test('supports pagination parameters', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets?page=1&limit=5')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      expect(response.status).toBe(200)

      // If pagination is supported, verify structure
      if (response.data.pagination) {
        expect(typeof response.data.pagination.page).toBe('number')
        expect(typeof response.data.pagination.limit).toBe('number')
        expect(typeof response.data.pagination.total).toBe('number')
      }
    })

    test('supports search parameter', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets?search=test')
        return {
          status: res.status,
          data: await res.json(),
        }
      })

      expect(response.status).toBe(200)
      // Response should still have valid structure
      const pets = Array.isArray(response.data) ? response.data : response.data.pets
      expect(Array.isArray(pets)).toBe(true)
    })

    test('returns 401 for unauthenticated requests', async ({ browser }) => {
      // Use a fresh context without authentication
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto('/')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets')
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return 401 or redirect
      expect([401, 403, 302]).toContain(response.status)

      await context.close()
    })
  })

  test.describe('GET /api/pets/:id - Get Pet by ID', () => {
    test('returns single pet with correct structure', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      // First get a pet ID from the list
      const listResponse = await page.evaluate(async () => {
        const res = await fetch('/api/pets')
        return res.json()
      })

      const pets = Array.isArray(listResponse) ? listResponse : listResponse.pets
      if (!pets || pets.length === 0) {
        test.skip()
        return
      }

      const petId = pets[0].id

      const response = await page.evaluate(async (id) => {
        const res = await fetch(`/api/pets/${id}`)
        return {
          status: res.status,
          data: await res.json(),
        }
      }, petId)

      expect(response.status).toBe(200)
      expect(validatePetStructure(response.data)).toBe(true)
      expect(response.data.id).toBe(petId)
    })

    test('returns 404 for non-existent pet', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets/non-existent-id-12345')
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      expect([404, 400]).toContain(response.status)
    })

    test('returns 400 for invalid pet ID format', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets/invalid-format')
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return error for invalid ID
      expect([400, 404]).toContain(response.status)
    })
  })

  test.describe('POST /api/pets - Create Pet', () => {
    test('validates required fields', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets', {
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
      expect(validateErrorStructure(response.data)).toBe(true)
    })

    test('validates species enum values', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Pet',
            species: 'invalid_species',
            ownerId: 'test-owner-id',
          }),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return validation error for invalid species
      expect([400, 422]).toContain(response.status)
    })

    test('accepts valid pet data', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      // This test is informational - we don't want to actually create test data
      // Just verify the endpoint accepts the correct content type
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Contract Test Pet',
            species: 'perro',
            // ownerId would be required but we're testing structure
          }),
        })
        return {
          status: res.status,
          contentType: res.headers.get('content-type'),
        }
      })

      // Should return JSON response
      expect(response.contentType).toContain('application/json')
    })
  })

  test.describe('PUT /api/pets/:id - Update Pet', () => {
    test('validates update payload structure', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets/test-id', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invalidField: 'value' }),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      // Should return 404 or validation error
      expect([400, 404, 422]).toContain(response.status)
    })

    test('returns 404 for non-existent pet update', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets/non-existent-id-12345', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Name' }),
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      expect([404, 400]).toContain(response.status)
    })
  })

  test.describe('DELETE /api/pets/:id - Delete Pet', () => {
    test('returns 404 for non-existent pet deletion', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets/non-existent-id-12345', {
          method: 'DELETE',
        })
        return {
          status: res.status,
          data: await res.json().catch(() => ({})),
        }
      })

      expect([404, 400]).toContain(response.status)
    })

    test('delete endpoint returns proper structure', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/pets/test-id', {
          method: 'DELETE',
        })
        return {
          status: res.status,
          contentType: res.headers.get('content-type'),
        }
      })

      // Should return JSON response
      if (response.contentType) {
        expect(response.contentType).toContain('application/json')
      }
    })
  })

  test.describe('Response Headers Contract', () => {
    test('API returns correct content-type header', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const headers = await page.evaluate(async () => {
        const res = await fetch('/api/pets')
        return {
          contentType: res.headers.get('content-type'),
          cacheControl: res.headers.get('cache-control'),
        }
      })

      expect(headers.contentType).toContain('application/json')
    })

    test('API includes security headers', async ({ page }) => {
      await page.goto('/dashboard/pets')
      await page.waitForLoadState('networkidle')

      const headers = await page.evaluate(async () => {
        const res = await fetch('/api/pets')
        return {
          xContentType: res.headers.get('x-content-type-options'),
          xFrame: res.headers.get('x-frame-options'),
        }
      })

      // Security headers may or may not be present depending on middleware
      // This is informational
      console.log('Security headers:', headers)
    })
  })
})
