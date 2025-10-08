import { Metadata } from 'next';
import { Suspense } from 'react';
import { SubscriptionsList } from '../../../../components/admin/billing/SubscriptionsList';

export const metadata: Metadata = {
  title: 'Suscripciones - Admin Dashboard',
  description: 'Gestión de todas las suscripciones del sistema',
};

export default function SubscriptionsAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Suscripciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra todas las suscripciones del sistema
          </p>
        </div>
      </div>

      {/* Subscriptions List */}
      <Suspense fallback={
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      }>
        <SubscriptionsList />
      </Suspense>
    </div>
  );
} 