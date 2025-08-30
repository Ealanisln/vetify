import { prisma } from '../../../lib/prisma';
import { ChartBarIcon, DocumentTextIcon, UsersIcon } from '@heroicons/react/24/outline';

export async function ReportsOverview() {
  // Fetch real metrics
  const [reportsGenerated, activeUsers] = await Promise.all([
    prisma.adminAuditLog.count(),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const reportStats = [
    {
      name: 'Reportes Generados',
      value: reportsGenerated.toLocaleString('es-MX'),
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900',
    },
    {
      name: 'Usuarios Activos',
      value: activeUsers.toLocaleString('es-MX'),
      icon: UsersIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900',
    },
    {
      name: 'Métricas Disponibles',
      value: '8',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {reportStats.map((stat) => (
        <div key={stat.name} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 