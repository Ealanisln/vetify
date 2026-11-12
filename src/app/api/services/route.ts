import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { buildServiceApiSchema } from '../../../lib/validations/service';
import { getTenantCurrencyCode } from '../../../lib/tenant-currency';

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const locationId = searchParams.get('locationId') || undefined;

    // Verificar acceso al tenant
    if (tenantId && tenantId !== tenant.id) {
      return NextResponse.json(
        { error: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }

    const services = await prisma.service.findMany({
      where: {
        tenantId: tenant.id,
        // Si se especifica locationId, incluir servicios de esa ubicación Y servicios globales
        ...(locationId && {
          OR: [
            { locationId },
            { locationId: null } // Servicios globales
          ]
        }),
      },
      include: {
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    // Validate against the tenant's currency limits
    const currencyCode = await getTenantCurrencyCode(tenant.id);
    const validatedData = buildServiceApiSchema(currencyCode).parse(body);
    
    // Verificar acceso al tenant
    if (validatedData.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }

    // The location must belong to this tenant: otherwise the service would be
    // linked to (and the response would include) another clinic's location.
    if (validatedData.locationId) {
      const location = await prisma.location.findFirst({
        where: { id: validatedData.locationId, tenantId: tenant.id },
        select: { id: true },
      });

      if (!location) {
        return NextResponse.json(
          { error: 'Ubicación no encontrada o no pertenece a esta clínica' },
          { status: 400 }
        );
      }
    }

    // Verificar si ya existe un servicio con el mismo nombre
    const existingService = await prisma.service.findFirst({
      where: {
        tenantId: tenant.id,
        name: { equals: validatedData.name, mode: 'insensitive' }
      }
    });

    if (existingService) {
      return NextResponse.json(
        { error: 'Ya existe un servicio con este nombre' },
        { status: 400 }
      );
    }

    // Crear el servicio
    const service = await prisma.service.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        price: validatedData.price,
        duration: validatedData.duration,
        isActive: validatedData.isActive,
        tenantId: tenant.id,
        locationId: validatedData.locationId ?? null, // null = global
        isFeatured: validatedData.isFeatured ?? false,
        publicDisplayOrder: validatedData.publicDisplayOrder ?? null,
        publicIcon: validatedData.publicIcon ?? null,
        publicPriceLabel: validatedData.publicPriceLabel ?? null
      },
      include: {
        location: true // Incluir ubicación para mostrar en UI
      }
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 