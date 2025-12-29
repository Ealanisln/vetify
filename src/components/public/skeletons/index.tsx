/**
 * Public page skeleton loaders
 *
 * These components provide loading placeholders while the actual
 * content is being fetched, improving perceived performance.
 */

export { HeroSkeleton } from './HeroSkeleton';
export { ServicesSkeleton } from './ServicesSkeleton';
export { InfoSkeleton } from './InfoSkeleton';
export { GallerySkeleton } from './GallerySkeleton';

// Full page skeleton combining all sections
import { HeroSkeleton } from './HeroSkeleton';
import { ServicesSkeleton } from './ServicesSkeleton';
import { InfoSkeleton } from './InfoSkeleton';
import { GallerySkeleton } from './GallerySkeleton';

/**
 * ClinicPageSkeleton - Full page loading placeholder
 * Use this for the main clinic landing page while data is loading
 */
export function ClinicPageSkeleton() {
  return (
    <div className="min-h-screen">
      <HeroSkeleton />
      <ServicesSkeleton />
      <GallerySkeleton />
      <InfoSkeleton />
    </div>
  );
}

/**
 * GalleryPageSkeleton - Loading placeholder for dedicated gallery page
 */
export function GalleryPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <GallerySkeleton />
    </div>
  );
}
