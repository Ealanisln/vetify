/**
 * Meta (Facebook) Pixel Standard Events
 *
 * This module provides typed functions for tracking standard Meta Pixel events
 * specific to the Vetify platform. Each function handles data sanitization
 * and validation before sending to Meta Pixel.
 *
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */

'use client';

import { trackEvent } from './meta-pixel';
import {
  sanitizeForTracking,
  validateEventData,
  sanitizeClinicName,
} from './privacy';
import type {
  CompleteRegistrationData,
  ViewContentData,
  LeadData,
  PurchaseData,
  StartTrialData,
} from './types';

/**
 * Track CompleteRegistration event
 * Triggered when a user completes the onboarding process
 *
 * @param data - Registration data
 *
 * @example
 * ```ts
 * trackCompleteRegistration({
 *   plan_name: 'Profesional',
 *   plan_key: 'profesional',
 *   billing_interval: 'monthly',
 *   is_trial: true,
 *   currency: 'MXN',
 *   value: 1199
 * });
 * ```
 */
export function trackCompleteRegistration(
  data: CompleteRegistrationData
): void {
  // Sanitize clinic name if provided
  const sanitizedData = {
    ...data,
    clinic_name: data.clinic_name
      ? sanitizeClinicName(data.clinic_name)
      : undefined,
  };

  // Remove any sensitive fields
  const cleanData = sanitizeForTracking(sanitizedData);

  // Validate in development
  validateEventData('CompleteRegistration', cleanData);

  // Track the event
  trackEvent('CompleteRegistration', {
    ...cleanData,
    content_name: data.plan_name || 'Unknown Plan',
    status: 'completed',
  });
}

/**
 * Track ViewContent event
 * Triggered when a user views important content (e.g., pricing page)
 *
 * @param data - Content view data
 *
 * @example
 * ```ts
 * trackViewContent({
 *   content_type: 'pricing',
 *   content_name: 'Pricing Page',
 *   currency: 'MXN'
 * });
 * ```
 */
export function trackViewContent(data: ViewContentData): void {
  // Remove any sensitive fields
  const cleanData = sanitizeForTracking(data);

  // Validate in development
  validateEventData('ViewContent', cleanData);

  // Track the event
  trackEvent('ViewContent', cleanData);
}

/**
 * Track Lead event
 * Triggered when a potential customer shows interest (e.g., creates appointment)
 *
 * @param data - Lead data
 *
 * @example
 * ```ts
 * trackLead({
 *   lead_type: 'appointment',
 *   content_name: 'Consulta General',
 *   currency: 'MXN',
 *   value: 500,
 *   scheduled_date: '2024-03-15'
 * });
 * ```
 */
export function trackLead(data: LeadData): void {
  // Remove any sensitive fields
  const cleanData = sanitizeForTracking(data);

  // Validate in development
  validateEventData('Lead', cleanData);

  // Track the event
  trackEvent('Lead', {
    ...cleanData,
    content_name: data.content_name || 'Lead',
  });
}

/**
 * Track Purchase event
 * Triggered when a user completes a subscription purchase
 *
 * @param data - Purchase data
 *
 * @example
 * ```ts
 * trackPurchase({
 *   transaction_id: 'sub_1234567890',
 *   value: 1199,
 *   currency: 'MXN',
 *   plan_name: 'Profesional',
 *   billing_interval: 'monthly',
 *   content_type: 'subscription',
 *   num_items: 1
 * });
 * ```
 */
export function trackPurchase(data: PurchaseData): void {
  // Remove any sensitive fields
  const cleanData = sanitizeForTracking(data);

  // Validate in development
  validateEventData('Purchase', cleanData);

  // Ensure required fields are present
  if (!data.transaction_id || !data.value || !data.currency) {
    console.error(
      '[Meta Pixel] Purchase event missing required fields',
      cleanData
    );
    return;
  }

  // Track the event with required parameters
  trackEvent('Purchase', {
    value: cleanData.value,
    currency: cleanData.currency,
    ...cleanData,
  });
}

/**
 * Track StartTrial event (custom event)
 * Triggered when a user starts a trial period
 *
 * @param data - Trial start data
 *
 * @example
 * ```ts
 * trackStartTrial({
 *   plan_name: 'Profesional',
 *   plan_key: 'profesional',
 *   trial_end_date: '2024-04-01',
 *   currency: 'MXN',
 *   value: 1199,
 *   trial_duration_days: 14
 * });
 * ```
 */
export function trackStartTrial(data: StartTrialData): void {
  // Remove any sensitive fields
  const cleanData = sanitizeForTracking(data);

  // Validate in development
  validateEventData('StartTrial', cleanData);

  // Track as standard event
  trackEvent('StartTrial', {
    ...cleanData,
    content_name: data.plan_name,
    predicted_ltv: data.value,
  });
}

/**
 * Track a page-specific view event
 * Helper function for tracking specific page views with context
 *
 * @param pageName - Name of the page being viewed
 * @param additionalData - Additional context data
 *
 * @example
 * ```ts
 * trackPageViewWithContext('Dashboard', {
 *   section: 'appointments',
 *   user_tier: 'premium'
 * });
 * ```
 */
export function trackPageViewWithContext(
  pageName: string,
  additionalData?: Record<string, unknown>
): void {
  const cleanData = sanitizeForTracking(additionalData || {});

  validateEventData('PageView', cleanData);

  trackEvent('PageView', {
    page_name: pageName,
    ...cleanData,
  });
}

/**
 * Track Schedule event (standard Meta event)
 * Useful for tracking appointment scheduling
 *
 * @param data - Scheduling data
 *
 * @example
 * ```ts
 * trackSchedule({
 *   content_name: 'Consulta Veterinaria',
 *   value: 500,
 *   currency: 'MXN',
 *   scheduled_date: '2024-03-15'
 * });
 * ```
 */
export function trackSchedule(data: {
  content_name: string;
  value?: number;
  currency?: string;
  scheduled_date?: string;
}): void {
  const cleanData = sanitizeForTracking(data);

  validateEventData('Schedule', cleanData);

  trackEvent('Schedule', cleanData);
}

/**
 * Track Contact event (standard Meta event)
 * Triggered when user initiates contact (e.g., support request)
 *
 * @param contactType - Type of contact (support, sales, demo, etc.)
 *
 * @example
 * ```ts
 * trackContact('support');
 * ```
 */
export function trackContact(contactType?: string): void {
  const data = contactType ? { contact_type: contactType } : {};

  validateEventData('Contact', data);

  trackEvent('Contact', data);
}

/**
 * Track Subscribe event (standard Meta event)
 * Triggered when user subscribes to a service or newsletter
 *
 * @param data - Subscription data
 *
 * @example
 * ```ts
 * trackSubscribe({
 *   content_name: 'Newsletter',
 *   value: 0,
 *   currency: 'MXN'
 * });
 * ```
 */
export function trackSubscribe(data?: {
  content_name?: string;
  value?: number;
  currency?: string;
}): void {
  const cleanData = sanitizeForTracking(data || {});

  validateEventData('Subscribe', cleanData);

  trackEvent('Subscribe', cleanData);
}

/**
 * PWA Installation Event Types
 */
export type PWAInstallEventType =
  | 'pwa_prompt_shown'
  | 'pwa_install_accepted'
  | 'pwa_install_dismissed'
  | 'pwa_installed';

/**
 * Track PWA installation events
 * Custom events for tracking PWA installation funnel
 *
 * @param eventType - Type of PWA installation event
 * @param additionalData - Optional additional context
 *
 * @example
 * ```ts
 * trackPWAInstall('pwa_prompt_shown', { platform: 'android' });
 * trackPWAInstall('pwa_install_accepted');
 * trackPWAInstall('pwa_install_dismissed');
 * trackPWAInstall('pwa_installed');
 * ```
 */
export function trackPWAInstall(
  eventType: PWAInstallEventType,
  additionalData?: Record<string, unknown>
): void {
  const data = {
    event_type: eventType,
    platform: detectPlatform(),
    ...additionalData,
  };

  const cleanData = sanitizeForTracking(data);
  validateEventData(eventType, cleanData);

  // Track as custom event in Meta Pixel
  trackEvent(eventType, cleanData);

  // Also track in Umami if available
  if (typeof window !== 'undefined' && 'umami' in window) {
    const umami = window.umami as { track?: (event: string, data?: Record<string, unknown>) => void };
    if (umami?.track) {
      umami.track(eventType, cleanData);
    }
  }
}

/**
 * Helper to detect platform for PWA analytics
 */
function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent || '';

  if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  if (/Windows/.test(userAgent)) return 'windows';
  if (/Mac/.test(userAgent)) return 'macos';
  if (/Linux/.test(userAgent)) return 'linux';

  return 'other';
}
