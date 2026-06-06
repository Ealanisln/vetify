import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { stripe, handleSubscriptionChange } from '../../../../lib/payments/stripe';
import { isPermanentError } from '../../../../lib/payments/webhook-errors';
import { notifyNewSubscriptionPayment, notifyPaymentFailed } from '../../../../lib/email/admin-notifications';
import { prisma } from '../../../../lib/prisma';
import { incrementPromotionRedemptions } from '../../../../lib/promotions/queries';
import { markConversionConverted } from '../../../../lib/referrals/queries';
import { notifyReferralConversion, notifyPartnerReferralSuccess } from '../../../../lib/email/referral-notifications';
import { createLogger } from '../../../../lib/logger';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';

const log = createLogger('stripe.webhook');

/**
 * Best-effort update of the persisted webhook event status. Never throws —
 * a logging failure must not turn a successfully-processed webhook into a 500
 * (which would make Stripe retry an event whose side effects already ran).
 */
async function markEventStatus(
  eventId: string,
  status: 'PROCESSED' | 'FAILED',
  error?: string
): Promise<void> {
  try {
    await prisma.stripeWebhookEvent.update({
      where: { id: eventId },
      data: {
        status,
        error: error ?? null,
        processedAt: status === 'PROCESSED' ? new Date() : null,
      },
    });
  } catch (e) {
    log.error('Failed to update StripeWebhookEvent status', {
      eventId,
      status,
      err: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    log.warn('Rejected: no stripe-signature header');
    return NextResponse.json(
      { error: 'No se encontró la firma' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    log.error('Misconfigured: STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    log.warn('Rejected: signature verification failed', {
      err: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Firma inválida' },
      { status: 400 }
    );
  }

  // Per-event logger so every downstream line is tagged with the event id/type.
  const elog = log.child({ eventId: event.id, type: event.type, livemode: event.livemode });
  elog.info('Event verified');

  // ── Idempotency guard ──────────────────────────────────────────────────
  // Stripe delivers at-least-once: the same event can arrive multiple times
  // (network retries, our own 500s). The primary key is the Stripe event id,
  // so a redelivery collides on INSERT. If we already PROCESSED it, skip —
  // otherwise the non-idempotent side effects (referral commissions, promo
  // redemptions) would run twice and double-count real money.
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        livemode: event.livemode,
        apiVersion: event.api_version ?? null,
        status: 'RECEIVED',
      },
    });
  } catch (dedupeError) {
    if (
      dedupeError instanceof Prisma.PrismaClientKnownRequestError &&
      dedupeError.code === 'P2002'
    ) {
      const existing = await prisma.stripeWebhookEvent.findUnique({
        where: { id: event.id },
      });
      if (existing?.status === 'PROCESSED') {
        elog.info('Duplicate event already processed — skipping');
        return NextResponse.json({ received: true, duplicate: true, event_type: event.type });
      }
      // A previous attempt was recorded but never finished (crash / transient
      // failure). Allow reprocessing and bump the attempt counter for audit.
      await prisma.stripeWebhookEvent.update({
        where: { id: event.id },
        data: { attempts: { increment: 1 }, status: 'RECEIVED', error: null },
      });
      elog.warn('Reprocessing previously-unfinished event');
    } else {
      // Persisting the dedupe record failed for some other reason. Don't drop
      // the event — log and continue processing (better duplicate-risk than
      // silently losing a payment event).
      elog.error('Failed to record event for idempotency', {
        err: dedupeError instanceof Error ? dedupeError.message : String(dedupeError),
      });
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        elog.info('Processing checkout.session.completed', {
          sessionId: session.id,
          mode: session.mode,
          paymentStatus: session.payment_status,
        });

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // ✅ Cancel any other active subscriptions for this customer
          const customerId = subscription.customer as string;
          const otherSubscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 100
          });

          for (const otherSub of otherSubscriptions.data) {
            if (otherSub.id !== subscription.id) {
              elog.info('Canceling duplicate subscription', { subscriptionId: otherSub.id });
              // Idempotency key keyed on the event + target sub so a Stripe
              // redelivery (or our own retry) doesn't issue the cancel twice.
              await stripe.subscriptions.cancel(otherSub.id, undefined, {
                idempotencyKey: `cancel-dup:${event.id}:${otherSub.id}`,
              });
            }
          }

          const syncSuccess = await handleSubscriptionChange(subscription);
          if (!syncSuccess) {
            elog.error('handleSubscriptionChange returned false', {
              stage: 'checkout.session.completed',
              subscriptionId: subscription.id,
              customerId,
            });
            Sentry.captureMessage('Webhook: subscription sync failed on checkout.session.completed', {
              level: 'error',
              tags: { category: 'payments', issue: 'sync_failed' },
              contexts: {
                subscription: {
                  id: subscription.id,
                  status: subscription.status,
                  customer: customerId,
                },
              },
            });
            await markEventStatus(event.id, 'FAILED', 'sync_failed:checkout.session.completed');
            return NextResponse.json(
              { error: 'Subscription sync failed', subscriptionId: subscription.id },
              { status: 500 }
            );
          }
          elog.info('Subscription processed successfully', { subscriptionId: subscription.id });

          // Track promotion redemption if this checkout used a FREE_TRIAL promotion
          try {
            const promotionId = subscription.metadata?.promotionId;
            if (promotionId) {
              const success = await incrementPromotionRedemptions(promotionId);
              elog.info('Promotion redemption recorded', { promotionId, success });
            }
          } catch (promoError) {
            // Log but don't fail the webhook
            elog.error('Error tracking promotion redemption', {
              err: promoError instanceof Error ? promoError.message : String(promoError),
            });
          }
        } else {
          elog.info('Session is not a subscription or missing subscription ID');
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        elog.info('Processing subscription change', {
          subscriptionId: subscription.id,
          status: subscription.status,
        });

        const updateSuccess = await handleSubscriptionChange(subscription);
        if (!updateSuccess) {
          elog.error('handleSubscriptionChange returned false', {
            stage: event.type,
            subscriptionId: subscription.id,
            status: subscription.status,
            customer: subscription.customer,
          });
          Sentry.captureMessage(`Webhook: subscription sync failed on ${event.type}`, {
            level: 'error',
            tags: { category: 'payments', issue: 'sync_failed' },
            contexts: {
              subscription: {
                id: subscription.id,
                status: subscription.status,
                customer: subscription.customer as string,
              },
            },
          });
          await markEventStatus(event.id, 'FAILED', `sync_failed:${event.type}`);
          return NextResponse.json(
            { error: 'Subscription sync failed', subscriptionId: subscription.id },
            { status: 500 }
          );
        }
        elog.info('Subscription update processed successfully', { subscriptionId: subscription.id });
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        elog.info('Processing invoice.payment_succeeded', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription as string | undefined,
          amountPaid: invoice.amount_paid,
        });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const invoiceSyncSuccess = await handleSubscriptionChange(subscription);
          if (invoiceSyncSuccess === false) {
            // The payment itself succeeded, so we don't 500 (that would make
            // Stripe retry a charge that already cleared, and customer.subscription.updated
            // will re-attempt the sync anyway). But surface it: a paid invoice
            // that failed to sync means a paying customer may lack access.
            elog.error('handleSubscriptionChange returned false', {
              stage: 'invoice.payment_succeeded',
              subscriptionId: subscription.id,
              customer: invoice.customer,
            });
            Sentry.captureMessage('Webhook: subscription sync failed on invoice.payment_succeeded', {
              level: 'warning',
              tags: { category: 'payments', issue: 'sync_failed_invoice' },
              contexts: {
                subscription: {
                  id: subscription.id,
                  status: subscription.status,
                  customer: invoice.customer as string,
                },
              },
            });
          }
          elog.info('Invoice payment processed', { invoiceId: invoice.id });

          // Send admin notification for successful payment (non-blocking)
          try {
            // Get tenant and user information from Stripe customer
            const customer = await stripe.customers.retrieve(
              invoice.customer as string
            ) as Stripe.Customer;

            if (customer.metadata?.tenantId) {
              const tenant = await prisma.tenant.findUnique({
                where: { id: customer.metadata.tenantId },
                include: {
                  staff: {
                    where: { role: 'OWNER' },
                    take: 1,
                  },
                },
              });

              if (tenant && tenant.staff[0]) {
                const planItem = subscription.items.data[0];
                const planName = planItem.price.nickname || 'Plan Desconocido';
                const amount = invoice.amount_paid;
                const currency = invoice.currency;
                const billingInterval = planItem.price.recurring?.interval === 'year' ? 'year' : 'month';

                notifyNewSubscriptionPayment({
                  userName: tenant.staff[0].name || 'Usuario',
                  userEmail: tenant.staff[0].email,
                  tenantId: tenant.id,
                  tenantName: tenant.name,
                  tenantSlug: tenant.slug,
                  planName,
                  planAmount: amount,
                  currency,
                  billingInterval,
                  stripeCustomerId: customer.id,
                  stripeSubscriptionId: subscription.id,
                }).catch(notifError => {
                  elog.error('Failed to send payment notification', {
                    err: notifError instanceof Error ? notifError.message : String(notifError),
                  });
                });
              }
            }
          } catch (notifError) {
            // Log but don't fail the webhook
            elog.error('Error preparing payment notification', {
              err: notifError instanceof Error ? notifError.message : String(notifError),
            });
          }

          // Track referral conversion if this subscription was referred
          try {
            const referralCodeId = subscription.metadata?.referralCodeId;
            if (referralCodeId) {
              const custForRef = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
              const refTenantId = custForRef.metadata?.tenantId;
              if (refTenantId) {
                const planKey = subscription.metadata?.planKey || 'unknown';
                const amount = invoice.amount_paid / 100;
                const conversion = await markConversionConverted(refTenantId, planKey, amount);
                if (conversion) {
                  elog.info('Referral conversion tracked', {
                    tenantId: refTenantId,
                    commission: conversion.commissionAmount,
                  });

                  // Fetch partner + code info for notifications
                  const refConversion = await prisma.referralConversion.findUnique({
                    where: { id: conversion.id },
                    include: {
                      partner: { select: { name: true, email: true } },
                      code: { select: { code: true } },
                      tenant: { select: { name: true } },
                    },
                  });

                  if (refConversion) {
                    // Notify admin (non-blocking)
                    notifyReferralConversion({
                      partnerName: refConversion.partner.name,
                      partnerEmail: refConversion.partner.email,
                      referralCode: refConversion.code.code,
                      tenantName: refConversion.tenant.name,
                      planKey,
                      subscriptionAmount: amount,
                      commissionPercent: Number(refConversion.commissionPercent),
                      commissionAmount: Number(refConversion.commissionAmount),
                    }).catch(e => elog.error('Referral admin notification error', {
                      err: e instanceof Error ? e.message : String(e),
                    }));

                    // Notify partner (non-blocking)
                    notifyPartnerReferralSuccess({
                      partnerEmail: refConversion.partner.email,
                      partnerName: refConversion.partner.name,
                      tenantName: refConversion.tenant.name,
                      commissionAmount: Number(refConversion.commissionAmount),
                    }).catch(e => elog.error('Referral partner notification error', {
                      err: e instanceof Error ? e.message : String(e),
                    }));
                  }
                }
              }
            }
          } catch (refError) {
            elog.error('Error tracking referral conversion', {
              err: refError instanceof Error ? refError.message : String(refError),
            });
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        elog.warn('Processing invoice.payment_failed', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription as string | undefined,
          customer: invoice.customer as string,
        });

        // Capture in Sentry
        Sentry.captureMessage('Stripe invoice.payment_failed', {
          level: 'error',
          tags: {
            category: 'payments',
            invoiceId: invoice.id,
            customerId: invoice.customer as string,
          },
          contexts: {
            invoice: {
              id: invoice.id,
              subscription: invoice.subscription as string,
              status: invoice.status,
              amount_due: invoice.amount_due,
              currency: invoice.currency,
              customer: invoice.customer as string,
            },
          },
        });

        // Send admin notification (non-blocking)
        try {
          const customer = await stripe.customers.retrieve(
            invoice.customer as string
          ) as Stripe.Customer;

          const tenantId = customer.metadata?.tenantId;
          let tenantName = customer.name || customer.email || 'Desconocido';
          let tenantSlug = '';
          let ownerName: string | undefined;
          let ownerEmail: string | undefined;

          if (tenantId) {
            const tenant = await prisma.tenant.findUnique({
              where: { id: tenantId },
              include: {
                staff: {
                  where: { role: 'OWNER' },
                  take: 1,
                },
              },
            });

            if (tenant) {
              tenantName = tenant.name;
              tenantSlug = tenant.slug;
              if (tenant.staff[0]) {
                ownerName = tenant.staff[0].name || undefined;
                ownerEmail = tenant.staff[0].email;
              }
            }
          }

          notifyPaymentFailed({
            tenantName,
            tenantSlug,
            userName: ownerName,
            userEmail: ownerEmail,
            failureReason: 'Pago de factura fallido en Stripe',
            invoiceId: invoice.id,
            amountDue: invoice.amount_due,
            currency: invoice.currency,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: invoice.subscription as string | undefined,
          }).catch(notifError => {
            elog.error('Failed to send payment failed notification', {
              err: notifError instanceof Error ? notifError.message : String(notifError),
            });
          });
        } catch (notifError) {
          elog.error('Error preparing payment failed notification', {
            err: notifError instanceof Error ? notifError.message : String(notifError),
          });
        }

        break;
      }
      default: {
        elog.info('Unhandled event type');
      }
    }

    await markEventStatus(event.id, 'PROCESSED');
    elog.info('Event processed successfully');
    return NextResponse.json({ received: true, event_type: event.type });
  } catch (error) {
    const permanent = isPermanentError(error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    await markEventStatus(event.id, 'FAILED', message);
    Sentry.captureException(error, {
      level: permanent ? 'error' : 'warning',
      tags: {
        category: 'payments',
        issue: 'webhook_processing_error',
        retryable: String(!permanent),
      },
      contexts: { event: { id: event.id, type: event.type } },
    });

    if (permanent) {
      // A code/data bug that will fail identically on every retry. Acknowledge
      // the event (2xx) so Stripe stops redelivering, and rely on Sentry to
      // surface it. Retrying for ~3 days would only add noise.
      elog.error('Permanent error — acknowledging to stop retries', { err: message });
      return NextResponse.json(
        { received: true, error: 'permanent_failure', details: message },
        { status: 200 }
      );
    }

    // Transient (DB blip, Stripe rate limit, network). Return 500 so Stripe
    // redelivers and we get another chance.
    elog.error('Transient error — returning 500 for Stripe retry', { err: message });
    return NextResponse.json(
      { error: 'Error al procesar webhook', details: message },
      { status: 500 }
    );
  }
}
