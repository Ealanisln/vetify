'use client';

import { useState, useEffect, useCallback } from 'react';
import { PetsList } from '@/components/pets/PetsList';
import Link from 'next/link';
import { useLocation } from '@/components/providers/LocationProvider';
import { PetWithOwner } from '@/types';

interface PetsPageClientProps {
  maxPets: number;
}

export function PetsPageClient({ maxPets }: PetsPageClientProps) {
  const [pets, setPets] = useState<PetWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentLocation, isAllLocations } = useLocation();

  const fetchPets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (!isAllLocations && currentLocation?.id) {
        params.set('locationId', currentLocation.id);
      }

      const url = `/api/pets${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar mascotas');
      }

      const data = await response.json();
      setPets(data);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation?.id, isAllLocations]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const canAddPet = pets.length < maxPets;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Mascotas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestiona todas las mascotas registradas en tu clínica
            </p>
          </div>
          <Link href="/dashboard/pets/new" className="btn-primary flex items-center gap-2">
            + Agregar Mascota
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Mascotas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestiona todas las mascotas registradas en tu clínica
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchPets}
            className="mt-4 btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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
            data-testid="add-pet-button"
          >
            + Agregar Mascota
          </Link>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400" data-testid="pets-limit-reached">
            Límite alcanzado -{' '}
            <Link
              href="/dashboard/settings/billing"
              className="text-vetify-green-600 hover:text-vetify-green-700 dark:text-vetify-green-400 dark:hover:text-vetify-green-300"
            >
              Mejorar Plan
            </Link>
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
        <div className="text-center py-12" data-testid="empty-pets-state">
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
              data-testid="add-first-pet-button"
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
