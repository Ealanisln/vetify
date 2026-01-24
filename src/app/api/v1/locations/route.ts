/**
 * API v1 Locations List Endpoint
 *
 * GET /api/v1/locations - List all locations for the tenant
 *
 * Query Parameters:
 * - isActive: Filter by active status (boolean)
 * - limit: Number of results to return (default: 50, max: 100)
 * - offset: Number of results to skip (default: 0)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  withApiAuth,
  parsePaginationParams,
  paginatedResponse,
  buildWhereClause,
} from '@/lib/api/api-key-auth';
import { serializeLocation } from '../_shared/serializers';

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(request);

    // Parse filters
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    // Build where clause - always filter by tenant
    const baseWhere = buildWhereClause(apiKey, null, {});

    // If API key is scoped to a location, only return that location
    // Otherwise, apply filters
    const where = locationId
      ? { ...baseWhere, id: locationId }
      : {
          ...baseWhere,
          ...(isActive !== undefined && { isActive }),
        };

    // Fetch locations and count in parallel
    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        skip: pagination.offset,
        take: pagination.limit,
      }),
      prisma.location.count({ where }),
    ]);

    const serializedLocations = locations.map(serializeLocation);

    return NextResponse.json(paginatedResponse(serializedLocations, total, pagination));
  },
  { requiredScope: 'read:locations' }
);
