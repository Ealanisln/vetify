/**
 * Tests for Webhook Events Definitions
 */

import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_CATEGORIES,
  ALL_WEBHOOK_EVENTS,
  isValidWebhookEvent,
  validateWebhookEvents,
  getEventDescription,
  getEventCategory,
  type WebhookEventType,
} from '@/lib/webhooks/webhook-events';

describe('Webhook Events', () => {
  describe('WEBHOOK_EVENTS', () => {
    it('should contain all expected event types', () => {
      const expectedEvents = [
        'pet.created',
        'pet.updated',
        'pet.deleted',
        'appointment.created',
        'appointment.updated',
        'appointment.cancelled',
        'inventory.low_stock',
        'inventory.transfer_completed',
        'sale.completed',
      ];

      expectedEvents.forEach((event) => {
        expect(Object.keys(WEBHOOK_EVENTS)).toContain(event);
      });
    });

    it('should have descriptions for all events', () => {
      Object.entries(WEBHOOK_EVENTS).forEach(([event, description]) => {
        expect(description).toBeTruthy();
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('WEBHOOK_EVENT_CATEGORIES', () => {
    it('should have all events categorized', () => {
      const allCategorizedEvents = Object.values(WEBHOOK_EVENT_CATEGORIES).flat();
      const allDefinedEvents = Object.keys(WEBHOOK_EVENTS);

      expect(allCategorizedEvents.sort()).toEqual(allDefinedEvents.sort());
    });

    it('should have expected categories', () => {
      expect(Object.keys(WEBHOOK_EVENT_CATEGORIES)).toContain('Mascotas');
      expect(Object.keys(WEBHOOK_EVENT_CATEGORIES)).toContain('Citas');
      expect(Object.keys(WEBHOOK_EVENT_CATEGORIES)).toContain('Inventario');
      expect(Object.keys(WEBHOOK_EVENT_CATEGORIES)).toContain('Ventas');
    });

    it('should have correct events in each category', () => {
      expect(WEBHOOK_EVENT_CATEGORIES['Mascotas']).toContain('pet.created');
      expect(WEBHOOK_EVENT_CATEGORIES['Citas']).toContain('appointment.created');
      expect(WEBHOOK_EVENT_CATEGORIES['Inventario']).toContain('inventory.low_stock');
      expect(WEBHOOK_EVENT_CATEGORIES['Ventas']).toContain('sale.completed');
    });
  });

  describe('ALL_WEBHOOK_EVENTS', () => {
    it('should match keys of WEBHOOK_EVENTS', () => {
      expect(ALL_WEBHOOK_EVENTS.sort()).toEqual(Object.keys(WEBHOOK_EVENTS).sort());
    });

    it('should have correct count', () => {
      expect(ALL_WEBHOOK_EVENTS.length).toBe(9);
    });
  });

  describe('isValidWebhookEvent', () => {
    it('should return true for valid events', () => {
      expect(isValidWebhookEvent('pet.created')).toBe(true);
      expect(isValidWebhookEvent('appointment.cancelled')).toBe(true);
      expect(isValidWebhookEvent('sale.completed')).toBe(true);
    });

    it('should return false for invalid events', () => {
      expect(isValidWebhookEvent('invalid.event')).toBe(false);
      expect(isValidWebhookEvent('pet.unknown')).toBe(false);
      expect(isValidWebhookEvent('')).toBe(false);
      expect(isValidWebhookEvent('pet')).toBe(false);
    });
  });

  describe('validateWebhookEvents', () => {
    it('should validate array of valid events', () => {
      const result = validateWebhookEvents(['pet.created', 'pet.updated', 'sale.completed']);
      expect(result.valid).toBe(true);
      expect(result.invalid).toEqual([]);
    });

    it('should identify invalid events', () => {
      const result = validateWebhookEvents(['pet.created', 'invalid.event', 'sale.completed']);
      expect(result.valid).toBe(false);
      expect(result.invalid).toEqual(['invalid.event']);
    });

    it('should identify multiple invalid events', () => {
      const result = validateWebhookEvents(['bad.event', 'pet.created', 'another.bad']);
      expect(result.valid).toBe(false);
      expect(result.invalid).toEqual(['bad.event', 'another.bad']);
    });

    it('should handle empty array', () => {
      const result = validateWebhookEvents([]);
      expect(result.valid).toBe(true);
      expect(result.invalid).toEqual([]);
    });
  });

  describe('getEventDescription', () => {
    it('should return description for valid event', () => {
      expect(getEventDescription('pet.created')).toBe('When a new pet is registered');
      expect(getEventDescription('appointment.cancelled')).toBe('When an appointment is cancelled');
    });

    it('should return correct descriptions', () => {
      ALL_WEBHOOK_EVENTS.forEach((event) => {
        const description = getEventDescription(event);
        expect(description).toBeTruthy();
        expect(description).toBe(WEBHOOK_EVENTS[event]);
      });
    });
  });

  describe('getEventCategory', () => {
    it('should return category for valid event', () => {
      expect(getEventCategory('pet.created')).toBe('Mascotas');
      expect(getEventCategory('appointment.created')).toBe('Citas');
      expect(getEventCategory('inventory.low_stock')).toBe('Inventario');
      expect(getEventCategory('sale.completed')).toBe('Ventas');
    });

    it('should return null for invalid event', () => {
      expect(getEventCategory('invalid.event' as WebhookEventType)).toBeNull();
    });
  });
});
