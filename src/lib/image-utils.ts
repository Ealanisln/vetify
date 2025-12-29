/**
 * Image optimization utilities for Next.js Image component
 */

/**
 * Lightweight SVG blur placeholder with shimmer effect
 * Used as blurDataURL for Next.js Image placeholder="blur"
 */
export const PLACEHOLDER_BLUR_SVG = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#f3f4f6"/>
        <stop offset="50%" style="stop-color:#e5e7eb"/>
        <stop offset="100%" style="stop-color:#f3f4f6"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#shimmer)"/>
  </svg>`
).toString('base64')}`;

/**
 * Simple gray blur placeholder (smaller payload)
 * Minimal base64 encoded 1x1 gray pixel
 */
export const PLACEHOLDER_BLUR_GRAY =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=';

/**
 * Get responsive sizes string for common image layouts
 */
export const imageSizes = {
  /** Hero image - full width on mobile, fixed on desktop */
  hero: '(max-width: 768px) 100vw, 600px',
  /** Gallery grid - 2 cols mobile, 3 cols tablet, 4 cols desktop */
  gallery: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw',
  /** Card image - responsive based on card width */
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  /** Thumbnail - small fixed size */
  thumbnail: '100px',
} as const;

/**
 * Default blur placeholder to use across the app
 * Using gray for smaller payload
 */
export const PLACEHOLDER_BLUR = PLACEHOLDER_BLUR_GRAY;
