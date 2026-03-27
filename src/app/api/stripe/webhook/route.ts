import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { stripe, handleSubscriptionChange } from '../../../../lib/payments/stripe';
import { notifyNewSubscriptionPayment, notifyPaymentFailed } from '../../../../lib/email/admin-notifications';
import { prisma } from '../../../../lib/prisma';
import { incrementPromotionRedemptions } from '../../../../lib/promotions/queries';
import { markConversionConverted } from '../../../../lib/referrals/queries';
import { notifyReferralConversion, notifyPartnerReferralSuccess } from '../../../../lib/email/referral-notifications';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Webhook: Received request');
  console.log('Webhook: Body length:', body.length);
  console.log('Webhook: Signature present:', !!signature);
  console.log('Webhook: STRIPE_WEBHOOK_SECRET present:', !!process.env.STRIPE_WEBHOOK_SECRET);

  if (!signature) {
    console.error('Webhook: No signature found in headers');
    console.log('Webhook: Available headers:', Object.keys(headersList));
    return NextResponse.json(
      { error: 'No se encontró la firma' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook: STRIPE_WEBHOOK_SECRET environment variable is not set');
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
    console.log('Webhook: Event received and verified successfully:', event.type, event.id);
  } catch (error) {
    console.error('Webhook: Error verifying signature:', error);
    return NextResponse.json(
      { error: 'Firma inválida' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Webhook: Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('Webhook: Session details:', {
          id: session.id,
          mode: session.mode,
          payment_status: session.payment_status,
          status: session.status,
          subscription: session.subscription,
          customer: session.customer
        });

        if (session.mode === 'subscription' && session.subscription) {
          console.log('Webhook: Retrieving subscription:', session.subscription);
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          console.log('Webhook: Subscription details:', {
            id: subscription.id,
            status: subscription.status,
            trial_start: subscription.trial_start,
            trial_end: subscription.trial_end,
            current_period_end: subscription.current_period_end,
            customer: subscription.customer
          });

          // ✅ Cancel any other active subscriptions for this customer
          const customerId = subscription.customer as string;
          const otherSubscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 100
          });

          for (const otherSub of otherSubscriptions.data) {
            if (otherSub.id !== subscription.id) {
              console.log(`Webhook: Canceling duplicate subscription ${otherSub.id}`);
              await stripe.subscriptions.cancel(otherSub.id);
            }
          }

          const syncSuccess = await handleSubscriptionChange(subscription);
          if (!syncSuccess) {
            console.error('Webhook: handleSubscriptionChange returned false for checkout.session.completed', {
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
            return NextResponse.json(
              { error: 'Subscription sync failed', subscriptionId: subscription.id },
              { status: 500 }
            );
          }
          console.log('Webhook: Subscription processed successfully');

          // Track promotion redemption if this checkout used a FREE_TRIAL promotion
          try {
            const promotionId = subscription.metadata?.promotionId;
            if (promotionId) {
              const success = await incrementPromotionRedemptions(promotionId);
              console.log(`Webhook: Promotion redemption ${success ? 'recorded' : 'failed (sold out?)'} for ${promotionId}`);
            }
          } catch (promoError) {
            // Log but don't fail the webhook
            console.error('Webhook: Error tracking promotion redemption:', promoError);
          }
        } else {
          console.log('Webhook: Session is not a subscription or missing subscription ID');
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        console.log(`Webhook: Processing ${event.type}`);
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Webhook: Subscription update details:', {
          id: subscription.id,
          status: subscription.status,
          trial_start: subscription.trial_start,
          trial_end: subscription.trial_end,
          current_period_end: subscription.current_period_end,
          customer: subscription.customer
        });

        const updateSuccess = await handleSubscriptionChange(subscription);
        if (!updateSuccess) {
          console.error(`Webhook: handleSubscriptionChange returned false for ${event.type}`, {
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
          return NextResponse.json(
            { error: 'Subscription sync failed', subscriptionId: subscription.id },
            { status: 500 }
          );
        }
        console.log('Webhook: Subscription update processed successfully');
        break;
      }
      case 'invoice.payment_succeeded': {
        console.log('Webhook: Processing invoice.payment_succeeded');
        const invoice = event.data.object as Stripe.Invoice;

        console.log('Webhook: Invoice details:', {
          id: invoice.id,
          subscription: invoice.subscription,
          status: invoice.status,
          amount_paid: invoice.amount_paid,
          customer: invoice.customer
        });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          await handleSubscriptionChange(subscription);
          console.log('Webhook: Invoice payment processed successfully');

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
                  console.error('[WEBHOOK] Failed to send payment notification:', notifError);
                });
              }
            }
          } catch (notifError) {
            // Log but don't fail the webhook
            console.error('[WEBHOOK] Error preparing payment notification:', notifError);
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
                  console.log(`[WEBHOOK] Referral conversion tracked: tenant=${refTenantId}, commission=${conversion.commissionAmount}`);

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
                    }).catch(e => console.error('[WEBHOOK] Referral admin notification error:', e));

                    // Notify partner (non-blocking)
                    notifyPartnerReferralSuccess({
                      partnerEmail: refConversion.partner.email,
                      partnerName: refConversion.partner.name,
                      tenantName: refConversion.tenant.name,
                      commissionAmount: Number(refConversion.commissionAmount),
                    }).catch(e => console.error('[WEBHOOK] Referral partner notification error:', e));
                  }
                }
              }
            }
          } catch (refError) {
            console.error('[WEBHOOK] Error tracking referral conversion:', refError);
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        console.log('Webhook: Processing invoice.payment_failed');
        const invoice = event.data.object as Stripe.Invoice;

        console.log('Webhook: Failed invoice details:', {
          id: invoice.id,
          subscription: invoice.subscription,
          status: invoice.status,
          customer: invoice.customer
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
            console.error('[WEBHOOK] Failed to send payment failed notification:', notifError);
          });
        } catch (notifError) {
          console.error('[WEBHOOK] Error preparing payment failed notification:', notifError);
        }

        break;
      }
      default: {
        console.log('Webhook: Unhandled event type:', event.type);
      }
    }

    console.log('=== WEBHOOK DEBUG END SUCCESS ===');
    return NextResponse.json({ received: true, event_type: event.type });
  } catch (error) {
    console.error('Webhook: Error processing event:', error);
    console.log('=== WEBHOOK DEBUG END ERROR ===');
    return NextResponse.json(
      { error: 'Error al procesar webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 