import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  verifyDomainDns,
  getVercelCnameTarget,
  invalidateDomainCache,
  cacheDomainMapping,
} from '@/lib/domain-resolver';

/**
 * POST /api/tenant/verify-domain
 *
 * Verifies DNS configuration for the tenant's custom domain
 * and updates the domainVerified status.
 */
export async function POST() {
  try {
    const { tenant } = await requireAuth();

    // Get current tenant domain
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: {
        id: true,
        domain: true,
        domainVerified: true,
        slug: true,
      },
    });

    if (!tenantData) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }

    if (!tenantData.domain) {
      return NextResponse.json(
        { error: 'No hay dominio configurado para verificar' },
        { status: 400 }
      );
    }

    // Verify DNS configuration
    const dnsStatus = await verifyDomainDns(tenantData.domain);
    const isVerified = dnsStatus.status === 'verified';

    // Update verification status if changed
    if (isVerified !== tenantData.domainVerified) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { domainVerified: isVerified },
      });

      // Update cache with new verification status
      if (isVerified) {
        await cacheDomainMapping(tenantData.domain, {
          tenantId: tenant.id,
          slug: tenantData.slug,
          verified: true,
        });
      } else {
        // Invalidate cache if no longer verified
        await invalidateDomainCache(tenantData.domain);
      }
    }

    return NextResponse.json({
      data: {
        domain: tenantData.domain,
        domainVerified: isVerified,
        dnsStatus,
        cnameTarget: getVercelCnameTarget(),
      },
      message: isVerified
        ? 'Dominio verificado correctamente'
        : dnsStatus.message,
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: 'Error al verificar el dominio' },
      { status: 500 }
    );
  }
}
