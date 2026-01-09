'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Smartphone, Monitor, Tablet } from 'lucide-react';

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface DeviceBreakdownChartProps {
  data: DeviceData[];
}

const deviceIcons: Record<string, React.ReactNode> = {
  'Móvil': <Smartphone className="h-5 w-5" />,
  'Escritorio': <Monitor className="h-5 w-5" />,
  'Tablet': <Tablet className="h-5 w-5" />,
};

const deviceColors: Record<string, string> = {
  'Móvil': 'bg-blue-500',
  'Escritorio': 'bg-green-500',
  'Tablet': 'bg-purple-500',
};

export function DeviceBreakdownChart({ data }: DeviceBreakdownChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dispositivos</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Desde qué dispositivos te visitan
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
            No hay datos de dispositivos
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dispositivos</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Desde qué dispositivos te visitan
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const color = deviceColors[item.device] || 'bg-gray-500';
            const icon = deviceIcons[item.device] || <Monitor className="h-5 w-5" />;

            return (
              <div key={item.device} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">{icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.device}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count.toLocaleString()} visitas
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total de visitas</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
