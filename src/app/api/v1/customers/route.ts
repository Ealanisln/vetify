/**
 * API v1 Customers List/Create Endpoint
 *
 * GET /api/v1/customers - List customers
 * POST /api/v1/customers - Create a new customer
 *
 * Query Parameters (GET):
 * - locationId: Filter by location (string)
 * - search: Search by name, email, or phone (string)
 * - isActive: Filter by active status (boolean)
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
import { serializeCustomer } from '../_shared/serializers';

// Validation schema for creating a customer
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email().optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  preferredContactMethod: z.enum(['phone', 'email', 'sms']).optional().nullable(),
  notes: z.string().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(request);

    // Parse filters
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    // Build base where clause with tenant and location
    const baseWhere = buildWhereClause(apiKey, locationId, {});

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const where = {
      ...baseWhere,
      ...(isActive !== undefined && { isActive }),
      ...searchConditions,
    };

    // Fetch customers and count in parallel
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.offset,
        take: pagination.limit,
      }),
      prisma.customer.count({ where }),
    ]);

    const serializedCustomers = customers.map(serializeCustomer);

    return NextResponse.json(paginatedResponse(serializedCustomers, total, pagination));
  },
  { requiredScope: 'read:customers' }
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
    const result = createCustomerSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;

    // Determine the effective location ID
    // API key scoped location takes precedence, then body locationId
    const effectiveLocationId = locationId || data.locationId || null;

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

    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        tenantId: apiKey.tenantId,
        locationId: effectiveLocationId,
        name: data.name,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        preferredContactMethod: data.preferredContactMethod,
        notes: data.notes,
        source: 'API',
      },
    });

    return NextResponse.json({ data: serializeCustomer(customer) }, { status: 201 });
  },
  { requiredScope: 'write:customers' }
);
