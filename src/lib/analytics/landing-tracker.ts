/**
 * Landing Page Analytics Tracker
 *
 * Client-side tracking utility for clinic landing pages.
 * Tracks page views, form interactions, and conversions.
 *
 * Privacy considerations:
 * - No PII stored
 * - Session IDs generated client-side (no cookies)
 * - Respects Do Not Track header
 * - IP addresses are never stored (anonymized server-side)
 */

import { z } from 'zod';

// Types matching the Prisma enum
export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'FORM_START'
  | 'FORM_SUBMIT'
  | 'CONVERSION'
  | 'BUTTON_CLICK'
  | 'SCROLL_DEPTH';

export interface TrackEventParams {
  tenantSlug: string;
  eventType: AnalyticsEventType;
  pageSlug: string;
  eventName?: string;
  conversionId?: string;
}

// Validation schema for tracking events
export const trackEventSchema = z.object({
  tenantSlug: z.string().min(1),
  eventType: z.enum([
    'PAGE_VIEW',
    'FORM_START',
    'FORM_SUBMIT',
    'CONVERSION',
    'BUTTON_CLICK',
    'SCROLL_DEPTH',
  ]),
  pageSlug: z.string().min(1),
  eventName: z.string().optional(),
  sessionId: z.string().uuid(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  device: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  browser: z.string().optional(),
  conversionId: z.string().uuid().optional(),
});

export type TrackEventData = z.infer<typeof trackEventSchema>;

// Session ID management
const SESSION_KEY = 'vetify_analytics_session';

/**
 * Get or create a session ID for this browser session
 * Uses sessionStorage so it persists until tab/window is closed
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Detect device type from user agent
 */
export function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (
    /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(
      ua
    )
  ) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Get browser name from user agent
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'IE';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';

  return 'Other';
}

/**
 * Extract UTM parameters from URL
 */
export function getUTMParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

/**
 * Check if tracking should be disabled
 * Respects Do Not Track header
 */
export function isTrackingEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  // Respect Do Not Track
  if (navigator.doNotTrack === '1') return false;

  // Check for production environment
  // In development, we might want to disable tracking
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_ENABLE_DEV_ANALYTICS === 'true';
  }

  return true;
}

/**
 * Track an analytics event
 * Non-blocking - fires and forgets
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  if (!isTrackingEnabled()) return;

  const utmParams = getUTMParams();

  const data: TrackEventData = {
    tenantSlug: params.tenantSlug,
    eventType: params.eventType,
    pageSlug: params.pageSlug,
    eventName: params.eventName,
    sessionId: getSessionId(),
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    device: getDeviceType(),
    browser: getBrowserName(),
    conversionId: params.conversionId,
    ...utmParams,
  };

  try {
    // Use sendBeacon for reliability on page unload
    // Falls back to fetch for normal tracking
    const url = '/api/public/analytics';
    const body = JSON.stringify(data);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      // Fire and forget - don't await
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently ignore tracking errors
      });
    }
  } catch {
    // Silently ignore tracking errors - don't affect UX
  }
}

/**
 * Track a page view
 */
export function trackPageView(tenantSlug: string, pageSlug: string): void {
  trackEvent({
    tenantSlug,
    eventType: 'PAGE_VIEW',
    pageSlug,
  });
}

/**
 * Track form interaction start
 */
export function trackFormStart(tenantSlug: string, formName: string): void {
  trackEvent({
    tenantSlug,
    eventType: 'FORM_START',
    pageSlug: 'agendar',
    eventName: formName,
  });
}

/**
 * Track form submission
 */
export function trackFormSubmit(tenantSlug: string, formName: string): void {
  trackEvent({
    tenantSlug,
    eventType: 'FORM_SUBMIT',
    pageSlug: 'agendar',
    eventName: formName,
  });
}

/**
 * Track conversion (appointment booked)
 */
export function trackConversion(
  tenantSlug: string,
  appointmentRequestId: string
): void {
  trackEvent({
    tenantSlug,
    eventType: 'CONVERSION',
    pageSlug: 'agendar',
    conversionId: appointmentRequestId,
  });
}

/**
 * Track button click
 */
export function trackButtonClick(
  tenantSlug: string,
  pageSlug: string,
  buttonName: string
): void {
  trackEvent({
    tenantSlug,
    eventType: 'BUTTON_CLICK',
    pageSlug,
    eventName: buttonName,
  });
}
