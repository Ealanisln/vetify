/**
 * localStorage utility with TTL (time-to-live) support
 * Items automatically expire after the specified duration
 */

import { STORAGE_TTL_DEFAULT } from '../constants';

interface StorageItem<T> {
  value: T;
  expiry: number;
}

/**
 * Set a value in localStorage with an expiration time
 * @param key - Storage key
 * @param value - Value to store (will be JSON serialized)
 * @param ttlMs - Time to live in milliseconds (default: 7 days)
 */
export function setWithExpiry<T>(
  key: string,
  value: T,
  ttlMs: number = STORAGE_TTL_DEFAULT
): void {
  if (typeof window === 'undefined') return;

  const item: StorageItem<T> = {
    value,
    expiry: Date.now() + ttlMs,
  };

  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    // Handle quota exceeded or other storage errors
    console.warn(`Failed to set localStorage item "${key}":`, error);
  }
}

/**
 * Get a value from localStorage, returning null if expired or not found
 * @param key - Storage key
 * @returns The stored value or null if expired/not found
 */
export function getWithExpiry<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item: StorageItem<T> = JSON.parse(itemStr);

    // Check if the item has expired
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    // Handle parse errors for malformed data
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return null;
  }
}

/**
 * Remove a specific item from localStorage
 * @param key - Storage key to remove
 */
export function removeItem(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
  }
}

/**
 * Clear all expired items from localStorage
 * Call this periodically to clean up stale data
 */
export function clearExpired(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) continue;

        const item = JSON.parse(itemStr);
        // Check if this looks like an expiring storage item
        if (item && typeof item.expiry === 'number' && Date.now() > item.expiry) {
          keysToRemove.push(key);
        }
      } catch {
        // Skip items that aren't JSON or don't have expiry
        continue;
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear expired localStorage items:', error);
  }
}

/**
 * Check if a key exists and is not expired
 * @param key - Storage key to check
 * @returns true if the key exists and is not expired
 */
export function hasValidItem(key: string): boolean {
  return getWithExpiry(key) !== null;
}

/**
 * Get the remaining TTL for an item in milliseconds
 * @param key - Storage key
 * @returns Remaining TTL in ms, or null if not found/expired
 */
export function getRemainingTTL(key: string): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item: StorageItem<unknown> = JSON.parse(itemStr);
    const remaining = item.expiry - Date.now();

    if (remaining <= 0) {
      localStorage.removeItem(key);
      return null;
    }

    return remaining;
  } catch {
    return null;
  }
}

/**
 * Extend the TTL of an existing item
 * @param key - Storage key
 * @param additionalTtlMs - Additional time to add in milliseconds
 * @returns true if the item was found and extended
 */
export function extendTTL(key: string, additionalTtlMs: number): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return false;

    const item: StorageItem<unknown> = JSON.parse(itemStr);

    // Only extend if not already expired
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return false;
    }

    item.expiry += additionalTtlMs;
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// STORAGE KEY GENERATORS
// =============================================================================

/**
 * Generate a storage key for notification dismissals
 * @param tenantId - Tenant ID
 * @param notificationType - Type of notification
 */
export function getNotificationDismissalKey(
  tenantId: string,
  notificationType: string
): string {
  return `notification-dismissed-${notificationType}-${tenantId}`;
}

/**
 * Generate a storage key for welcome banner shown state
 * @param tenantId - Tenant ID
 */
export function getWelcomeBannerKey(tenantId: string): string {
  return `welcome-banner-shown-${tenantId}`;
}

/**
 * Generate a storage key for current location selection
 * @param tenantId - Tenant ID
 */
export function getLocationSelectionKey(tenantId: string): string {
  return `current-location-${tenantId}`;
}
