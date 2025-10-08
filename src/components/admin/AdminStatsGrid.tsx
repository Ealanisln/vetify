import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AdminStats } from '../../lib/admin';

interface AdminStatsGridProps {
  stats: AdminStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'emerald' | 'blue' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  const activePercentage = stats.totalTenants > 0 
    ? ((stats.activeTenants / stats.totalTenants) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Clínicas"
        value={stats.totalTenants}
        subtitle={`${stats.activeTenants} activas`}
        icon={BuildingOfficeIcon}
        color="emerald"
      />
      
      <StatCard
        title="Usuarios Totales"
        value={stats.totalUsers}
        subtitle="En todas las clínicas"
        icon={UserGroupIcon}
        color="blue"
      />
      
      <StatCard
        title="Ingresos Totales"
        value={`$${stats.totalRevenue.toLocaleString()}`}
        subtitle={`$${stats.monthlyRevenue.toLocaleString()} este mes`}
        icon={CurrencyDollarIcon}
        color="purple"
      />
      
      <StatCard
        title="Tasa de Actividad"
        value={`${activePercentage}%`}
        subtitle={`${stats.suspendedTenants} suspendidas`}
        icon={stats.suspendedTenants > 0 ? ExclamationTriangleIcon : CheckCircleIcon}
        color={stats.suspendedTenants > 0 ? "yellow" : "emerald"}
      />
    </div>
  );
} 