import { requireAuth } from '@/lib/auth';
import { getPetsByTenant } from '@/lib/pets';
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
          <h1 className="text-2xl font-semibold text-gray-900">Mascotas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pets.length} de {maxPets} mascotas registradas
          </p>
        </div>
        
        {canAddPet ? (
          <Link
            href="/dashboard/pets/new"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            ➕ Agregar Mascota
          </Link>
        ) : (
          <div className="text-sm text-gray-500">
            Límite alcanzado - <Link href="/dashboard/settings/billing" className="text-green-600 hover:text-green-700">Mejorar Plan</Link>
          </div>
        )}
      </div>

      {!canAddPet && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Has alcanzado el límite de {maxPets} mascotas de tu plan actual.
          </p>
        </div>
      )}

      {pets.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl">🐕</span>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay mascotas registradas
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza agregando tu primera mascota.
          </p>
          {canAddPet && (
            <Link
              href="/dashboard/pets/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Agregar Primera Mascota
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pets.map((pet) => (
              <li key={pet.id}>
                <Link href={`/dashboard/pets/${pet.id}`} className="block hover:bg-gray-50 transition-colors">
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {pet.species === 'dog' ? '🐕' : 
                         pet.species === 'cat' ? '🐱' : 
                         pet.species === 'bird' ? '🐦' : 
                         pet.species === 'rabbit' ? '🐰' : '🐾'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pet.name}</p>
                        <p className="text-sm text-gray-500">
                          {pet.breed} • {pet.gender === 'male' ? 'Macho' : 'Hembra'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Dueño: {pet.user.name || pet.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {pet.appointments.length} citas
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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