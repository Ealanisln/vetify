/**
 * Meta (Facebook) Pixel Core Utilities
 *
 * This module provides core functionality for initializing and interacting
 * with the Meta Pixel. It handles pixel initialization, page view tracking,
 * and provides utilities for event tracking.
 *
 * @see https://developers.facebook.com/docs/meta-pixel
 */

'use client';

import type { MetaPixelEvent } from './types';
import { logTrackingEvent, isTrackingEnabled } from './privacy';

/**
 * Check if Meta Pixel is loaded and available
 * @returns Whether fbq is available on window
 */
export function isPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/**
 * Get the Meta Pixel ID from environment variables
 * @returns Pixel ID or null if not configured
 */
export function getPixelId(): string | null {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || null;
}

/**
 * Initialize Meta Pixel
 * This function should be called once when the application loads
 *
 * Note: The actual pixel script should be loaded via Script tag in layout.tsx
 * This function only initializes the pixel after the script has loaded
 *
 * @returns Whether initialization was successful
 */
export function initMetaPixel(): boolean {
  // Skip initialization if not in browser or tracking is disabled
  if (typeof window === 'undefined' || !isTrackingEnabled()) {
    return false;
  }

  const pixelId = getPixelId();

  if (!pixelId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Meta Pixel] Pixel ID not configured. Set NEXT_PUBLIC_META_PIXEL_ID environment variable.'
      );
    }
    return false;
  }

  // Check if pixel script is loaded
  if (!isPixelLoaded()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Meta Pixel] Pixel script not loaded yet. Waiting...');
    }
    return false;
  }

  try {
    // Initialize the pixel
    window.fbq?.('init', pixelId);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta Pixel] Initialized with ID: ${pixelId}`);
    }

    return true;
  } catch (error) {
    console.error('[Meta Pixel] Initialization error:', error);
    return false;
  }
}

/**
 * Track a standard Meta Pixel event
 *
 * @param eventName - Standard event name (e.g., 'PageView', 'Purchase')
 * @param params - Optional event parameters
 */
export function trackEvent(
  eventName: MetaPixelEvent,
  params?: Record<string, unknown>
): void {
  if (!isTrackingEnabled()) {
    logTrackingEvent(eventName, params);
    return;
  }

  if (!isPixelLoaded()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Meta Pixel] Cannot track event "${eventName}" - pixel not loaded`
      );
    }
    return;
  }

  try {
    window.fbq?.('track', eventName, params);
    logTrackingEvent(eventName, params);
  } catch (error) {
    console.error(`[Meta Pixel] Error tracking event "${eventName}":`, error);
  }
}

/**
 * Track a custom event (non-standard event)
 *
 * @param eventName - Custom event name
 * @param params - Optional event parameters
 */
export function trackCustomEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isTrackingEnabled()) {
    logTrackingEvent(`Custom: ${eventName}`, params);
    return;
  }

  if (!isPixelLoaded()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Meta Pixel] Cannot track custom event "${eventName}" - pixel not loaded`
      );
    }
    return;
  }

  try {
    window.fbq?.('trackCustom', eventName, params);
    logTrackingEvent(`Custom: ${eventName}`, params);
  } catch (error) {
    console.error(
      `[Meta Pixel] Error tracking custom event "${eventName}":`,
      error
    );
  }
}

/**
 * Track a page view
 * Automatically called by MetaPixelProvider on route changes
 */
export function trackPageView(): void {
  trackEvent('PageView');
}

/**
 * Wait for pixel to load with timeout
 * Useful for ensuring pixel is loaded before tracking critical events
 *
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 3000)
 * @returns Promise that resolves when pixel is loaded or timeout is reached
 */
export function waitForPixelLoad(timeoutMs: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    // If already loaded, resolve immediately
    if (isPixelLoaded()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    const interval = setInterval(() => {
      if (isPixelLoaded()) {
        clearInterval(interval);
        resolve(true);
        return;
      }

      // Timeout reached
      if (Date.now() - startTime >= timeoutMs) {
        clearInterval(interval);
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Meta Pixel] Timeout waiting for pixel to load');
        }
        resolve(false);
      }
    }, checkInterval);
  });
}

/**
 * Get pixel status information
 * Useful for debugging
 *
 * @returns Object with pixel status information
 */
export function getPixelStatus(): {
  isLoaded: boolean;
  pixelId: string | null;
  isTrackingEnabled: boolean;
} {
  return {
    isLoaded: isPixelLoaded(),
    pixelId: getPixelId(),
    isTrackingEnabled: isTrackingEnabled(),
  };
}
