'use client';

import { MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface LocationStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    primary: {
      id: string;
      name: string;
    } | null;
  };
}

export default function LocationStats({ stats }: LocationStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Locations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Ubicaciones
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <MapPinIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Active Locations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Ubicaciones Activas
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.active}
            </p>
            {stats.inactive > 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {stats.inactive} inactiva{stats.inactive > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Primary Location */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Ubicación Principal
            </p>
            {stats.primary ? (
              <>
                <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  {stats.primary.name}
                </p>
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#75a99c] text-white">
                  Principal
                </span>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No hay ubicación principal
              </p>
            )}
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
            <MapPinIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
