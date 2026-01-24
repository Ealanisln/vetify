/**
 * Webhook Delivery Service
 *
 * Handles webhook event triggering, delivery with retry logic,
 * and automatic disabling after consecutive failures.
 */

import { prisma } from '@/lib/prisma';
import { WebhookDeliveryStatus } from '@prisma/client';
import { WebhookEventType, isValidWebhookEvent } from './webhook-events';
import { signPayload } from './webhook-signature';

/**
 * Retry delays in milliseconds
 * Attempt 1: Immediate
 * Attempt 2: 1 minute
 * Attempt 3: 5 minutes
 * Attempt 4: 30 minutes
 */
export const RETRY_DELAYS = [0, 60000, 300000, 1800000];

/**
 * Maximum number of retry attempts
 */
export const MAX_RETRY_ATTEMPTS = 4;

/**
 * Number of consecutive failures before auto-disabling
 */
export const MAX_CONSECUTIVE_FAILURES = 10;

/**
 * Delivery timeout in milliseconds
 */
export const DELIVERY_TIMEOUT = 30000;

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = Record<string, unknown>> {
  event: WebhookEventType;
  timestamp: string;
  data: T;
}

/**
 * Delivery result
 */
export interface DeliveryResult {
  success: boolean;
  httpStatusCode?: number;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
}

/**
 * Triggers a webhook event for a tenant (fire-and-forget)
 *
 * Finds all active webhooks subscribed to the event type and
 * schedules delivery for each one.
 *
 * @param tenantId - The tenant ID
 * @param eventType - The event type being triggered
 * @param data - The event data payload
 */
export async function triggerWebhookEvent<T extends Record<string, unknown>>(
  tenantId: string,
  eventType: WebhookEventType,
  data: T
): Promise<void> {
  // Validate event type
  if (!isValidWebhookEvent(eventType)) {
    console.warn(`[Webhooks] Invalid event type: ${eventType}`);
    return;
  }

  try {
    // Find all active webhooks for this tenant that are subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: {
          has: eventType,
        },
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    // Create the payload
    const payload: WebhookPayload<T> = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Schedule delivery for each webhook (fire-and-forget)
    const deliveryPromises = webhooks.map(webhook =>
      deliverWebhook(webhook.id, eventType, payload, 1).catch(err => {
        console.error(`[Webhooks] Failed to deliver to webhook ${webhook.id}:`, err);
      })
    );

    // Don't await - fire and forget
    Promise.allSettled(deliveryPromises);
  } catch (error) {
    console.error(`[Webhooks] Error triggering event ${eventType}:`, error);
  }
}

/**
 * Delivers a webhook payload to the configured endpoint
 *
 * @param webhookId - The webhook configuration ID
 * @param eventType - The event type being delivered
 * @param payload - The payload to deliver
 * @param attempt - Current attempt number (1-based)
 * @returns Delivery result
 */
export async function deliverWebhook(
  webhookId: string,
  eventType: string,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<DeliveryResult> {
  // Get webhook configuration
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    return { success: false, error: 'Webhook not found' };
  }

  if (!webhook.isActive) {
    return { success: false, error: 'Webhook is disabled' };
  }

  const payloadString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const deliveryId = crypto.randomUUID();
  const signature = signPayload(payloadString, webhook.secret, timestamp);

  // Create delivery log entry
  const deliveryLog = await prisma.webhookDeliveryLog.create({
    data: {
      webhookId,
      eventType,
      payload: payload as object,
      attempt,
      status: WebhookDeliveryStatus.PENDING,
    },
  });

  let result: DeliveryResult;

  try {
    // Make the HTTP request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vetify-Signature': signature,
        'X-Vetify-Event': eventType,
        'X-Vetify-Delivery-Id': deliveryId,
        'X-Vetify-Timestamp': timestamp.toString(),
        'User-Agent': 'Vetify-Webhooks/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Read response body (limited to prevent memory issues)
    let responseBody = '';
    try {
      responseBody = await response.text();
      if (responseBody.length > 10000) {
        responseBody = responseBody.slice(0, 10000) + '... (truncated)';
      }
    } catch {
      responseBody = '(Unable to read response body)';
    }

    const isSuccess = response.ok; // 2xx status codes

    result = {
      success: isSuccess,
      httpStatusCode: response.status,
      responseBody,
      deliveredAt: new Date(),
    };

    // Update delivery log
    await prisma.webhookDeliveryLog.update({
      where: { id: deliveryLog.id },
      data: {
        status: isSuccess ? WebhookDeliveryStatus.DELIVERED : WebhookDeliveryStatus.FAILED,
        httpStatusCode: response.status,
        responseBody,
        deliveredAt: new Date(),
      },
    });

    // Update webhook stats
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastDeliveryAt: new Date(),
        ...(isSuccess
          ? {
              lastSuccessAt: new Date(),
              consecutiveFailures: 0,
            }
          : {
              consecutiveFailures: { increment: 1 },
            }),
      },
    });

    // If failed and we have retries left, schedule retry
    if (!isSuccess && attempt < MAX_RETRY_ATTEMPTS) {
      scheduleRetry(webhookId, eventType, payload, attempt + 1, deliveryLog.id);
    } else if (!isSuccess) {
      // Max retries reached, check if we should disable
      await checkAndDisableWebhook(webhookId);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const isTimeout = error instanceof Error && error.name === 'AbortError';

    result = {
      success: false,
      error: isTimeout ? 'Request timed out' : errorMessage,
    };

    // Update delivery log with error
    await prisma.webhookDeliveryLog.update({
      where: { id: deliveryLog.id },
      data: {
        status: WebhookDeliveryStatus.FAILED,
        error: errorMessage,
      },
    });

    // Update webhook failure count
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastDeliveryAt: new Date(),
        consecutiveFailures: { increment: 1 },
      },
    });

    // Schedule retry if attempts remaining
    if (attempt < MAX_RETRY_ATTEMPTS) {
      scheduleRetry(webhookId, eventType, payload, attempt + 1, deliveryLog.id);
    } else {
      await checkAndDisableWebhook(webhookId);
    }
  }

  return result;
}

/**
 * Schedules a retry delivery
 *
 * Note: In a production environment, this would use a proper job queue
 * like BullMQ, Temporal, or similar. For simplicity, we use setTimeout
 * with the understanding that retries won't survive server restarts.
 */
function scheduleRetry(
  webhookId: string,
  eventType: string,
  payload: WebhookPayload,
  attempt: number,
  originalDeliveryId: string
): void {
  const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

  // Update original delivery log with scheduled retry time
  prisma.webhookDeliveryLog
    .update({
      where: { id: originalDeliveryId },
      data: {
        scheduledFor: new Date(Date.now() + delay),
      },
    })
    .catch(err => {
      console.error('[Webhooks] Failed to update delivery log with retry schedule:', err);
    });

  setTimeout(() => {
    deliverWebhook(webhookId, eventType, payload, attempt).catch(err => {
      console.error(`[Webhooks] Retry attempt ${attempt} failed for webhook ${webhookId}:`, err);
    });
  }, delay);
}

/**
 * Checks if a webhook should be disabled due to consecutive failures
 * and disables it if the threshold is reached.
 */
export async function checkAndDisableWebhook(webhookId: string): Promise<boolean> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    select: { consecutiveFailures: true, isActive: true },
  });

  if (!webhook || !webhook.isActive) {
    return false;
  }

  if (webhook.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { isActive: false },
    });

    console.warn(
      `[Webhooks] Webhook ${webhookId} disabled after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`
    );
    return true;
  }

  return false;
}

/**
 * Sends a test ping event to a webhook
 * Returns the delivery result immediately (synchronous delivery)
 */
export async function sendTestWebhook(webhookId: string): Promise<DeliveryResult> {
  const payload: WebhookPayload<{ message: string }> = {
    event: 'pet.created' as WebhookEventType, // Use a valid event type for the test
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook from Vetify',
      test: true,
    } as Record<string, unknown>,
  };

  // Deliver synchronously for test (no retries)
  return deliverWebhookSync(webhookId, 'test.ping', payload);
}

/**
 * Synchronous webhook delivery (for testing)
 * Does not schedule retries and returns result immediately
 */
async function deliverWebhookSync(
  webhookId: string,
  eventType: string,
  payload: WebhookPayload
): Promise<DeliveryResult> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    return { success: false, error: 'Webhook not found' };
  }

  if (!webhook.isActive) {
    return { success: false, error: 'Webhook is disabled' };
  }

  const payloadString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const deliveryId = crypto.randomUUID();
  const signature = signPayload(payloadString, webhook.secret, timestamp);

  // Create delivery log entry
  const deliveryLog = await prisma.webhookDeliveryLog.create({
    data: {
      webhookId,
      eventType,
      payload: payload as object,
      attempt: 1,
      status: WebhookDeliveryStatus.PENDING,
    },
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vetify-Signature': signature,
        'X-Vetify-Event': eventType,
        'X-Vetify-Delivery-Id': deliveryId,
        'X-Vetify-Timestamp': timestamp.toString(),
        'User-Agent': 'Vetify-Webhooks/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let responseBody = '';
    try {
      responseBody = await response.text();
      if (responseBody.length > 10000) {
        responseBody = responseBody.slice(0, 10000) + '... (truncated)';
      }
    } catch {
      responseBody = '(Unable to read response body)';
    }

    const isSuccess = response.ok;

    // Update delivery log
    await prisma.webhookDeliveryLog.update({
      where: { id: deliveryLog.id },
      data: {
        status: isSuccess ? WebhookDeliveryStatus.DELIVERED : WebhookDeliveryStatus.FAILED,
        httpStatusCode: response.status,
        responseBody,
        deliveredAt: new Date(),
      },
    });

    return {
      success: isSuccess,
      httpStatusCode: response.status,
      responseBody,
      deliveredAt: new Date(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const isTimeout = error instanceof Error && error.name === 'AbortError';

    await prisma.webhookDeliveryLog.update({
      where: { id: deliveryLog.id },
      data: {
        status: WebhookDeliveryStatus.FAILED,
        error: errorMessage,
      },
    });

    return {
      success: false,
      error: isTimeout ? 'Request timed out' : errorMessage,
    };
  }
}
