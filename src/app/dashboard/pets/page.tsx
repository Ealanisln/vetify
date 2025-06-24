import { requireAuth } from '@/lib/auth';
import { getPetsByTenant } from '@/lib/pets';
import { PetWithOwner } from '@/types';
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
            {pets.length} de {maxPets} mascotas registradas
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
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {pets.map((pet: PetWithOwner) => (
              <li key={pet.id}>
                <Link href={`/dashboard/pets/${pet.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {pet.species === 'dog' ? '🐕' : 
                         pet.species === 'cat' ? '🐱' : 
                         pet.species === 'bird' ? '🐦' : 
                         pet.species === 'rabbit' ? '🐰' : '🐾'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{pet.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pet.breed} • {pet.gender === 'male' ? 'Macho' : 'Hembra'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Dueño: {pet.customer?.name || pet.customer?.email || 'Sin datos'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {pet.appointments.length} citas
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          {pet.medicalHistories.length} consultas
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 