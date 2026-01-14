/**
 * Push Notifications Service
 *
 * This module handles Web Push notifications for the Vetify PWA.
 * It requires VAPID keys to be set in environment variables:
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (e.g., "mailto:admin@vetify.app")
 *
 * Generate VAPID keys using: npx web-push generate-vapid-keys
 */

import webpush from 'web-push';

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@vetify.app';

// Configure web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!isPushConfigured()) {
    return { success: false, error: 'Push notifications not configured' };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific error codes
    if (error instanceof webpush.WebPushError) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription has expired or is no longer valid
        return { success: false, error: 'subscription_expired' };
      }
    }

    console.error('[Push] Error sending notification:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send notifications to multiple subscriptions
 * Returns results for each subscription
 */
export async function sendBulkNotifications(
  subscriptions: Array<{ id: string; subscription: PushSubscriptionData }>,
  payload: NotificationPayload
): Promise<Array<{ id: string; success: boolean; error?: string }>> {
  const results = await Promise.allSettled(
    subscriptions.map(async ({ id, subscription }) => {
      const result = await sendPushNotification(subscription, payload);
      return { id, ...result };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      id: subscriptions[index].id,
      success: false,
      error: 'Promise rejected',
    };
  });
}

/**
 * Notification types for the application
 */
export const NotificationTypes = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  LOW_STOCK_ALERT: 'low_stock_alert',
  TREATMENT_REMINDER: 'treatment_reminder',
  NEW_APPOINTMENT_REQUEST: 'new_appointment_request',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

/**
 * Create a notification payload for common notification types
 */
export function createNotificationPayload(
  type: NotificationType,
  data: Record<string, unknown>
): NotificationPayload {
  const basePayload: NotificationPayload = {
    title: '',
    body: '',
    icon: '/favicon/android-chrome-192x192.png',
    badge: '/favicon/favicon-96x96.png',
    data: { type, ...data },
  };

  switch (type) {
    case NotificationTypes.APPOINTMENT_REMINDER:
      return {
        ...basePayload,
        title: 'Recordatorio de Cita',
        body: `Tienes una cita programada para ${data.petName || 'tu mascota'}`,
        tag: `appointment-${data.appointmentId}`,
        actions: [
          { action: 'view', title: 'Ver detalles' },
          { action: 'dismiss', title: 'Descartar' },
        ],
      };

    case NotificationTypes.APPOINTMENT_CONFIRMATION:
      return {
        ...basePayload,
        title: 'Cita Confirmada',
        body: `Tu cita para ${data.petName || 'tu mascota'} ha sido confirmada`,
        tag: `appointment-${data.appointmentId}`,
      };

    case NotificationTypes.APPOINTMENT_CANCELLED:
      return {
        ...basePayload,
        title: 'Cita Cancelada',
        body: `La cita para ${data.petName || 'tu mascota'} ha sido cancelada`,
        tag: `appointment-${data.appointmentId}`,
      };

    case NotificationTypes.LOW_STOCK_ALERT:
      return {
        ...basePayload,
        title: 'Alerta de Stock Bajo',
        body: `${data.itemName} tiene stock bajo (${data.quantity} unidades)`,
        tag: `stock-${data.itemId}`,
        actions: [
          { action: 'view', title: 'Ver inventario' },
        ],
      };

    case NotificationTypes.TREATMENT_REMINDER:
      return {
        ...basePayload,
        title: 'Recordatorio de Tratamiento',
        body: `${data.petName || 'Una mascota'} necesita ${data.treatmentType}`,
        tag: `treatment-${data.scheduleId}`,
      };

    case NotificationTypes.NEW_APPOINTMENT_REQUEST:
      return {
        ...basePayload,
        title: 'Nueva Solicitud de Cita',
        body: `${data.customerName} ha solicitado una cita`,
        tag: `request-${data.requestId}`,
        actions: [
          { action: 'view', title: 'Revisar' },
        ],
      };

    default:
      return basePayload;
  }
}
