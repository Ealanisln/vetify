import { requireAuth } from '../../../lib/auth';
import { getPetsByTenant } from '../../../lib/pets';
import { PetsList } from '@/components/pets/PetsList';
import Link from 'next/link';

export default async function PetsPage() {
  const { tenant } = await requireAuth();
  const pets = await getPetsByTenant(tenant.id);
  
  const maxPets = tenant.tenantSubscription?.plan?.maxPets || 50;
  const canAddPet = pets.length < maxPets;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Mascotas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona todas las mascotas registradas en tu clínica
          </p>
        </div>
        
        {canAddPet ? (
          <Link
            href="/dashboard/pets/new"
            className="btn-primary flex items-center gap-2"
          >
            ➕ Agregar Mascota
          </Link>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Límite alcanzado - <Link href="/dashboard/settings/billing" className="text-vetify-green-600 hover:text-vetify-green-700 dark:text-vetify-green-400 dark:hover:text-vetify-green-300">Mejorar Plan</Link>
          </div>
        )}
      </div>

      {!canAddPet && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-300">
            Has alcanzado el límite de {maxPets} mascotas de tu plan actual.
          </p>
        </div>
      )}

      {/* Pets list with search functionality */}
      {pets.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl">🐕</span>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No hay mascotas registradas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza agregando tu primera mascota.
          </p>
          {canAddPet && (
            <Link
              href="/dashboard/pets/new"
              className="mt-4 btn-primary inline-flex items-center"
            >
              Agregar Primera Mascota
            </Link>
          )}
        </div>
      ) : (
        <PetsList pets={pets} maxPets={maxPets} />
      )}
    </div>
  );
} 