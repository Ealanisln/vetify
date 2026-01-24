/**
 * API v1 Location Detail Endpoint
 *
 * GET /api/v1/locations/:id - Get a specific location
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiAuth, apiError } from '@/lib/api/api-key-auth';
import { serializeLocation } from '../../_shared/serializers';

export const GET = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Location ID is required', 'BAD_REQUEST', 400);
    }

    // If API key is scoped to a specific location, verify access
    if (locationId && locationId !== id) {
      return apiError(
        'Access denied to this location',
        'FORBIDDEN',
        403,
        'Your API key is scoped to a different location'
      );
    }

    const location = await prisma.location.findFirst({
      where: {
        id,
        tenantId: apiKey.tenantId,
      },
    });

    if (!location) {
      return apiError('Location not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({ data: serializeLocation(location) });
  },
  { requiredScope: 'read:locations' }
);
