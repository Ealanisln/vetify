import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { buildServiceApiSchema } from '../../../../lib/validations/service';
import { getTenantCurrencyCode } from '../../../../lib/tenant-currency';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    const { id } = await params;

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
          name: { equals: validatedData.name, mode: 'insensitive' },
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
        locationId: validatedData.locationId ?? null, // null = global
        isFeatured: validatedData.isFeatured,
        publicDisplayOrder: validatedData.publicDisplayOrder,
        publicIcon: validatedData.publicIcon,
        publicPriceLabel: validatedData.publicPriceLabel
      },
      include: {
        location: {
          select: {
            id: true,
            name: true
          }
        }
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