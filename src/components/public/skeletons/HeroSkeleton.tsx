/**
 * HeroSkeleton - Loading placeholder for ClinicHero component
 */
export function HeroSkeleton() {
  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Clinic info skeleton */}
          <div className="animate-pulse">
            {/* Rating stars */}
            <div className="flex items-center mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded" />
                ))}
              </div>
              <div className="ml-2 h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>

            {/* Title */}
            <div className="h-12 lg:h-16 w-3/4 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6" />

            {/* Description */}
            <div className="space-y-3 mb-8">
              <div className="h-5 w-full bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="h-5 w-5/6 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="h-5 w-4/6 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>

            {/* Contact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Phone card */}
              <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>

              {/* Address card */}
              <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>

              {/* Hours card */}
              <div className="flex items-center p-4 sm:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-40 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-12 w-full sm:w-40 bg-gray-400 dark:bg-gray-600 rounded-lg" />
              <div className="h-12 w-full sm:w-40 bg-gray-300 dark:bg-gray-700 rounded-lg border-2 border-gray-400 dark:border-gray-600" />
            </div>
          </div>

          {/* Right side - Image skeleton */}
          <div className="animate-pulse">
            <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
