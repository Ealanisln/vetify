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
 * Schema for creating a new webhook
 */
const createWebhookSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  url: z
    .string()
    .url('URL inválida')
    .refine(
      url => url.startsWith('https://'),
      'La URL debe usar HTTPS'
    ),
  events: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos un evento')
    .refine(
      events => events.every(e => ALL_WEBHOOK_EVENTS.includes(e as typeof ALL_WEBHOOK_EVENTS[number])),
      'Eventos inválidos seleccionados'
    ),
});

/**
 * GET /api/settings/webhooks
 * List all webhooks for the authenticated tenant
 * Does NOT return the secret
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

    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: tenant.id },
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
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    console.error('[WEBHOOKS] Error fetching webhooks:', error);

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
 * POST /api/settings/webhooks
 * Create a new webhook for the authenticated tenant
 * Returns the secret ONCE in the response
 */
export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requirePermission('settings', 'write');

    // Check if tenant has API access feature
    const hasApiAccess = await checkFeatureAccess('apiAccess');
    if (!hasApiAccess) {
      return NextResponse.json(
        { success: false, error: 'Esta función requiere el plan Corporativo' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createWebhookSchema.parse(body);

    // Validate events
    const { valid, invalid } = validateWebhookEvents(validatedData.events);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: `Eventos inválidos: ${invalid.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate the webhook secret
    const secret = generateWebhookSecret();

    // Create the webhook record
    const webhook = await prisma.webhook.create({
      data: {
        tenantId: tenant.id,
        name: validatedData.name,
        url: validatedData.url,
        secret,
        events: validatedData.events,
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        consecutiveFailures: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...webhook,
        secret, // Only returned on creation, never again
      },
      message: 'Webhook creado correctamente',
    });
  } catch (error) {
    console.error('[WEBHOOKS] Error creating webhook:', error);

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
        { success: false, error: 'No tienes permiso para crear webhooks' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
