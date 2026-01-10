import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { ServiceCategory } from '@prisma/client';
import { z } from 'zod';

// Esquema de validación para crear/actualizar servicios
const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().optional(),
  category: z.nativeEnum(ServiceCategory),
  price: z.number().min(0).max(99999),
  duration: z.number().min(1).max(480).optional(),
  isActive: z.boolean(),
  tenantId: z.string(),
  locationId: z.string().nullable().optional(), // null = global (todas las ubicaciones)
  // Public page display fields
  isFeatured: z.boolean().optional().default(false),
  publicDisplayOrder: z.number().int().min(1).max(10).nullable().optional(),
  publicIcon: z.string().max(50).nullable().optional(),
  publicPriceLabel: z.string().max(100).nullable().optional()
});

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
    
    // Validar datos
    const validatedData = serviceSchema.parse(body);
    
    // Verificar acceso al tenant
    if (validatedData.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }

    // Verificar si ya existe un servicio con el mismo nombre
    const existingService = await prisma.service.findFirst({
      where: {
        tenantId: tenant.id,
        name: validatedData.name
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