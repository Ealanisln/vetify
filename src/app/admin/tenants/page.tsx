import { getAllTenants } from '../../../lib/admin';
import { TenantsTable } from '../../../components/admin/TenantsTable';
import { TenantFilters } from '../../../components/admin/TenantFilters';
import { TenantStats } from '../../../components/admin/TenantStats';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Gestión de Clínicas - Admin Vetify',
  description: 'Administra todas las clínicas registradas en Vetify',
};

interface TenantsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function TenantsAdminPage({ searchParams }: TenantsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1');
  const status = resolvedSearchParams.status as 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PENDING_SETUP' | undefined;
  const search = resolvedSearchParams.search;

  const tenantsData = await getAllTenants(page, 20, status, search);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Clínicas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra y supervisa todas las clínicas veterinarias
          </p>
        </div>
      </div>

      {/* Statistics */}
      <Suspense fallback={<div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />}>
        <TenantStats />
      </Suspense>

      {/* Filters */}
      <TenantFilters />

      {/* Tenants Table */}
      <TenantsTable 
        tenants={tenantsData.tenants} 
        pagination={{
          currentPage: tenantsData.currentPage,
          totalPages: tenantsData.pages,
          total: tenantsData.total
        }}
      />
    </div>
  );
} 