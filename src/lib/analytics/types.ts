/**
 * Meta (Facebook) Pixel Event Types
 *
 * This file defines TypeScript interfaces for Meta Pixel standard events
 * and custom event data structures used in the Vetify platform.
 */

/**
 * Standard Meta Pixel Events
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */
export type MetaPixelEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe';

/**
 * Data for CompleteRegistration event
 * Triggered when a user completes the onboarding process
 */
export interface CompleteRegistrationData {
  /** Name of the subscription plan selected */
  plan_name?: string;
  /** Plan key identifier (basico, profesional, corporativo) */
  plan_key?: string;
  /** Billing interval (monthly or yearly) */
  billing_interval?: 'monthly' | 'yearly';
  /** Whether this is a trial period registration */
  is_trial?: boolean;
  /** Clinic/tenant name (sanitized, no PII) */
  clinic_name?: string;
  /** Currency code (default: MXN) */
  currency?: string;
  /** Estimated value of the registration */
  value?: number;
  /** Registration status */
  status?: string;
}

/**
 * Data for ViewContent event
 * Triggered when a user views important content like pricing pages
 */
export interface ViewContentData {
  /** Type of content being viewed */
  content_type: 'pricing' | 'product' | 'service' | 'plan';
  /** Name of the content */
  content_name?: string;
  /** Currency for pricing content */
  currency?: string;
  /** Value/price of the content if applicable */
  value?: number;
  /** Additional content category */
  content_category?: string;
  /** Array of content IDs */
  content_ids?: string[];
}

/**
 * Data for Lead event
 * Triggered when a potential customer takes an action that indicates interest
 * (e.g., creating an appointment, requesting information)
 */
export interface LeadData {
  /** Type of lead action */
  lead_type: 'appointment' | 'contact' | 'demo_request' | 'inquiry';
  /** Service or product related to the lead */
  content_name?: string;
  /** Currency code */
  currency?: string;
  /** Estimated value of the lead */
  value?: number;
  /** When the appointment/action is scheduled for */
  scheduled_date?: string;
  /** Lead status */
  status?: string;
}

/**
 * Data for Purchase event
 * Triggered when a user completes a subscription purchase
 */
export interface PurchaseData {
  /** Unique transaction ID from Stripe */
  transaction_id: string;
  /** Total purchase value */
  value: number;
  /** Currency code (MXN) */
  currency: string;
  /** Array of purchased items/plans */
  content_ids?: string[];
  /** Type of purchase */
  content_type?: 'subscription' | 'upgrade' | 'addon';
  /** Number of items purchased */
  num_items?: number;
  /** Plan name */
  plan_name?: string;
  /** Billing interval */
  billing_interval?: 'monthly' | 'yearly';
}

/**
 * Data for StartTrial event (custom event)
 * Triggered when a user starts a trial period
 */
export interface StartTrialData {
  /** Trial period plan */
  plan_name: string;
  /** Plan key */
  plan_key: string;
  /** When the trial ends */
  trial_end_date: string;
  /** Currency code */
  currency?: string;
  /** Value/price of the plan after trial */
  value?: number;
  /** Trial duration in days */
  trial_duration_days?: number;
}

/**
 * Generic event parameters that can be added to any event
 */
export interface GenericEventParams {
  /** Additional custom properties */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Facebook Pixel API interface (declared globally by Meta's script)
 */
export interface FacebookPixel {
  (
    action: 'track',
    event: MetaPixelEvent,
    params?: Record<string, unknown>
  ): void;
  (action: 'trackCustom', event: string, params?: Record<string, unknown>): void;
  (action: 'init', pixelId: string, options?: Record<string, unknown>): void;
  queue?: unknown[];
}

/**
 * Window interface extension for Facebook Pixel
 */
declare global {
  interface Window {
    fbq?: FacebookPixel;
    _fbq?: FacebookPixel;
  }
}
