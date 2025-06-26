import { SystemHealth as SystemHealthType } from '@/lib/admin';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

interface SystemHealthProps {
  metrics: SystemHealthType;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function SystemHealth({ metrics }: SystemHealthProps) {
  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return CheckCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'error':
        return XCircleIcon;
    }
  };

  const StatusIcon = getStatusIcon(metrics.databaseStatus);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Estado del Sistema
        </h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(metrics.databaseStatus)}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="capitalize">{metrics.databaseStatus}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Uptime */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Tiempo Activo
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatUptime(metrics.uptime)}
          </span>
        </div>

        {/* Database Response Time */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <ServerIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Tiempo de Respuesta DB
            </span>
          </div>
          <span className={`text-sm font-medium ${
            metrics.responseTime < 100 
              ? 'text-green-600 dark:text-green-400' 
              : metrics.responseTime < 500 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-red-600 dark:text-red-400'
          }`}>
            {metrics.responseTime}ms
          </span>
        </div>

        {/* Active Connections */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-full bg-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Conexiones Activas
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {metrics.activeConnections}
          </span>
        </div>

        {/* Status Bar */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.databaseStatus === 'healthy' 
                    ? 'bg-green-500' 
                    : metrics.databaseStatus === 'warning' 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
                style={{ 
                  width: metrics.databaseStatus === 'healthy' 
                    ? '100%' 
                    : metrics.databaseStatus === 'warning' 
                      ? '70%' 
                      : '30%' 
                }}
              />
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {metrics.databaseStatus === 'healthy' ? 'Óptimo' : 
               metrics.databaseStatus === 'warning' ? 'Atención' : 'Crítico'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 