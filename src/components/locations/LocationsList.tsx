'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { LocationStaffModal } from './LocationStaffModal';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

interface Location {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isPrimary: boolean;
  _count: {
    staff: number;
    pets: number;
    appointments: number;
    inventoryItems: number;
  };
}

interface LocationsListProps {
  initialLocations: Location[];
}

export default function LocationsList({
  initialLocations,
}: LocationsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const { canAccess, isLoading: permissionsLoading } = useStaffPermissions();

  // Check if user can manage locations
  const canManageLocations = canAccess('locations', 'write');

  // Filter locations based on search term
  const filteredLocations = useMemo(() => {
    if (!searchTerm) return initialLocations;

    const term = searchTerm.toLowerCase();
    return initialLocations.filter(
      (location) =>
        location.name.toLowerCase().includes(term) ||
        location.address?.toLowerCase().includes(term) ||
        location.phone?.includes(term) ||
        location.email?.toLowerCase().includes(term)
    );
  }, [initialLocations, searchTerm]);

  const handleSetPrimary = async (locationId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas establecer esta ubicación como principal?'
      )
    ) {
      return;
    }

    setIsLoading(locationId);
    try {
      const response = await fetch(
        `/api/locations/${locationId}/set-primary`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar ubicación');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error setting primary location:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Error al actualizar ubicación principal'
      );
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (locationId: string, locationName: string) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la ubicación "${locationName}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setIsLoading(locationId);
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar ubicación');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Error al eliminar ubicación'
      );
    } finally {
      setIsLoading(null);
    }
  };

  if (initialLocations.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          No hay ubicaciones
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comienza creando tu primera ubicación
        </p>
        {canManageLocations && (
          <div className="mt-6">
            <Link
              href="/dashboard/locations/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#75a99c] hover:bg-[#639688]"
            >
              <MapPinIcon className="-ml-1 mr-2 h-5 w-5" />
              Nueva Ubicación
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Read-only alert for users without write permission */}
      {!permissionsLoading && !canManageLocations && (
        <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 rounded-lg">
          <LockClosedIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Modo de solo lectura</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Tu rol actual no tiene permisos para gestionar ubicaciones. Solo puedes ver la información.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar ubicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#75a99c] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Personal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron ubicaciones que coincidan con tu búsqueda
                  </p>
                </td>
              </tr>
            ) : (
              filteredLocations.map((location) => (
                <tr key={location.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {location.name}
                          </div>
                          {location.isPrimary && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#75a99c] text-white">
                              Principal
                            </span>
                          )}
                        </div>
                        {location.address && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {location.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {location.phone || '-'}
                    </div>
                    {location.email && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {location.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {location._count.staff} staff
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {location.isActive ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Activa
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Inactiva
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {canManageLocations && !location.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(location.id)}
                          disabled={isLoading === location.id}
                          className="text-[#75a99c] hover:text-[#639688] disabled:opacity-50"
                          title="Establecer como principal"
                        >
                          <MapPinIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canManageLocations && (
                        <button
                          onClick={() => {
                            setSelectedLocation(location);
                            setShowStaffModal(true);
                          }}
                          className="text-[#75a99c] hover:text-[#639688]"
                          title="Gestionar Personal"
                        >
                          <UserGroupIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canManageLocations && (
                        <Link
                          href={`/dashboard/locations/${location.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                      )}
                      {canManageLocations && !location.isPrimary && (
                        <button
                          onClick={() =>
                            handleDelete(location.id, location.name)
                          }
                          disabled={isLoading === location.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Staff Management Modal */}
      {selectedLocation && (
        <LocationStaffModal
          isOpen={showStaffModal}
          onClose={() => {
            setShowStaffModal(false);
            setSelectedLocation(null);
          }}
          locationId={selectedLocation.id}
          locationName={selectedLocation.name}
          onUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}
