import { Metadata } from 'next';
import { Suspense } from 'react';
import { BillingOverview } from '../../../components/admin/billing/BillingOverview';
import { SubscriptionsList } from '../../../components/admin/billing/SubscriptionsList';
import { PaymentHistory } from '../../../components/admin/billing/PaymentHistory';

export const metadata: Metadata = {
  title: 'Facturación - Admin Dashboard',
  description: 'Gestión de facturación y suscripciones',
};

export default function BillingAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Facturación
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra suscripciones, pagos y facturación del sistema
        </p>
      </div>

      {/* Billing Overview */}
      <Suspense fallback={
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      }>
        <BillingOverview />
      </Suspense>

      {/* Subscriptions and Payments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Suscripciones Recientes
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <SubscriptionsList limit={5} />
          </Suspense>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pagos Recientes
          </h2>
          <Suspense fallback={
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          }>
            <PaymentHistory limit={5} />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 