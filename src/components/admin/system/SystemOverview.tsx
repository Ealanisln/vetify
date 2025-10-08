import os from 'os';
import { ServerIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

function getCpuUsagePercent(): number {
  const load = os.loadavg()[0]; // 1-minute load average
  const cores = os.cpus().length;
  return Math.min(100, Math.round((load / cores) * 100));
}

export async function SystemOverview() {
  const cpuUsage = getCpuUsagePercent();
  const totalMem = os.totalmem();
  const usedMem = totalMem - os.freemem();
  const memoryUsage = Math.round((usedMem / totalMem) * 100);
  const uptimeHours = Math.floor(os.uptime() / 3600);

  const systemStats = [
    {
      name: 'CPU Usage',
      value: `${cpuUsage}%`,
      icon: ServerIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900',
    },
    {
      name: 'Memory Usage',
      value: `${memoryUsage}%`,
      icon: ShieldCheckIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900',
    },
    {
      name: 'Uptime',
      value: `${uptimeHours}h`,
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {systemStats.map(stat => (
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