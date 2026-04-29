import { Metadata } from 'next';
import { Suspense } from 'react';
import { getReferralStats } from '@/lib/referrals/queries';
import { ReferralsManager } from '@/components/admin/referrals/ReferralsManager';

export const metadata: Metadata = {
  title: 'Referidos - Admin Dashboard',
  description: 'Gestion del programa de referidos y afiliados',
};

export const dynamic = 'force-dynamic';

async function ReferralsContent() {
  const stats = await getReferralStats();
  return <ReferralsManager stats={stats} />;
}

export default function ReferralsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Programa de Referidos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona partners, codigos de referido y comisiones
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        }
      >
        <ReferralsContent />
      </Suspense>
    </div>
  );
}
