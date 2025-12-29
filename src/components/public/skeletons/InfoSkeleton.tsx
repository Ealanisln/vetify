/**
 * InfoSkeleton - Loading placeholder for ClinicInfo component
 */
export function InfoSkeleton() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-12 animate-pulse">
          <div className="h-8 w-72 bg-gray-300 dark:bg-gray-700 rounded-lg mx-auto mb-4" />
          <div className="h-5 w-96 max-w-full bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Contact info skeleton */}
          <div className="space-y-8 animate-pulse">
            {/* Contact section title */}
            <div>
              <div className="h-6 w-40 bg-gray-300 dark:bg-gray-600 rounded mb-6" />

              {/* Contact cards */}
              <div className="space-y-4">
                {/* Phone card */}
                <ContactCardSkeleton />
                {/* Email card */}
                <ContactCardSkeleton />
                {/* Address card */}
                <ContactCardSkeleton />
              </div>
            </div>

            {/* Business hours section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded mr-2" />
                <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>

              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="space-y-3">
                  <HoursRowSkeleton />
                  <HoursRowSkeleton />
                  <HoursRowSkeleton />
                </div>
              </div>
            </div>
          </div>

          {/* Right side - CTA & testimonials skeleton */}
          <div className="space-y-8 animate-pulse">
            {/* CTA card skeleton */}
            <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg text-center">
              {/* Stars */}
              <div className="flex justify-center mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded" />
                  ))}
                </div>
              </div>
              <div className="h-8 w-64 bg-gray-300 dark:bg-gray-600 rounded-lg mx-auto mb-4" />
              <div className="h-5 w-80 max-w-full bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6" />
              <div className="h-12 w-40 bg-gray-400 dark:bg-gray-600 rounded-lg mx-auto" />
            </div>

            {/* Emergency card skeleton */}
            <div className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-9 w-36 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>

            {/* Testimonials skeleton */}
            <div className="space-y-4">
              <div className="h-5 w-56 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="space-y-3">
                <TestimonialCardSkeleton />
                <TestimonialCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactCardSkeleton() {
  return (
    <div className="flex items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-4" />
      <div className="flex-1">
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-5 w-28 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
    </div>
  );
}

function HoursRowSkeleton() {
  return (
    <div className="flex justify-between items-center">
      <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

function TestimonialCardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Stars */}
      <div className="flex gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
      {/* Quote */}
      <div className="space-y-2 mb-2">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      {/* Author */}
      <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}
