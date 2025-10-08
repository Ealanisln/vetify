import { getAdminStats } from '../../lib/admin';
import { AdminStatsGrid } from '../../components/admin/AdminStatsGrid';
import { RecentTenantsTable } from '../../components/admin/RecentTenantsTable';
import { RevenueChart } from '../../components/admin/RevenueChart';
import { SystemHealth } from '../../components/admin/SystemHealth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Vetify',
  description: 'Panel de control administrativo de Vetify',
};

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vista general del sistema Vetify
        </p>
      </div>

      {/* Stats Grid */}
      <AdminStatsGrid stats={stats} />

      {/* Charts and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={stats.revenueData} />
        <SystemHealth metrics={stats.systemHealth} />
      </div>

      {/* Recent Tenants */}
      <RecentTenantsTable tenants={stats.recentTenants} />
    </div>
  );
} 