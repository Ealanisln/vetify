'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileText } from 'lucide-react';

interface PageData {
  page: string;
  views: number;
  uniqueSessions: number;
}

interface TopPagesChartProps {
  data: PageData[];
}

export function TopPagesChart({ data }: TopPagesChartProps) {
  const maxViews = Math.max(...data.map(p => p.views), 1);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Páginas Más Visitadas</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Qué secciones visitan más
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
            No hay datos de páginas
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Páginas Más Visitadas</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Qué secciones visitan más
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.views / maxViews) * 100;

            return (
              <div key={item.page} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </span>
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.page}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.views.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      visitas
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
