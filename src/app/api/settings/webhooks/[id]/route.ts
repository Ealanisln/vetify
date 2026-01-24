import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth';
import { checkFeatureAccess } from '@/app/actions/subscription';
import { prisma } from '@/lib/prisma';
import {
  generateWebhookSecret,
  validateWebhookEvents,
  ALL_WEBHOOK_EVENTS,
} from '@/lib/webhooks';

/**
 * Schema for updating a webhook
 */
const updateWebhookSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo').optional(),
  url: z
    .string()
    .url('URL inválida')
    .refine(url => url.startsWith('https://'), 'La URL debe usar HTTPS')
    .optional(),
  events: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos un evento')
    .refine(
      events => events.every(e => ALL_WEBHOOK_EVENTS.includes(e as typeof ALL_WEBHOOK_EVENTS[number])),
      'Eventos inválidos seleccionados'
    )
    .optional(),
  isActive: z.boolean().optional(),
  regenerateSecret: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/settings/webhooks/[id]
 * Get a single webhook with recent delivery logs
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

    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        consecutiveFailures: true,
        lastDeliveryAt: true,
        lastSuccessAt: true,
        createdAt: true,
        updatedAt: true,
        deliveries: {
          select: {
            id: true,
            eventType: true,
            status: true,
            httpStatusCode: true,
            attempt: true,
            deliveredAt: true,
            createdAt: true,
            error: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    console.error('[WEBHOOKS] Error fetching webhook:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para ver los webhooks' },
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
 * PUT /api/settings/webhooks/[id]
 * Update a webhook (name, url, events, isActive)
 * Can optionally regenerate the secret
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

    // Check if webhook exists and belongs to tenant
    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateWebhookSchema.parse(body);

    // Validate events if provided
    if (validatedData.events) {
      const { valid, invalid } = validateWebhookEvents(validatedData.events);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: `Eventos inválidos: ${invalid.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Generate new secret if requested
    let newSecret: string | undefined;
    if (validatedData.regenerateSecret) {
      newSecret = generateWebhookSecret();
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.url) updateData.url = validatedData.url;
    if (validatedData.events) updateData.events = validatedData.events;
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
      // Reset failure count when re-enabling
      if (validatedData.isActive) {
        updateData.consecutiveFailures = 0;
      }
    }
    if (newSecret) updateData.secret = newSecret;

    // Update the webhook
    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        consecutiveFailures: true,
        lastDeliveryAt: true,
        lastSuccessAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const responseData: Record<string, unknown> = { ...webhook };
    if (newSecret) {
      responseData.secret = newSecret; // Only returned when regenerated
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: newSecret
        ? 'Webhook actualizado y secreto regenerado correctamente'
        : 'Webhook actualizado correctamente',
    });
  } catch (error) {
    console.error('[WEBHOOKS] Error updating webhook:', error);

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
        { success: false, error: 'No tienes permiso para modificar webhooks' },
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
 * DELETE /api/settings/webhooks/[id]
 * Permanently delete a webhook and its delivery logs
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

    // Check if webhook exists and belongs to tenant
    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook no encontrado' },
        { status: 404 }
      );
    }

    // Delete the webhook (delivery logs cascade delete via onDelete: Cascade)
    await prisma.webhook.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook eliminado correctamente',
    });
  } catch (error) {
    console.error('[WEBHOOKS] Error deleting webhook:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar webhooks' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
