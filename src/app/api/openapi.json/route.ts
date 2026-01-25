/**
 * OpenAPI Specification Endpoint
 *
 * Serves the OpenAPI 3.0 specification as JSON.
 * This endpoint is public and does not require authentication.
 *
 * @route GET /api/openapi.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/api/openapi-spec';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Determine base URL from request
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const spec = generateOpenAPISpec(baseUrl);

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
