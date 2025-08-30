import { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentHistory } from '../../../../components/admin/billing/PaymentHistory';

export const metadata: Metadata = {
  title: 'Historial de Pagos - Admin Dashboard',
  description: 'Historial completo de pagos del sistema',
};

export default function PaymentsAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Historial de Pagos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualiza todos los pagos procesados en el sistema
        </p>
      </div>

      {/* Payment History */}
      <Suspense fallback={
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      }>
        <PaymentHistory />
      </Suspense>
    </div>
  );
} 