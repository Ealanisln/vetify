import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth';
import { checkFeatureAccess } from '@/app/actions/subscription';
import { prisma } from '@/lib/prisma';
import { validateScopes } from '@/lib/api/api-key-utils';

/**
 * Schema for updating an API key
 */
const updateApiKeySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo').optional(),
  scopes: z.array(z.string()).min(1, 'Debe seleccionar al menos un permiso').optional(),
  isActive: z.boolean().optional(),
  rateLimit: z.number().min(100).max(100000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/settings/api-keys/[id]
 * Get a single API key
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { tenant } = await requirePermission('settings', 'read');

    // Check if tenant has API access feature
    const hasApiAccess = await checkFeatureAccess('apiAccess');
    if (!hasApiAccess) {
      return NextResponse.json(
        { success: false, error: 'Esta función requiere el plan Corporativo' },
        { status: 403 }
      );
    }

    const apiKey = await prisma.tenantApiKey.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsed: true,
        isActive: true,
        expiresAt: true,
        rateLimit: true,
        createdAt: true,
        locationId: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Clave de API no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    console.error('[API_KEYS] Error fetching API key:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para ver las claves de API' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/api-keys/[id]
 * Update an API key (name, scopes, isActive, rateLimit)
 * Cannot regenerate the key
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { tenant } = await requirePermission('settings', 'write');

    // Check if tenant has API access feature
    const hasApiAccess = await checkFeatureAccess('apiAccess');
    if (!hasApiAccess) {
      return NextResponse.json(
        { success: false, error: 'Esta función requiere el plan Corporativo' },
        { status: 403 }
      );
    }

    // Check if API key exists and belongs to tenant
    const existingKey = await prisma.tenantApiKey.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: 'Clave de API no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateApiKeySchema.parse(body);

    // Validate scopes if provided
    let validScopes: string[] | undefined;
    if (validatedData.scopes) {
      const { valid, invalid } = validateScopes(validatedData.scopes);

      if (invalid.length > 0) {
        return NextResponse.json(
          { success: false, error: `Permisos inválidos: ${invalid.join(', ')}` },
          { status: 400 }
        );
      }

      if (valid.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Debe seleccionar al menos un permiso válido' },
          { status: 400 }
        );
      }

      validScopes = valid;
    }

    // Update the API key
    const apiKey = await prisma.tenantApiKey.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validScopes && { scopes: validScopes }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        ...(validatedData.rateLimit && { rateLimit: validatedData.rateLimit }),
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsed: true,
        isActive: true,
        expiresAt: true,
        rateLimit: true,
        createdAt: true,
        locationId: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: apiKey,
      message: 'Clave de API actualizada correctamente',
    });
  } catch (error) {
    console.error('[API_KEYS] Error updating API key:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para modificar claves de API' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/api-keys/[id]
 * Permanently delete an API key
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { tenant } = await requirePermission('settings', 'delete');

    // Check if tenant has API access feature
    const hasApiAccess = await checkFeatureAccess('apiAccess');
    if (!hasApiAccess) {
      return NextResponse.json(
        { success: false, error: 'Esta función requiere el plan Corporativo' },
        { status: 403 }
      );
    }

    // Check if API key exists and belongs to tenant
    const existingKey = await prisma.tenantApiKey.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: 'Clave de API no encontrada' },
        { status: 404 }
      );
    }

    // Delete the API key
    await prisma.tenantApiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Clave de API eliminada correctamente',
    });
  } catch (error) {
    console.error('[API_KEYS] Error deleting API key:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar claves de API' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
