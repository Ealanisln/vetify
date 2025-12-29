import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import {
  isValidDomain,
  normalizeDomain,
  isReservedDomain,
  verifyDomainDns,
  invalidateDomainCache,
  getVercelCnameTarget,
} from '@/lib/domain-resolver';
import { isDomainAvailable } from '@/lib/tenant';

// Schema for domain settings validation
const domainSettingsSchema = z.object({
  domain: z.string().max(253).nullable(),
});

export async function GET() {
  try {
    const { tenant } = await requireAuth();

    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: {
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

    // Get DNS verification status if domain is set
    let dnsStatus = null;
    if (tenantData.domain) {
      dnsStatus = await verifyDomainDns(tenantData.domain);
    }

    return NextResponse.json({
      data: {
        domain: tenantData.domain,
        domainVerified: tenantData.domainVerified,
        slug: tenantData.slug,
        dnsStatus,
        cnameTarget: getVercelCnameTarget(),
      },
    });
  } catch (error) {
    console.error('Error fetching domain settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener la configuración del dominio' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    // Validate input
    const validationResult = domainSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { domain: rawDomain } = validationResult.data;

    // Get current domain to invalidate cache if changing
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { domain: true },
    });

    // Handle domain removal
    if (!rawDomain) {
      // Invalidate old domain cache if there was one
      if (currentTenant?.domain) {
        await invalidateDomainCache(currentTenant.domain);
      }

      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          domain: null,
          domainVerified: false,
        },
        select: {
          domain: true,
          domainVerified: true,
          slug: true,
        },
      });

      return NextResponse.json({
        data: {
          ...updatedTenant,
          dnsStatus: null,
          cnameTarget: getVercelCnameTarget(),
        },
        message: 'Dominio eliminado exitosamente',
      });
    }

    // Normalize and validate domain
    const domain = normalizeDomain(rawDomain);

    if (!isValidDomain(domain)) {
      return NextResponse.json(
        { error: 'Formato de dominio inválido. Ejemplo: miclínica.com' },
        { status: 400 }
      );
    }

    if (isReservedDomain(domain)) {
      return NextResponse.json(
        { error: 'Este dominio no está permitido' },
        { status: 400 }
      );
    }

    // Check availability
    const available = await isDomainAvailable(domain, tenant.id);
    if (!available) {
      return NextResponse.json(
        { error: 'Este dominio ya está en uso por otra clínica' },
        { status: 400 }
      );
    }

    // Invalidate old domain cache if changing
    if (currentTenant?.domain && currentTenant.domain !== domain) {
      await invalidateDomainCache(currentTenant.domain);
    }

    // Verify DNS status
    const dnsStatus = await verifyDomainDns(domain);

    // Update tenant with new domain
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        domain,
        domainVerified: dnsStatus.status === 'verified',
      },
      select: {
        domain: true,
        domainVerified: true,
        slug: true,
      },
    });

    return NextResponse.json({
      data: {
        ...updatedTenant,
        dnsStatus,
        cnameTarget: getVercelCnameTarget(),
      },
      message: dnsStatus.status === 'verified'
        ? 'Dominio configurado y verificado exitosamente'
        : 'Dominio guardado. Configura el DNS para activarlo.',
    });
  } catch (error) {
    console.error('Error updating domain settings:', error);
    return NextResponse.json(
      { error: 'Error al guardar la configuración del dominio' },
      { status: 500 }
    );
  }
}
