import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  normalizeDomain,
  isCustomDomain,
  getCachedDomainMapping,
  cacheDomainMapping,
  type DomainInfo,
} from '@/lib/domain-resolver';

/**
 * GET /api/domain/resolve?domain=example.com
 *
 * Resolves a custom domain to tenant information.
 * Used by middleware for domain-based routing.
 * Uses Redis caching for performance.
 *
 * This endpoint is intentionally public (no auth required)
 * as it's called from middleware before authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDomain = searchParams.get('domain');

    if (!rawDomain) {
      return NextResponse.json(
        { error: 'Missing domain parameter' },
        { status: 400 }
      );
    }

    const domain = normalizeDomain(rawDomain);

    // Check if this is even a custom domain
    if (!isCustomDomain(domain)) {
      return NextResponse.json(
        { error: 'Not a custom domain', isSystemDomain: true },
        { status: 404 }
      );
    }

    // Try cache first
    const cached = await getCachedDomainMapping(domain);
    if (cached) {
      return NextResponse.json({
        data: cached,
        cached: true,
      });
    }

    // Cache miss - look up in database
    const tenant = await prisma.tenant.findUnique({
      where: {
        domain,
        status: 'ACTIVE',
        domainVerified: true,
      },
      select: {
        id: true,
        slug: true,
        publicPageEnabled: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Domain not found or not verified' },
        { status: 404 }
      );
    }

    if (!tenant.publicPageEnabled) {
      return NextResponse.json(
        { error: 'Public page not enabled for this tenant' },
        { status: 403 }
      );
    }

    // Build domain info
    const domainInfo: DomainInfo = {
      tenantId: tenant.id,
      slug: tenant.slug,
      verified: true,
    };

    // Cache for future requests
    await cacheDomainMapping(domain, domainInfo);

    return NextResponse.json({
      data: domainInfo,
      cached: false,
    });
  } catch (error) {
    console.error('Error resolving domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
