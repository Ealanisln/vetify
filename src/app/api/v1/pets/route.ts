/**
 * API v1 Pets List/Create Endpoint
 *
 * GET /api/v1/pets - List pets
 * POST /api/v1/pets - Create a new pet
 *
 * Query Parameters (GET):
 * - locationId: Filter by location (string)
 * - customerId: Filter by customer (string)
 * - species: Filter by species (string)
 * - isDeceased: Filter by deceased status (boolean)
 * - limit: Number of results (default: 50, max: 100)
 * - offset: Number to skip (default: 0)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withApiAuth,
  parsePaginationParams,
  paginatedResponse,
  buildWhereClause,
  apiError,
} from '@/lib/api/api-key-auth';
import { serializePet, serializeCustomerSummary } from '../_shared/serializers';
import { triggerWebhookEvent } from '@/lib/webhooks';

// Validation schema for creating a pet
const createPetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  species: z.string().min(1, 'Species is required').max(50),
  breed: z.string().min(1, 'Breed is required').max(100),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  gender: z.enum(['male', 'female', 'unknown']),
  customerId: z.string().uuid('Invalid customer ID'),
  locationId: z.string().uuid().optional().nullable(),
  internalId: z.string().max(50).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  weightUnit: z.enum(['kg', 'lb']).optional().nullable(),
  microchipNumber: z.string().max(50).optional().nullable(),
  isNeutered: z.boolean().optional(),
  profileImage: z.string().url().optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(request);

    // Parse filters
    const customerId = searchParams.get('customerId');
    const species = searchParams.get('species');
    const isDeceasedParam = searchParams.get('isDeceased');
    const isDeceased =
      isDeceasedParam === 'true' ? true : isDeceasedParam === 'false' ? false : undefined;

    // Build base where clause with tenant and location
    const baseWhere = buildWhereClause(apiKey, locationId, {});

    const where = {
      ...baseWhere,
      ...(customerId && { customerId }),
      ...(species && { species: { equals: species, mode: 'insensitive' as const } }),
      ...(isDeceased !== undefined && { isDeceased }),
    };

    // Fetch pets and count in parallel
    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip: pagination.offset,
        take: pagination.limit,
      }),
      prisma.pet.count({ where }),
    ]);

    const serializedPets = pets.map((pet) => ({
      ...serializePet(pet),
      customer: serializeCustomerSummary(pet.customer),
    }));

    return NextResponse.json(paginatedResponse(serializedPets, total, pagination));
  },
  { requiredScope: 'read:pets' }
);

export const POST = withApiAuth(
  async (request, { apiKey, locationId }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    // Validate input
    const result = createPetSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenantId: apiKey.tenantId,
        isActive: true,
      },
    });

    if (!customer) {
      return apiError('Customer not found or inactive', 'NOT_FOUND', 404);
    }

    // If API key is scoped to a location, verify customer belongs to that location
    if (locationId && customer.locationId && customer.locationId !== locationId) {
      return apiError(
        'Customer does not belong to your location',
        'FORBIDDEN',
        403
      );
    }

    // Determine the effective location ID
    const effectiveLocationId = locationId || data.locationId || customer.locationId || null;

    // Validate location if provided
    if (effectiveLocationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: effectiveLocationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!location) {
        return apiError('Location not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Create the pet
    const pet = await prisma.pet.create({
      data: {
        tenantId: apiKey.tenantId,
        customerId: data.customerId,
        locationId: effectiveLocationId,
        name: data.name,
        species: data.species,
        breed: data.breed,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        internalId: data.internalId,
        weight: data.weight,
        weightUnit: data.weightUnit,
        microchipNumber: data.microchipNumber,
        isNeutered: data.isNeutered ?? false,
        profileImage: data.profileImage,
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
    triggerWebhookEvent(apiKey.tenantId, 'pet.created', {
      ...serializePet(pet),
      customer: serializeCustomerSummary(pet.customer),
    });

    return NextResponse.json(
      {
        data: {
          ...serializePet(pet),
          customer: serializeCustomerSummary(pet.customer),
        },
      },
      { status: 201 }
    );
  },
  { requiredScope: 'write:pets' }
);
