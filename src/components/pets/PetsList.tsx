'use client';

import { useState, useMemo } from 'react';
import { PetWithOwner } from '@/types';
import Link from 'next/link';
import { MagnifyingGlassIcon, MapPinIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { SortOrder } from '../ui/ResponsiveTable';

interface PetsListProps {
  pets: PetWithOwner[];
  maxPets: number;
  totalPets?: number; // Total from pagination for accurate count
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortBy: string, sortOrder: SortOrder) => void;
  isLoading?: boolean;
}

// Sortable columns for pets
const SORT_OPTIONS = [
  { key: 'createdAt', label: 'Fecha registro' },
  { key: 'name', label: 'Nombre' },
  { key: 'species', label: 'Especie' },
] as const;

/**
 * Client component that displays a searchable list of pets
 * Implements real-time filtering by pet name, breed, and owner name
 */
export function PetsList({
  pets,
  maxPets,
  totalPets,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSort,
  isLoading = false,
}: PetsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Use provided total or fallback to pets array length
  const actualTotalPets = totalPets ?? pets.length;

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

  const handleSortChange = (newSortBy: string) => {
    if (!onSort) return;

    const newOrder: SortOrder =
      sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';

    onSort(newSortBy, newOrder);
  };

  // Show empty state when there are no pets at all
  if (pets.length === 0 && actualTotalPets === 0) {
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
    <div className="space-y-4 relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
        </div>
      )}

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Buscar en esta página..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                       leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-vetify-green-500 focus:border-transparent
                       transition-colors duration-200"
            aria-label="Buscar mascotas"
            data-testid="pets-search-input"
          />
        </div>

        {/* Sort controls */}
        {onSort && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Ordenar por:
            </span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSortChange(option.key)}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === option.key
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {option.label}
                  {sortBy === option.key && (
                    sortOrder === 'asc'
                      ? <ChevronUpIcon className="w-4 h-4 ml-1 text-[#75a99c]" />
                      : <ChevronDownIcon className="w-4 h-4 ml-1 text-[#75a99c]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results counter */}
      <div className="flex justify-between items-center text-sm">
        <p className="text-gray-500 dark:text-gray-400" data-testid="pets-limit-indicator">
          {searchQuery ? (
            <>
              Mostrando <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredPets.length}</span> de{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{pets.length}</span> en esta página
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{actualTotalPets}</span> de{' '}
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
            data-testid="clear-search"
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
              <li key={pet.id} data-testid="pet-card">
                <Link
                  href={`/dashboard/pets/${pet.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-vetify-green-500"
                  aria-label={`Ver detalles de ${pet.name}`}
                >
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="text-2xl mr-3 flex-shrink-0" aria-hidden="true" data-testid="pet-species">
                        {pet.species === 'dog' ? '🐕' :
                         pet.species === 'cat' ? '🐱' :
                         pet.species === 'bird' ? '🐦' :
                         pet.species === 'rabbit' ? '🐰' : '🐾'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" data-testid="pet-name">
                          {pet.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {pet.breed} • {pet.gender === 'male' ? 'Macho' : 'Hembra'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span className="truncate">
                            Dueño: {pet.customer?.name || pet.customer?.email || 'Sin datos'}
                          </span>
                          {'location' in pet && pet.location && (
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <MapPinIcon className="h-3 w-3" />
                              {pet.location.name}
                            </span>
                          )}
                        </div>
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
