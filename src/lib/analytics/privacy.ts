/**
 * Privacy and Data Sanitization Utilities for Meta Pixel
 *
 * This module ensures GDPR/HIPAA compliance by sanitizing data before
 * sending it to Meta Pixel. It removes PII (Personally Identifiable Information)
 * and PHI (Protected Health Information).
 *
 * CRITICAL: Never send:
 * - Email addresses
 * - Phone numbers
 * - Full names
 * - Pet health information
 * - Medical records
 * - Addresses
 * - Any other sensitive personal data
 */

/**
 * List of sensitive field names that should never be tracked
 * These fields will be removed from any data sent to Meta Pixel
 */
const BLOCKED_FIELDS = [
  // Personal Identifiable Information (PII)
  'email',
  'phone',
  'phoneNumber',
  'phone_number',
  'firstName',
  'lastName',
  'first_name',
  'last_name',
  'fullName',
  'full_name',
  'name', // Only specific names, not generic labels
  'address',
  'street',
  'city',
  'state',
  'zip',
  'zipCode',
  'zip_code',
  'postalCode',
  'postal_code',
  'country',

  // Health Information (PHI)
  'diagnosis',
  'treatment',
  'medication',
  'symptoms',
  'medicalHistory',
  'medical_history',
  'vetNote',
  'vet_note',
  'prescription',
  'healthRecord',
  'health_record',

  // Pet Owner Information
  'ownerEmail',
  'owner_email',
  'ownerPhone',
  'owner_phone',
  'ownerName',
  'owner_name',

  // Authentication & Security
  'password',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'apiKey',
  'api_key',
  'secret',

  // Financial Information
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'taxId',
  'tax_id',
] as const;

/**
 * Check if a field name is sensitive and should be blocked
 */
function isBlockedField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  return BLOCKED_FIELDS.some((blocked) =>
    lowerFieldName.includes(blocked.toLowerCase())
  );
}

/**
 * Sanitize an object by removing sensitive fields
 * Recursively processes nested objects and arrays
 *
 * @param data - Object to sanitize
 * @returns Sanitized object with sensitive fields removed
 */
export function sanitizeForTracking<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip blocked fields
    if (isBlockedField(key)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Meta Pixel Privacy] Blocked sensitive field: ${key}`);
      }
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeForTracking(value as Record<string, unknown>);
    }
    // Sanitize arrays of objects
    else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeForTracking(item as Record<string, unknown>)
          : item
      );
    }
    // Keep safe primitive values
    else {
      sanitized[key] = value;
    }
  }

  return sanitized as Partial<T>;
}

/**
 * Sanitize a clinic/tenant name by removing potential PII
 * Keeps only business-relevant information
 *
 * @param clinicName - Original clinic name
 * @returns Sanitized clinic name (e.g., "Veterinaria Central" → "Veterinaria")
 */
export function sanitizeClinicName(clinicName: string): string {
  if (!clinicName) return 'Unknown Clinic';

  // Remove common PII patterns from clinic names
  // Examples: "Veterinaria Dr. Juan Pérez" → "Veterinaria"
  return clinicName
    .replace(/Dr\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+/gi, '') // Remove "Dr. First Last"
    .replace(/\b(de|del|los|las)\b/gi, '') // Remove Spanish articles
    .trim()
    .substring(0, 50); // Limit length
}

/**
 * Validate that event data doesn't contain sensitive information
 * Throws an error in development if sensitive data is detected
 *
 * @param eventName - Name of the event being tracked
 * @param params - Event parameters to validate
 */
export function validateEventData(
  eventName: string,
  params: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== 'development') {
    return; // Only validate in development
  }

  const sensitivePatterns = [
    /@/, // Email addresses
    /\d{10,}/, // Phone numbers (10+ digits)
    /\d{3}-\d{2}-\d{4}/, // SSN pattern
    /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card pattern
  ];

  const dataString = JSON.stringify(params);

  for (const pattern of sensitivePatterns) {
    if (pattern.test(dataString)) {
      console.error(
        `[Meta Pixel Privacy] POTENTIAL SENSITIVE DATA DETECTED in event "${eventName}"`,
        params
      );
      throw new Error(
        `Sensitive data detected in Meta Pixel event "${eventName}". ` +
          'Please sanitize your data before tracking.'
      );
    }
  }
}

/**
 * Check if Meta Pixel tracking is enabled based on environment
 * Pixel should only be active in production to avoid polluting analytics data
 *
 * @returns Whether tracking is enabled
 */
export function isTrackingEnabled(): boolean {
  // Only track in production OR when explicitly enabled in development
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_META_PIXEL_DEBUG === 'true'
  );
}

/**
 * Log tracking event in development mode
 * Helps developers verify events are being triggered correctly
 *
 * @param eventName - Name of the event
 * @param params - Event parameters
 */
export function logTrackingEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[Meta Pixel] Event: ${eventName}`,
      params ? JSON.stringify(params, null, 2) : '(no params)'
    );
  }
}
