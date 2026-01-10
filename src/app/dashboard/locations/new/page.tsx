import { requireAuthWithStaff } from '@/lib/auth';
import { canAccess } from '@/lib/staff-permissions';
import LocationForm from '@/components/locations/LocationForm';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { redirect } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function NewLocationPage() {
  const { tenant, staff } = await requireAuthWithStaff();

  // Check if user has permission to create locations
  // If no staff record, user is tenant owner (has admin access)
  const hasPermission = !staff || canAccess(staff.position, 'locations', 'write');

  if (!hasPermission) {
    redirect('/dashboard/locations');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/dashboard/locations"
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-1" />
        Volver a Ubicaciones
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Nueva Ubicación
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Crea una nueva ubicación para tu clínica veterinaria
        </p>
      </div>

      {/* Form */}
      <LocationForm mode="create" tenantId={tenant.id} />
    </div>
  );
}
