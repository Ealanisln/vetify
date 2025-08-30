import { Suspense } from 'react';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import SalesPageClient from './SalesPageClient';

export default async function SalesPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    redirect('/sign-in');
  }

  const userWithTenant = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      tenant: {
        include: {
          tenantSubscription: {
            include: { plan: true }
          }
        }
      }
    }
  });

  if (!userWithTenant?.tenant) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Punto de Venta
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Procesa ventas de productos y servicios de manera rápida y sencilla
        </p>
      </div>

      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
          </div>
        }
      >
        <SalesPageClient 
          tenantId={userWithTenant.tenant.id}
          userId={user.id}
        />
      </Suspense>
    </div>
  );
} 