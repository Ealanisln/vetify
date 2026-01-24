/**
 * Webhook Events Definitions
 *
 * Defines all available webhook event types that tenants can subscribe to
 * for receiving real-time notifications about system events.
 */

export const WEBHOOK_EVENTS = {
  'pet.created': 'When a new pet is registered',
  'pet.updated': 'When pet information is modified',
  'pet.deleted': 'When a pet record is removed',
  'appointment.created': 'When a new appointment is scheduled',
  'appointment.updated': 'When appointment details are modified',
  'appointment.cancelled': 'When an appointment is cancelled',
  'inventory.low_stock': 'When inventory falls below minimum stock',
  'inventory.transfer_completed': 'When inventory transfer is completed',
  'sale.completed': 'When a sale is fully paid',
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS;

/**
 * Event categories for UI grouping (Spanish labels for Vetify)
 */
export const WEBHOOK_EVENT_CATEGORIES: Record<string, WebhookEventType[]> = {
  'Mascotas': ['pet.created', 'pet.updated', 'pet.deleted'],
  'Citas': ['appointment.created', 'appointment.updated', 'appointment.cancelled'],
  'Inventario': ['inventory.low_stock', 'inventory.transfer_completed'],
  'Ventas': ['sale.completed'],
};

/**
 * All available event types as an array
 */
export const ALL_WEBHOOK_EVENTS = Object.keys(WEBHOOK_EVENTS) as WebhookEventType[];

/**
 * Validates if a given string is a valid webhook event type
 */
export function isValidWebhookEvent(event: string): event is WebhookEventType {
  return event in WEBHOOK_EVENTS;
}

/**
 * Validates an array of event types
 */
export function validateWebhookEvents(events: string[]): { valid: boolean; invalid: string[] } {
  const invalid = events.filter(e => !isValidWebhookEvent(e));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}

/**
 * Get description for an event type
 */
export function getEventDescription(event: WebhookEventType): string {
  return WEBHOOK_EVENTS[event];
}

/**
 * Get category for an event type
 */
export function getEventCategory(event: WebhookEventType): string | null {
  for (const [category, events] of Object.entries(WEBHOOK_EVENT_CATEGORIES)) {
    if (events.includes(event)) {
      return category;
    }
  }
  return null;
}
