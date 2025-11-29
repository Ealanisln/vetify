import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import LocationReportsClient from '@/components/reports/LocationReportsClient';
import { Card, CardContent } from '@/components/ui/card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

function LocationReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
        </div>
        <div className="h-10 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function LocationReportsPage() {
  // Verify authentication
  await requireAuth();

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<LocationReportsLoading />}>
        <LocationReportsClient />
      </Suspense>
    </div>
  );
}

// Metadata for the page
export const metadata = {
  title: 'Reportes por Ubicación | Vetify',
  description: 'Métricas y análisis de rendimiento por sucursal',
};
