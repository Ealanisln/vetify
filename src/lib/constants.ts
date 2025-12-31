/**
 * Centralized constants for Vetify application
 * Extract magic numbers and configuration values for better maintainability
 */

// =============================================================================
// TRIAL & SUBSCRIPTION CONSTANTS
// =============================================================================

/**
 * Number of days before trial end to show "ending soon" warning
 * Used in: trial/utils.ts, SubscriptionNotifications.tsx
 */
export const TRIAL_WARNING_DAYS = 3;

/**
 * Threshold (as decimal) for showing usage warnings (e.g., 0.8 = 80%)
 * Used in: plan-limits.ts for pets, users, whatsapp, storage warnings
 */
export const USAGE_WARNING_THRESHOLD = 0.8;

/**
 * Trial period duration in days
 */
export const TRIAL_PERIOD_DAYS = 30;

// =============================================================================
// DEFAULT PLAN LIMITS (BASICO/Trial Plan)
// =============================================================================

/**
 * Default limits for BASICO plan (also used during trial period)
 * These values are used when no tenant subscription exists
 */
export const DEFAULT_PLAN_LIMITS = {
  /** Maximum number of pets */
  maxPets: 300,
  /** Maximum number of users */
  maxUsers: 3,
  /** Maximum storage in GB */
  maxStorageGB: 5,
  /** Maximum cash registers */
  maxCashRegisters: 1,
  /** WhatsApp messages: -1 means unlimited */
  maxMonthlyWhatsApp: -1,
} as const;

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

/**
 * Short animation duration in milliseconds
 * Used for: banner dismissals, transitions, fade effects
 */
export const ANIMATION_DURATION_SHORT = 300;

/**
 * Medium animation duration in milliseconds
 */
export const ANIMATION_DURATION_MEDIUM = 500;

// =============================================================================
// STORAGE CONSTANTS
// =============================================================================

/**
 * Default TTL for localStorage items in milliseconds
 * 7 days = 7 * 24 * 60 * 60 * 1000
 */
export const STORAGE_TTL_DEFAULT = 7 * 24 * 60 * 60 * 1000;

/**
 * TTL for notification dismissals (7 days)
 */
export const STORAGE_TTL_NOTIFICATION_DISMISSAL = 7 * 24 * 60 * 60 * 1000;

/**
 * TTL for location selection cache (1 hour)
 */
export const STORAGE_TTL_LOCATION_CACHE = 60 * 60 * 1000;

// =============================================================================
// PAGINATION CONSTANTS
// =============================================================================

/**
 * Default page size for paginated lists
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Maximum allowed page size
 */
export const MAX_PAGE_SIZE = 100;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

/**
 * Maximum file upload size in bytes (10MB)
 */
export const MAX_FILE_UPLOAD_SIZE = 10 * 1024 * 1024;

/**
 * Allowed image file types
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

/**
 * Debounce delay for search inputs in milliseconds
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Toast notification duration in milliseconds
 */
export const TOAST_DURATION_MS = 5000;
