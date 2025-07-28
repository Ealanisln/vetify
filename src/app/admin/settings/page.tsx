import { Metadata } from 'next';
import { Suspense } from 'react';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings';
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings';

export const metadata: Metadata = {
  title: 'Configuración - Admin Dashboard',
  description: 'Configuración del sistema administrativo',
};

export default function SettingsAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuración del Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra la configuración general del sistema
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración General
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <GeneralSettings />
          </Suspense>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración de Seguridad
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <SecuritySettings />
          </Suspense>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración de Notificaciones
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <NotificationSettings />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 