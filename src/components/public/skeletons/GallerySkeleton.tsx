/**
 * GallerySkeleton - Loading placeholder for ClinicGallery component
 */
export function GallerySkeleton() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-12 animate-pulse">
          <div className="h-10 w-56 bg-gray-300 dark:bg-gray-700 rounded-lg mx-auto mb-4" />
          <div className="h-5 w-96 max-w-full bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
        </div>

        {/* Category filters skeleton */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 animate-pulse">
          <div className="h-10 w-24 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-10 w-30 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Gallery grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <GalleryImageSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryImageSkeleton() {
  return (
    <div className="animate-pulse relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Image placeholder with 4:3 aspect ratio */}
      <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />

      {/* Category badge skeleton */}
      <div className="absolute top-2 left-2 h-6 w-16 bg-white/90 dark:bg-gray-800/90 rounded-full" />
    </div>
  );
}
