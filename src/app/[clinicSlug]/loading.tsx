import { ClinicPageSkeleton } from '@/components/public/skeletons';

/**
 * Loading state for individual clinic landing pages
 * Automatically shown by Next.js while the page is loading
 */
export default function ClinicPageLoading() {
  return <ClinicPageSkeleton />;
}
