import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { stripe, handleSubscriptionChange } from '../../../../lib/payments/stripe';

/**
 * Sync-first fallback for the customer portal return flow.
 *
 * Portal changes (cancel, resume, payment method) reach the DB via the
 * customer.subscription.updated webhook, which may lag or not be configured
 * in non-production environments. This endpoint runs the same idempotent
 * sync the webhook performs, scoped to the caller's own tenant.
 */
export async function POST() {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();

    if (!(await isAuthenticated()) || !user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { users: { some: { id: user.id } } },
      select: { id: true, stripeSubscriptionId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    if (!tenant.stripeSubscriptionId) {
      return NextResponse.json({ synced: false, cancelAtPeriodEnd: false });
    }

    const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
    const synced = await handleSubscriptionChange(subscription);

    return NextResponse.json({
      synced,
      cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
    });
  } catch (error) {
    console.error('Error syncing subscription from Stripe:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
