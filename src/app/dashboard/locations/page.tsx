import { requireAuth } from '@/lib/auth';
import {
  getLocationsByTenant,
  getLocationStats,
} from '@/lib/locations';
import LocationsList from '@/components/locations/LocationsList';
import LocationStats from '@/components/locations/LocationStats';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const { tenant } = await requireAuth();

  // Fetch locations and stats
  const [locations, stats] = await Promise.all([
    getLocationsByTenant(tenant.id, { isActive: true }),
    getLocationStats(tenant.id),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ubicaciones
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Administra las ubicaciones de tu clínica veterinaria
            </p>
          </div>
          <Link
            href="/dashboard/locations/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#75a99c] text-white rounded-lg hover:bg-[#639688] transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nueva Ubicación</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <LocationStats stats={stats} />

      {/* Locations List */}
      <div className="mt-8">
        <LocationsList initialLocations={locations} />
      </div>
    </div>
  );
}
