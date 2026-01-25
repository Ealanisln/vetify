/**
 * API v1 Pet Detail Endpoint
 *
 * GET /api/v1/pets/:id - Get a specific pet
 * PUT /api/v1/pets/:id - Update a pet
 * DELETE /api/v1/pets/:id - Delete a pet (or mark as deceased)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withApiAuth, apiError } from '@/lib/api/api-key-auth';
import { serializePet, serializeCustomerSummary } from '../../_shared/serializers';
import { triggerWebhookEvent } from '@/lib/webhooks';

// Validation schema for updating a pet
const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.string().min(1).max(50).optional(),
  breed: z.string().min(1).max(100).optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  locationId: z.string().uuid().optional().nullable(),
  internalId: z.string().max(50).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  weightUnit: z.enum(['kg', 'lb']).optional().nullable(),
  microchipNumber: z.string().max(50).optional().nullable(),
  isNeutered: z.boolean().optional(),
  isDeceased: z.boolean().optional(),
  profileImage: z.string().url().optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Pet ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const pet = await prisma.pet.findFirst({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!pet) {
      return apiError('Pet not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({
      data: {
        ...serializePet(pet),
        customer: serializeCustomerSummary(pet.customer),
      },
    });
  },
  { requiredScope: 'read:pets' }
);

export const PUT = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Pet ID is required', 'BAD_REQUEST', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    // Validate input
    const result = updatePetSchema.safeParse(body);
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

    // Check if pet exists
    const existing = await prisma.pet.findFirst({ where });
    if (!existing) {
      return apiError('Pet not found', 'NOT_FOUND', 404);
    }

    // Validate new locationId if provided
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

    // Update the pet
    const pet = await prisma.pet.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.species !== undefined && { species: data.species }),
        ...(data.breed !== undefined && { breed: data.breed }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.locationId !== undefined && { locationId: data.locationId }),
        ...(data.internalId !== undefined && { internalId: data.internalId }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.weightUnit !== undefined && { weightUnit: data.weightUnit }),
        ...(data.microchipNumber !== undefined && { microchipNumber: data.microchipNumber }),
        ...(data.isNeutered !== undefined && { isNeutered: data.isNeutered }),
        ...(data.isDeceased !== undefined && { isDeceased: data.isDeceased }),
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Trigger webhook event (fire-and-forget)
    triggerWebhookEvent(apiKey.tenantId, 'pet.updated', {
      ...serializePet(pet),
      customer: serializeCustomerSummary(pet.customer),
    });

    return NextResponse.json({
      data: {
        ...serializePet(pet),
        customer: serializeCustomerSummary(pet.customer),
      },
    });
  },
  { requiredScope: 'write:pets' }
);

export const DELETE = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Pet ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Check if pet exists
    const existing = await prisma.pet.findFirst({ where });
    if (!existing) {
      return apiError('Pet not found', 'NOT_FOUND', 404);
    }

    // Mark as deceased instead of hard delete to preserve medical history
    const pet = await prisma.pet.update({
      where: { id },
      data: { isDeceased: true },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Trigger webhook event (fire-and-forget)
    triggerWebhookEvent(apiKey.tenantId, 'pet.deleted', {
      ...serializePet(pet),
      customer: serializeCustomerSummary(pet.customer),
    });

    return new NextResponse(null, { status: 204 });
  },
  { requiredScope: 'write:pets' }
);
