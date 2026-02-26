import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Internal API endpoint for persisting security audit logs.
 * Protected by INTERNAL_API_SECRET header - not exposed to clients.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');

  if (!process.env.INTERNAL_API_SECRET || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const events = Array.isArray(body) ? body : [body];

    await prisma.securityAuditLog.createMany({
      data: events.map((event) => ({
        id: event.id,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        eventType: event.eventType,
        userId: event.userId ?? null,
        tenantId: event.tenantId ?? null,
        ipAddress: event.ipAddress || 'unknown',
        userAgent: event.userAgent || 'unknown',
        endpoint: event.endpoint,
        method: event.method,
        resource: event.resource ?? null,
        resourceId: event.resourceId ?? null,
        details: event.details ?? null,
        riskLevel: event.riskLevel,
        success: event.success,
        errorMessage: event.errorMessage ?? null,
      })),
    });

    return NextResponse.json({ ok: true, count: events.length });
  } catch (error) {
    console.error('Failed to persist audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to persist audit logs' },
      { status: 500 }
    );
  }
}
