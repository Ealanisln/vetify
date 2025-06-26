import { getAdminStats } from '@/lib/admin';
import { 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export async function TenantStats() {
  const stats = await getAdminStats();

  const statCards = [
    {
      title: 'Total Clínicas',
      value: stats.totalTenants,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Activas',
      value: stats.activeTenants,
      icon: CheckCircleIcon,
      color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    },
    {
      title: 'Suspendidas',
      value: stats.suspendedTenants,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    },
    {
      title: 'Canceladas',
      value: stats.totalTenants - stats.activeTenants - stats.suspendedTenants,
      icon: XCircleIcon,
      color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 