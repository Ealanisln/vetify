import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { checkFeatureAccess } from '@/app/actions/subscription';
import { prisma } from '@/lib/prisma';
import { WebhookDeliveryStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/settings/webhooks/[id]/logs
 * Get paginated delivery history for a webhook
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by delivery status (PENDING, DELIVERED, FAILED, SKIPPED)
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const statusFilter = searchParams.get('status') as WebhookDeliveryStatus | null;

    // Validate status filter
    if (
      statusFilter &&
      !Object.values(WebhookDeliveryStatus).includes(statusFilter)
    ) {
      return NextResponse.json(
        { success: false, error: 'Estado de filtro inválido' },
        { status: 400 }
      );
    }

    // Check if webhook exists and belongs to tenant
    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      select: { id: true },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook no encontrado' },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause: {
      webhookId: string;
      status?: WebhookDeliveryStatus;
    } = { webhookId: id };

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    // Get total count for pagination
    const totalCount = await prisma.webhookDeliveryLog.count({
      where: whereClause,
    });

    // Get delivery logs
    const deliveryLogs = await prisma.webhookDeliveryLog.findMany({
      where: whereClause,
      select: {
        id: true,
        eventType: true,
        payload: true,
        attempt: true,
        status: true,
        httpStatusCode: true,
        responseBody: true,
        error: true,
        deliveredAt: true,
        createdAt: true,
        scheduledFor: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: deliveryLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[WEBHOOKS] Error fetching delivery logs:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para ver los logs de webhooks' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
