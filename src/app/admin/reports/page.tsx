import { Metadata } from 'next';
import { Suspense } from 'react';
import { ReportsOverview } from '@/components/admin/reports/ReportsOverview';
import { SystemAnalytics } from '@/components/admin/reports/SystemAnalytics';
import { ClinicAnalytics } from '@/components/admin/reports/ClinicAnalytics';

export const metadata: Metadata = {
  title: 'Reportes - Admin Dashboard',
  description: 'Reportes y análisis del sistema',
};

export default function ReportsAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reportes y Análisis
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualiza métricas y análisis del sistema
        </p>
      </div>

      {/* Reports Overview */}
      <Suspense fallback={
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      }>
        <ReportsOverview />
      </Suspense>

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Análisis del Sistema
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <SystemAnalytics />
          </Suspense>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Análisis de Clínicas
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <ClinicAnalytics />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 