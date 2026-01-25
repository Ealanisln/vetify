import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { checkFeatureAccess } from '@/app/actions/subscription';
import { prisma } from '@/lib/prisma';
import { sendTestWebhook } from '@/lib/webhooks';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/settings/webhooks/[id]/test
 * Send a test ping event to the webhook
 * Returns the delivery result immediately
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook no encontrado' },
        { status: 404 }
      );
    }

    if (!webhook.isActive) {
      return NextResponse.json(
        { success: false, error: 'El webhook está desactivado. Actívalo antes de enviar una prueba.' },
        { status: 400 }
      );
    }

    // Send test webhook
    const result = await sendTestWebhook(webhook.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          delivered: true,
          httpStatusCode: result.httpStatusCode,
          deliveredAt: result.deliveredAt,
        },
        message: 'Prueba enviada correctamente',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Error al enviar la prueba',
        data: {
          delivered: false,
          httpStatusCode: result.httpStatusCode,
          responseBody: result.responseBody,
        },
      });
    }
  } catch (error) {
    console.error('[WEBHOOKS] Error testing webhook:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para probar webhooks' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
