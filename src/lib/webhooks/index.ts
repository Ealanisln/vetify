/**
 * Webhook System
 *
 * Provides outbound webhook functionality for real-time event notifications.
 * Tenants can subscribe to events and receive HTTP POST requests with HMAC-signed payloads.
 */

// Event definitions
export {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_CATEGORIES,
  ALL_WEBHOOK_EVENTS,
  isValidWebhookEvent,
  validateWebhookEvents,
  getEventDescription,
  getEventCategory,
  type WebhookEventType,
} from './webhook-events';

// Signature utilities
export {
  generateWebhookSecret,
  signPayload,
  verifySignature,
  extractSignatureHash,
  isValidWebhookSecret,
} from './webhook-signature';

// Delivery service
export {
  triggerWebhookEvent,
  deliverWebhook,
  sendTestWebhook,
  checkAndDisableWebhook,
  RETRY_DELAYS,
  MAX_RETRY_ATTEMPTS,
  MAX_CONSECUTIVE_FAILURES,
  DELIVERY_TIMEOUT,
  type WebhookPayload,
  type DeliveryResult,
} from './webhook-delivery';
