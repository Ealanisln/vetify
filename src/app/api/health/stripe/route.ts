import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { stripe } from '@/lib/payments/stripe';
import { isStripeInLiveMode } from '@/lib/pricing-config';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = createLogger('health.stripe');

/**
 * Stripe-specific health check.
 *
 * Surfaces the three things that silently broke the live payment flow before:
 *   1. config   — is the webhook secret + secret key present, and which mode?
 *   2. api      — can we actually authenticate against Stripe right now?
 *   3. webhook  — have we received/processed events recently, or is the
 *                 endpoint dead (the original root cause: the only live webhook
 *                 pointed at the dev host, so prod never saw an event)?
 *
 * Never leaks secret values — only booleans and counts.
 */
export async function GET() {
  const liveMode = isStripeInLiveMode();

  const health: {
    status: 'healthy' | 'degraded';
    timestamp: string;
    mode: 'live' | 'test';
    checks: {
      config: { status: string; webhookSecret: boolean; secretKey: boolean };
      api: { status: string; responseTime: number };
      webhooks: {
        status: string;
        lastEventReceivedAt: string | null;
        last24h: { received: number; processed: number; failed: number };
      };
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: liveMode ? 'live' : 'test',
    checks: {
      config: {
        status: 'unknown',
        webhookSecret: false,
        secretKey: false,
      },
      api: { status: 'unknown', responseTime: 0 },
      webhooks: {
        status: 'unknown',
        lastEventReceivedAt: null,
        last24h: { received: 0, processed: 0, failed: 0 },
      },
    },
  };

  // 1. Config presence (booleans only — never the values)
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
  const hasSecretKey = !!(process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY);
  health.checks.config = {
    status: hasWebhookSecret && hasSecretKey ? 'healthy' : 'unhealthy',
    webhookSecret: hasWebhookSecret,
    secretKey: hasSecretKey,
  };
  if (!hasWebhookSecret || !hasSecretKey) {
    health.status = 'degraded';
  }

  // 2. Stripe API reachability — a cheap authenticated call.
  const apiStart = Date.now();
  try {
    await stripe.balance.retrieve();
    health.checks.api = { status: 'healthy', responseTime: Date.now() - apiStart };
  } catch (error) {
    health.checks.api = { status: 'unhealthy', responseTime: Date.now() - apiStart };
    health.status = 'degraded';
    Sentry.captureException(error, {
      tags: { component: 'health_check', check: 'stripe_api' },
    });
  }

  // 3. Recent webhook activity — is the endpoint actually being hit?
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [lastEvent, received, processed, failed] = await Promise.all([
      prisma.stripeWebhookEvent.findFirst({
        orderBy: { receivedAt: 'desc' },
        select: { receivedAt: true },
      }),
      prisma.stripeWebhookEvent.count({ where: { receivedAt: { gte: since } } }),
      prisma.stripeWebhookEvent.count({ where: { receivedAt: { gte: since }, status: 'PROCESSED' } }),
      prisma.stripeWebhookEvent.count({ where: { receivedAt: { gte: since }, status: 'FAILED' } }),
    ]);

    health.checks.webhooks = {
      // Recent failures are a degraded signal; absence of events is not (a
      // low-traffic prod can legitimately go a day without a payment event).
      status: failed > 0 ? 'degraded' : 'healthy',
      lastEventReceivedAt: lastEvent?.receivedAt.toISOString() ?? null,
      last24h: { received, processed, failed },
    };
    if (failed > 0) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.webhooks.status = 'unhealthy';
    health.status = 'degraded';
    log.error('Webhook activity check failed', {
      err: error instanceof Error ? error.message : String(error),
    });
  }

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
  });
}
