/**
 * Admin Notifications Service
 *
 * Helper functions to send administrative notifications to emmanuel@vetify.pro
 */

import { sendEmail } from './email-service';
import type {
  NewUserRegistrationData,
  NewSubscriptionPaymentData,
  EmailSendResult,
} from './types';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'emmanuel@vetify.pro';
const ADMIN_NAME = 'Emmanuel Alanis';

/**
 * Send notification when a new user registers
 */
export async function notifyNewUserRegistration(data: {
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  planType: 'TRIAL' | 'PAID';
  trialEndsAt?: Date;
}): Promise<EmailSendResult> {
  const emailData: NewUserRegistrationData = {
    template: 'new-user-registration',
    to: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
    },
    subject: `🎉 Nuevo Usuario: ${data.userName} - ${data.tenantName}`,
    tenantId: data.tenantId,
    data: {
      userName: data.userName,
      userEmail: data.userEmail,
      tenantName: data.tenantName,
      tenantSlug: data.tenantSlug,
      registrationDate: new Date(),
      planType: data.planType,
      trialEndsAt: data.trialEndsAt,
    },
  };

  try {
    const result = await sendEmail(emailData);

    if (result.success) {
      console.log('[ADMIN_NOTIFICATIONS] New user registration notification sent:', {
        messageId: result.messageId,
        user: data.userEmail,
        tenant: data.tenantName,
      });
    } else {
      console.error('[ADMIN_NOTIFICATIONS] Failed to send new user notification:', result.error);
    }

    return result;
  } catch (error) {
    console.error('[ADMIN_NOTIFICATIONS] Error sending new user notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification when a subscription payment is successful
 */
export async function notifyNewSubscriptionPayment(data: {
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  planName: string;
  planAmount: number; // Amount in cents
  currency: string;
  billingInterval: 'month' | 'year';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<EmailSendResult> {
  const emailData: NewSubscriptionPaymentData = {
    template: 'new-subscription-payment',
    to: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
    },
    subject: `💰 Nueva Suscripción: ${data.planName} - ${data.tenantName}`,
    tenantId: data.tenantId,
    data: {
      userName: data.userName,
      userEmail: data.userEmail,
      tenantName: data.tenantName,
      tenantSlug: data.tenantSlug,
      planName: data.planName,
      planAmount: data.planAmount,
      currency: data.currency,
      billingInterval: data.billingInterval,
      paymentDate: new Date(),
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    },
  };

  try {
    const result = await sendEmail(emailData);

    if (result.success) {
      console.log('[ADMIN_NOTIFICATIONS] New subscription payment notification sent:', {
        messageId: result.messageId,
        user: data.userEmail,
        tenant: data.tenantName,
        plan: data.planName,
        amount: data.planAmount / 100,
      });
    } else {
      console.error('[ADMIN_NOTIFICATIONS] Failed to send subscription payment notification:', result.error);
    }

    return result;
  } catch (error) {
    console.error('[ADMIN_NOTIFICATIONS] Error sending subscription payment notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
