'use client';

import { useState, useMemo } from 'react';
import { PetWithOwner } from '@/types';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface PetsListProps {
  pets: PetWithOwner[];
  maxPets: number;
}

/**
 * Client component that displays a searchable list of pets
 * Implements real-time filtering by pet name, breed, and owner name
 */
export function PetsList({ pets, maxPets }: PetsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter pets based on search query
  // Searches across pet name, breed, and owner information
  const filteredPets = useMemo(() => {
    if (!searchQuery.trim()) {
      return pets;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return pets.filter((pet) => {
      const petName = pet.name.toLowerCase();
      const breed = pet.breed?.toLowerCase() || '';
      const ownerName = pet.customer?.name?.toLowerCase() || '';
      const ownerEmail = pet.customer?.email?.toLowerCase() || '';

      return (
        petName.includes(query) ||
        breed.includes(query) ||
        ownerName.includes(query) ||
        ownerEmail.includes(query)
      );
    });
  }, [pets, searchQuery]);

  // Show empty state when there are no pets at all
  if (pets.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">🐕</span>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No hay mascotas registradas
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comienza agregando tu primera mascota.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, raza o dueño..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-vetify-green-500 focus:border-transparent
                     transition-colors duration-200"
          aria-label="Buscar mascotas"
        />
      </div>

      {/* Results counter */}
      <div className="flex justify-between items-center text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          {searchQuery ? (
            <>
              Mostrando <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredPets.length}</span> de{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{pets.length}</span> mascotas
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{pets.length}</span> de{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{maxPets}</span> mascotas registradas
            </>
          )}
        </p>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-vetify-green-600 hover:text-vetify-green-700 dark:text-vetify-green-400 
                       dark:hover:text-vetify-green-300 font-medium transition-colors"
            aria-label="Limpiar búsqueda"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Empty search results */}
      {filteredPets.length === 0 && searchQuery && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-6xl">🔍</span>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No se encontraron resultados
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Intenta con otro término de búsqueda
          </p>
        </div>
      )}

      {/* Pets list */}
      {filteredPets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700" role="list">
            {filteredPets.map((pet: PetWithOwner) => (
              <li key={pet.id}>
                <Link 
                  href={`/dashboard/pets/${pet.id}`} 
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-vetify-green-500"
                  aria-label={`Ver detalles de ${pet.name}`}
                >
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="text-2xl mr-3 flex-shrink-0" aria-hidden="true">
                        {pet.species === 'dog' ? '🐕' : 
                         pet.species === 'cat' ? '🐱' : 
                         pet.species === 'bird' ? '🐦' : 
                         pet.species === 'rabbit' ? '🐰' : '🐾'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {pet.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {pet.breed} • {pet.gender === 'male' ? 'Macho' : 'Hembra'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          Dueño: {pet.customer?.name || pet.customer?.email || 'Sin datos'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="flex space-x-1">
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                     bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          aria-label={`${pet.appointments.length} citas`}
                        >
                          {pet.appointments.length} citas
                        </span>
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                     bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          aria-label={`${pet.medicalHistories.length} consultas`}
                        >
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

