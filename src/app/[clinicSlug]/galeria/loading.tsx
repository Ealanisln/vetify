import { GalleryPageSkeleton } from '@/components/public/skeletons';

/**
 * Loading state for clinic gallery page
 * Automatically shown by Next.js while the page is loading
 */
export default function GalleryPageLoading() {
  return <GalleryPageSkeleton />;
}
