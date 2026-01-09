'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DailyData {
  date: string;
  dateLabel: string;
  pageViews: number;
  uniqueSessions: number;
  conversions: number;
  conversionRate: number;
}

interface VisitsConversionsChartProps {
  data: DailyData[];
}

export function VisitsConversionsChart({ data }: VisitsConversionsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Visitas y Conversiones</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tendencia de visitas y conversiones en el período seleccionado
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="dateLabel"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelFormatter={(label) => `Fecha: ${label}`}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  pageViews: 'Visitas',
                  conversions: 'Conversiones',
                };
                return [value.toLocaleString(), labels[name] || name];
              }}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  pageViews: 'Visitas',
                  conversions: 'Conversiones',
                };
                return <span className="text-sm text-gray-700 dark:text-gray-300">{labels[value] || value}</span>;
              }}
            />
            <Area
              type="monotone"
              dataKey="pageViews"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorViews)"
            />
            <Area
              type="monotone"
              dataKey="conversions"
              stroke="#22C55E"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConversions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
