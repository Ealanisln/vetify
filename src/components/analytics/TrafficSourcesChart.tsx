'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

interface TrafficSourcesChartProps {
  data: TrafficSource[];
}

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

export function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fuentes de Tráfico</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            De dónde vienen tus visitantes
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-gray-500 dark:text-gray-400">
            No hay datos de fuentes de tráfico
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fuentes de Tráfico</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          De dónde vienen tus visitantes
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="count"
              nameKey="source"
              label={({ source, percentage }) => `${source} (${percentage}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
