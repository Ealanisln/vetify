import Link from 'next/link';
import { PetWithOwner } from '@/types';
import { mapSpeciesToSpanish } from '@/lib/utils/pet-enum-mapping';

interface RecentPetsCardProps {
  pets: PetWithOwner[];
}

export function RecentPetsCard({ pets }: RecentPetsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Mascotas Recientes
          </h3>
          <Link
            href="/dashboard/pets"
            className="text-sm font-medium text-[#5b9788] hover:text-[#75a99c] dark:text-[#75a99c] dark:hover:text-[#8cbcb0]"
          >
            Ver todas
          </Link>
        </div>
        <div className="mt-6 flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
            {pets.length === 0 ? (
              <li className="py-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-2 block">🐕</span>
                  {/* Text only: the dashboard's FirstRunCard owns the first-pet CTA. */}
                  <p>No hay mascotas registradas aún</p>
                </div>
              </li>
            ) : (
              pets.map((pet) => (
                <li key={pet.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold">
                        {pet.name[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {pet.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {mapSpeciesToSpanish(pet.species)} • {pet.breed}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Dueño: {pet.customer.firstName || pet.customer.name}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/dashboard/pets/${pet.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 