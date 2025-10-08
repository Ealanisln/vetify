import { Metadata } from 'next';
import { Suspense } from 'react';
import { SystemOverview } from '../../../components/admin/system/SystemOverview';
import { SystemSettings } from '../../../components/admin/system/SystemSettings';
import { DatabaseStats } from '../../../components/admin/system/DatabaseStats';

export const metadata: Metadata = {
  title: 'Sistema - Admin Dashboard',
  description: 'Gestión del sistema y configuración',
};

export default function SystemAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión del Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitoreo y configuración del sistema
        </p>
      </div>

      {/* System Overview */}
      <Suspense fallback={
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      }>
        <SystemOverview />
      </Suspense>

      {/* System Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración del Sistema
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <SystemSettings />
          </Suspense>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estadísticas de Base de Datos
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <DatabaseStats />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 