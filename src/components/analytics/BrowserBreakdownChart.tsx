'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface BrowserData {
  browser: string;
  count: number;
  percentage: number;
}

interface BrowserBreakdownChartProps {
  data: BrowserData[];
}

const browserColors: Record<string, string> = {
  'Chrome': 'bg-yellow-500',
  'Safari': 'bg-blue-500',
  'Firefox': 'bg-orange-500',
  'Edge': 'bg-cyan-500',
  'Opera': 'bg-red-500',
  'Samsung Internet': 'bg-purple-500',
};

export function BrowserBreakdownChart({ data }: BrowserBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Navegadores</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Qué navegadores usan tus visitantes
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
            No hay datos de navegadores
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Navegadores</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Qué navegadores usan tus visitantes
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => {
            const color = browserColors[item.browser] || 'bg-gray-500';

            return (
              <div key={item.browser} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.browser}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
