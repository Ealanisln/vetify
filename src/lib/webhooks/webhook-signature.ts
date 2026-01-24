/**
 * Webhook Signature Utilities
 *
 * Provides HMAC-SHA256 signature generation and verification for webhook payloads.
 * Follows industry standards similar to Stripe's webhook signature scheme.
 */

import crypto from 'crypto';

/**
 * Prefix for webhook secrets
 */
const SECRET_PREFIX = 'whsec_';

/**
 * Generates a new webhook secret with the whsec_ prefix
 * Format: whsec_{48 hex characters}
 */
export function generateWebhookSecret(): string {
  const randomBytes = crypto.randomBytes(24);
  return `${SECRET_PREFIX}${randomBytes.toString('hex')}`;
}

/**
 * Creates an HMAC-SHA256 signature for a webhook payload
 *
 * @param payload - The stringified JSON payload
 * @param secret - The webhook secret (with or without whsec_ prefix)
 * @param timestamp - Unix timestamp for replay protection
 * @returns Signature in format: sha256={hex}
 */
export function signPayload(payload: string, secret: string, timestamp: number): string {
  // Remove prefix if present for signing
  const signingSecret = secret.startsWith(SECRET_PREFIX)
    ? secret.slice(SECRET_PREFIX.length)
    : secret;

  // Create the signed payload string (timestamp + payload for replay protection)
  const signedPayloadString = `${timestamp}.${payload}`;

  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(signedPayloadString, 'utf8');
  const signature = hmac.digest('hex');

  return `sha256=${signature}`;
}

/**
 * Verifies a webhook signature
 *
 * @param payload - The raw stringified JSON payload
 * @param signature - The signature from the X-Vetify-Signature header
 * @param secret - The webhook secret
 * @param timestamp - The timestamp from X-Vetify-Timestamp header
 * @param toleranceSeconds - Maximum age of the payload in seconds (default: 5 minutes)
 * @returns True if signature is valid and timestamp is within tolerance
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  toleranceSeconds: number = 300
): boolean {
  // Check timestamp tolerance to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false;
  }

  // Generate expected signature
  const expectedSignature = signPayload(payload, secret, timestamp);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch {
    // If buffers have different lengths, timingSafeEqual throws
    return false;
  }
}

/**
 * Extracts the raw signature hash from a full signature string
 * Input: "sha256=abc123..."
 * Output: "abc123..."
 */
export function extractSignatureHash(signature: string): string | null {
  if (!signature.startsWith('sha256=')) {
    return null;
  }
  return signature.slice(7);
}

/**
 * Validates that a secret has the correct format
 */
export function isValidWebhookSecret(secret: string): boolean {
  if (!secret.startsWith(SECRET_PREFIX)) {
    return false;
  }
  const hexPart = secret.slice(SECRET_PREFIX.length);
  // Should be 48 hex characters (24 bytes)
  return /^[a-f0-9]{48}$/i.test(hexPart);
}
