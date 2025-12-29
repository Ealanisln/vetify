/**
 * ServicesSkeleton - Loading placeholder for ClinicServices component
 */
export function ServicesSkeleton() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-12 animate-pulse">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded-lg mx-auto mb-4" />
          <div className="h-5 w-96 max-w-full bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
        </div>

        {/* Services grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>

        {/* CTA button skeleton */}
        <div className="text-center mt-12 animate-pulse">
          <div className="h-12 w-48 bg-gray-300 dark:bg-gray-600 rounded-lg mx-auto" />
        </div>
      </div>
    </section>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="animate-pulse p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Icon */}
      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />

      {/* Title */}
      <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-3" />

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Price */}
      <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
    </div>
  );
}
