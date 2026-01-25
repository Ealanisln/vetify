/**
 * API v1 Customer Detail Endpoint
 *
 * GET /api/v1/customers/:id - Get a specific customer
 * PUT /api/v1/customers/:id - Update a customer
 * DELETE /api/v1/customers/:id - Delete a customer (soft delete by setting isActive=false)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withApiAuth, apiError } from '@/lib/api/api-key-auth';
import { serializeCustomer } from '../../_shared/serializers';

// Validation schema for updating a customer
const updateCustomerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  preferredContactMethod: z.enum(['phone', 'email', 'sms']).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  locationId: z.string().uuid().optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Customer ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause - check tenant and optionally location
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    // If API key is scoped to a location, only allow access to customers at that location
    if (locationId) {
      where.locationId = locationId;
    }

    const customer = await prisma.customer.findFirst({
      where,
      include: {
        pets: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
      },
    });

    if (!customer) {
      return apiError('Customer not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({
      data: {
        ...serializeCustomer(customer),
        pets: customer.pets.map((pet) => ({
          id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
        })),
      },
    });
  },
  { requiredScope: 'read:customers' }
);

export const PUT = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Customer ID is required', 'BAD_REQUEST', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    // Validate input
    const result = updateCustomerSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Check if customer exists
    const existing = await prisma.customer.findFirst({ where });
    if (!existing) {
      return apiError('Customer not found', 'NOT_FOUND', 404);
    }

    // Validate new locationId if provided and different
    if (data.locationId && data.locationId !== existing.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: data.locationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!location) {
        return apiError('Location not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Update the customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.preferredContactMethod !== undefined && {
          preferredContactMethod: data.preferredContactMethod,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.locationId !== undefined && { locationId: data.locationId }),
      },
    });

    return NextResponse.json({ data: serializeCustomer(customer) });
  },
  { requiredScope: 'write:customers' }
);

export const DELETE = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Customer ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Check if customer exists
    const existing = await prisma.customer.findFirst({ where });
    if (!existing) {
      return apiError('Customer not found', 'NOT_FOUND', 404);
    }

    // Soft delete by setting isActive to false
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return new NextResponse(null, { status: 204 });
  },
  { requiredScope: 'write:customers' }
);
