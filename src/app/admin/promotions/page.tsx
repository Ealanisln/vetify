import { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllPromotions, getPromotionStats } from '@/lib/promotions/queries';
import { PromotionsManager } from '@/components/admin/promotions/PromotionsManager';

export const metadata: Metadata = {
  title: 'Promociones - Admin Dashboard',
  description: 'Gestión de promociones y descuentos del sistema',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function PromotionsContent() {
  const [promotions, stats] = await Promise.all([
    getAllPromotions(),
    getPromotionStats(),
  ]);

  return <PromotionsManager initialPromotions={promotions} stats={stats} />;
}

export default function PromotionsAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Promociones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra promociones, descuentos y ofertas especiales
        </p>
      </div>

      {/* Promotions Manager */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        }
      >
        <PromotionsContent />
      </Suspense>
    </div>
  );
}
