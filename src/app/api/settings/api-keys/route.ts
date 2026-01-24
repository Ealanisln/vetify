import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth';
import { checkFeatureAccess } from '@/app/actions/subscription';
import { prisma } from '@/lib/prisma';
import { generateApiKey, validateScopes } from '@/lib/api/api-key-utils';

/**
 * Schema for creating a new API key
 */
const createApiKeySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  scopes: z.array(z.string()).min(1, 'Debe seleccionar al menos un permiso'),
  locationId: z.string().uuid().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  rateLimit: z.number().min(100).max(100000).optional(),
});

/**
 * GET /api/settings/api-keys
 * List all API keys for the authenticated tenant
 */
export async function GET() {
  try {
    const { tenant } = await requirePermission('settings', 'read');

    // Check if tenant has API access feature
    const hasApiAccess = await checkFeatureAccess('apiAccess');
    if (!hasApiAccess) {
      return NextResponse.json(
        { success: false, error: 'Esta función requiere el plan Corporativo' },
        { status: 403 }
      );
    }

    const apiKeys = await prisma.tenantApiKey.findMany({
      where: { tenantId: tenant.id },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error('[API_KEYS] Error fetching API keys:', error);

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
 * POST /api/settings/api-keys
 * Create a new API key for the authenticated tenant
 * Returns the full key ONCE in the response
 */
export async function POST(request: NextRequest) {
  try {
    const { tenant, staff } = await requirePermission('settings', 'write');

    // Check if tenant has API access feature
    const hasApiAccess = await checkFeatureAccess('apiAccess');
    if (!hasApiAccess) {
      return NextResponse.json(
        { success: false, error: 'Esta función requiere el plan Corporativo' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    // Validate scopes
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

    // Validate location belongs to tenant if provided
    if (validatedData.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: validatedData.locationId,
          tenantId: tenant.id,
        },
      });

      if (!location) {
        return NextResponse.json(
          { success: false, error: 'Ubicación no encontrada' },
          { status: 400 }
        );
      }
    }

    // Generate the API key
    const { fullKey, keyPrefix, keyHash } = generateApiKey();

    // Create the API key record
    const apiKey = await prisma.tenantApiKey.create({
      data: {
        tenantId: tenant.id,
        name: validatedData.name,
        keyPrefix,
        keyHash,
        scopes: valid,
        locationId: validatedData.locationId || null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        rateLimit: validatedData.rateLimit || 1000,
        createdById: staff?.id || null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        locationId: true,
        expiresAt: true,
        rateLimit: true,
        isActive: true,
        createdAt: true,
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
      data: {
        ...apiKey,
        fullKey, // Only returned on creation, never again
      },
      message: 'Clave de API creada correctamente',
    });
  } catch (error) {
    console.error('[API_KEYS] Error creating API key:', error);

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
        { success: false, error: 'No tienes permiso para crear claves de API' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
