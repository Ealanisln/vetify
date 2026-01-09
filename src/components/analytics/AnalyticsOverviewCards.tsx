'use client';

import { TrendingUp, TrendingDown, Eye, Users, Target, Percent } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  suffix?: string;
}

function MetricCard({ title, value, change, icon, suffix }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm font-medium ${
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

interface AnalyticsOverviewCardsProps {
  totalPageViews: number;
  uniqueSessions: number;
  totalConversions: number;
  conversionRate: number;
  pageViewsChange: number;
  conversionsChange: number;
}

export function AnalyticsOverviewCards({
  totalPageViews,
  uniqueSessions,
  totalConversions,
  conversionRate,
  pageViewsChange,
  conversionsChange,
}: AnalyticsOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total de Visitas"
        value={totalPageViews}
        change={pageViewsChange}
        icon={<Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      />
      <MetricCard
        title="Visitantes Únicos"
        value={uniqueSessions}
        icon={<Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
      />
      <MetricCard
        title="Conversiones"
        value={totalConversions}
        change={conversionsChange}
        icon={<Target className="h-5 w-5 text-green-600 dark:text-green-400" />}
      />
      <MetricCard
        title="Tasa de Conversión"
        value={conversionRate}
        suffix="%"
        icon={<Percent className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
      />
    </div>
  );
}
