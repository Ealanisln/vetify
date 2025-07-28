'use client';

import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  CalendarIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { UserStats as UserStatsType } from '@/lib/admin/users';

interface UserStatsProps {
  stats: UserStatsType;
  loading?: boolean;
}

export function UserStats({ stats, loading = false }: UserStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total de Usuarios',
      value: stats.totalUsers.toLocaleString(),
      icon: UserGroupIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      description: 'Usuarios registrados en el sistema'
    },
    {
      name: 'Usuarios Activos',
      value: stats.activeUsers.toLocaleString(),
      icon: CheckCircleIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      description: 'Usuarios con estado activo',
      percentage: stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0
    },
    {
      name: 'Usuarios Inactivos',
      value: stats.inactiveUsers.toLocaleString(),
      icon: XCircleIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900',
      description: 'Usuarios desactivados',
      percentage: stats.totalUsers > 0 ? Math.round((stats.inactiveUsers / stats.totalUsers) * 100) : 0
    },
    {
      name: 'Nuevos (30 días)',
      value: stats.recentUsers.toLocaleString(),
      icon: CalendarIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      description: 'Usuarios registrados en los últimos 30 días'
    },
    {
      name: 'Sin Clínica',
      value: stats.usersWithoutTenant.toLocaleString(),
      icon: BuildingOfficeIcon,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      description: 'Usuarios sin asignar a una clínica',
      percentage: stats.totalUsers > 0 ? Math.round((stats.usersWithoutTenant / stats.totalUsers) * 100) : 0
    },
    {
      name: 'Super Admins',
      value: stats.superAdmins.toLocaleString(),
      icon: ShieldCheckIcon,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900',
      description: 'Usuarios con privilegios de super administrador'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    {stat.percentage !== undefined && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold">
                        <span className={`text-gray-600 dark:text-gray-400`}>
                          ({stat.percentage}%)
                        </span>
                      </div>
                    )}
                  </dd>
                  <dd className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 