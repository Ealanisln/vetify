import { Metadata } from 'next';
import { Suspense } from 'react';
import { PlanManager } from '@/components/admin/billing/PlanManager';

export const metadata: Metadata = {
  title: 'Gestión de Planes - Admin Dashboard',
  description: 'Administra los planes de precios del sistema',
};

export default function PlansAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Planes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra los planes de precios y características
        </p>
      </div>

      {/* Plan Manager */}
      <Suspense fallback={
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      }>
        <PlanManager />
      </Suspense>
    </div>
  );
} 