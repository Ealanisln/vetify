/**
 * API Key Utilities for Vetify API v1
 *
 * Provides functions for generating, hashing, and validating API keys.
 * API keys use the format: vfy_{prefix}_{random_string}
 */

import { createHash, randomBytes } from 'crypto';

/**
 * API Key prefix used for all Vetify API keys
 */
export const API_KEY_PREFIX = 'vfy_';

/**
 * Available API scopes for permission control
 */
export const API_SCOPES = {
  // Pet operations
  'read:pets': 'Read pet information',
  'write:pets': 'Create and update pets',

  // Appointment operations
  'read:appointments': 'Read appointment information',
  'write:appointments': 'Create and update appointments',

  // Customer operations
  'read:customers': 'Read customer information',
  'write:customers': 'Create and update customers',

  // Inventory operations
  'read:inventory': 'Read inventory information',
  'write:inventory': 'Create and update inventory items',

  // Location operations
  'read:locations': 'Read location information',

  // Report operations
  'read:reports': 'Access reports and analytics',

  // Sales operations
  'read:sales': 'Read sales information',
  'write:sales': 'Create and update sales',
} as const;

export type ApiScope = keyof typeof API_SCOPES;

/**
 * Predefined scope bundles for common use cases
 */
export const SCOPE_BUNDLES = {
  readonly: [
    'read:pets',
    'read:appointments',
    'read:customers',
    'read:inventory',
    'read:locations',
    'read:reports',
    'read:sales',
  ] as ApiScope[],
  full: Object.keys(API_SCOPES) as ApiScope[],
  appointments_only: ['read:appointments', 'write:appointments'] as ApiScope[],
  inventory_only: ['read:inventory', 'write:inventory'] as ApiScope[],
};

/**
 * Generate a new API key
 *
 * Format: vfy_{8-char-prefix}_{32-char-random}
 * The prefix is stored for display purposes, the full key is only shown once.
 *
 * @returns Object with the full key (to show user once) and components for storage
 */
export function generateApiKey(): {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  // Generate random bytes
  const prefixBytes = randomBytes(4); // 8 hex chars for prefix
  const secretBytes = randomBytes(16); // 32 hex chars for secret

  const prefix = prefixBytes.toString('hex');
  const secret = secretBytes.toString('hex');

  const fullKey = `${API_KEY_PREFIX}${prefix}_${secret}`;
  const keyHash = hashApiKey(fullKey);

  return {
    fullKey,
    keyPrefix: `${API_KEY_PREFIX}${prefix}`,
    keyHash,
  };
}

/**
 * Hash an API key for secure storage
 *
 * Uses SHA-256 for consistent, secure hashing
 *
 * @param key - The full API key to hash
 * @returns The SHA-256 hash of the key
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate that a string is a properly formatted API key
 *
 * @param key - The string to validate
 * @returns true if the key matches the expected format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Expected format: vfy_{8 hex chars}_{32 hex chars}
  const pattern = /^vfy_[a-f0-9]{8}_[a-f0-9]{32}$/;
  return pattern.test(key);
}

/**
 * Extract the prefix from a full API key
 *
 * @param key - The full API key
 * @returns The key prefix (vfy_{8 chars})
 */
export function extractKeyPrefix(key: string): string | null {
  if (!isValidApiKeyFormat(key)) return null;
  // vfy_ + 8 chars = 12 chars
  return key.substring(0, 12);
}

/**
 * Check if an API key has a specific scope
 *
 * @param scopes - Array of scopes the key has
 * @param requiredScope - The scope to check for
 * @returns true if the key has the required scope
 */
export function hasScope(scopes: string[], requiredScope: ApiScope): boolean {
  return scopes.includes(requiredScope);
}

/**
 * Check if an API key has any of the specified scopes
 *
 * @param scopes - Array of scopes the key has
 * @param requiredScopes - Array of scopes to check for (any match returns true)
 * @returns true if the key has at least one of the required scopes
 */
export function hasAnyScope(scopes: string[], requiredScopes: ApiScope[]): boolean {
  return requiredScopes.some((scope) => scopes.includes(scope));
}

/**
 * Check if an API key has all of the specified scopes
 *
 * @param scopes - Array of scopes the key has
 * @param requiredScopes - Array of scopes to check for (all must match)
 * @returns true if the key has all of the required scopes
 */
export function hasAllScopes(scopes: string[], requiredScopes: ApiScope[]): boolean {
  return requiredScopes.every((scope) => scopes.includes(scope));
}

/**
 * Validate that scopes are all valid API scopes
 *
 * @param scopes - Array of scope strings to validate
 * @returns Object with valid scopes and any invalid ones
 */
export function validateScopes(scopes: string[]): {
  valid: ApiScope[];
  invalid: string[];
} {
  const valid: ApiScope[] = [];
  const invalid: string[] = [];

  for (const scope of scopes) {
    if (scope in API_SCOPES) {
      valid.push(scope as ApiScope);
    } else {
      invalid.push(scope);
    }
  }

  return { valid, invalid };
}

/**
 * Get human-readable description for a scope
 *
 * @param scope - The scope to describe
 * @returns Description string or undefined if invalid scope
 */
export function getScopeDescription(scope: string): string | undefined {
  return API_SCOPES[scope as ApiScope];
}

/**
 * Parse scopes from a comma-separated string
 *
 * @param scopeString - Comma-separated scope string
 * @returns Array of scope strings
 */
export function parseScopeString(scopeString: string): string[] {
  return scopeString
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Format scopes to a comma-separated string
 *
 * @param scopes - Array of scopes
 * @returns Comma-separated scope string
 */
export function formatScopes(scopes: string[]): string {
  return scopes.join(', ');
}
