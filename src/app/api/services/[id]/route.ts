import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { ServiceCategory } from '@prisma/client';
import { z } from 'zod';

// Esquema de validación para actualizar servicios
const updateServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().optional(),
  category: z.nativeEnum(ServiceCategory),
  price: z.number().min(0).max(99999),
  duration: z.number().min(1).max(480).optional(),
  isActive: z.boolean(),
  tenantId: z.string(),
  // Public page display fields
  isFeatured: z.boolean().optional(),
  publicDisplayOrder: z.number().int().min(1).max(10).nullable().optional(),
  publicIcon: z.string().max(50).nullable().optional(),
  publicPriceLabel: z.string().max(100).nullable().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    const { id } = await params;
    
    // Validar datos
    const validatedData = updateServiceSchema.parse(body);
    
    // Verificar acceso al tenant
    if (validatedData.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }

    // Verificar que el servicio existe y pertenece al tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id: id,
        tenantId: tenant.id
      }
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe otro servicio con el mismo nombre
    if (validatedData.name !== existingService.name) {
      const duplicateService = await prisma.service.findFirst({
        where: {
          tenantId: tenant.id,
          name: validatedData.name,
          id: { not: id }
        }
      });

      if (duplicateService) {
        return NextResponse.json(
          { error: 'Ya existe un servicio con este nombre' },
          { status: 400 }
        );
      }
    }

    // Actualizar el servicio
    const updatedService = await prisma.service.update({
      where: {
        id: id
      },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        price: validatedData.price,
        duration: validatedData.duration,
        isActive: validatedData.isActive,
        isFeatured: validatedData.isFeatured,
        publicDisplayOrder: validatedData.publicDisplayOrder,
        publicIcon: validatedData.publicIcon,
        publicPriceLabel: validatedData.publicPriceLabel
      }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await params;

    // Verificar que el servicio existe y pertenece al tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id: id,
        tenantId: tenant.id
      }
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el servicio está siendo usado en ventas
    const salesCount = await prisma.saleItem.count({
      where: {
        serviceId: id
      }
    });

    if (salesCount > 0) {
      // Si tiene ventas asociadas, solo desactivar en lugar de eliminar
      const deactivatedService = await prisma.service.update({
        where: {
          id: id
        },
        data: {
          isActive: false
        }
      });

      return NextResponse.json({
        message: 'El servicio tiene ventas asociadas, se ha desactivado en lugar de eliminarse',
        service: deactivatedService
      });
    }

    // Si no tiene ventas asociadas, eliminar completamente
    await prisma.service.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({
      message: 'Servicio eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 