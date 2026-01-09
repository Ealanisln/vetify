'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Download, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { AnalyticsOverviewCards } from './AnalyticsOverviewCards';
import { VisitsConversionsChart } from './VisitsConversionsChart';
import { TrafficSourcesChart } from './TrafficSourcesChart';
import { DeviceBreakdownChart } from './DeviceBreakdownChart';
import { BrowserBreakdownChart } from './BrowserBreakdownChart';
import { TopPagesChart } from './TopPagesChart';

interface LandingPageMetrics {
  totalPageViews: number;
  uniqueSessions: number;
  totalConversions: number;
  conversionRate: number;
  pageViewsChange: number;
  conversionsChange: number;
  dailyData: Array<{
    date: string;
    dateLabel: string;
    pageViews: number;
    uniqueSessions: number;
    conversions: number;
    conversionRate: number;
  }>;
  topReferrers: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  browserBreakdown: Array<{
    browser: string;
    count: number;
    percentage: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    uniqueSessions: number;
  }>;
}

interface LandingAnalyticsSectionProps {
  publicPageEnabled: boolean;
}

type DateRange = '7d' | '14d' | '30d' | '60d' | '90d';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '14d', label: 'Últimos 14 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '60d', label: 'Últimos 60 días' },
  { value: '90d', label: 'Últimos 90 días' },
];

export function LandingAnalyticsSection({ publicPageEnabled }: LandingAnalyticsSectionProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LandingPageMetrics | null>(null);

  const getDateRange = useCallback((range: DateRange) => {
    const end = endOfDay(new Date());
    const daysMap: Record<DateRange, number> = {
      '7d': 6,
      '14d': 13,
      '30d': 29,
      '60d': 59,
      '90d': 89,
    };
    const start = startOfDay(subDays(end, daysMap[range]));
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const response = await fetch(
        `/api/analytics/landing-page?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar las estadísticas');
      }

      const result = await response.json();

      if (result.data) {
        setData(result.data);
      } else if (result.message) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, getDateRange]);

  useEffect(() => {
    if (publicPageEnabled) {
      fetchAnalytics();
    }
  }, [publicPageEnabled, fetchAnalytics]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const response = await fetch(
        `/api/analytics/landing-page/export?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );

      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Error al exportar las estadísticas');
    } finally {
      setIsExporting(false);
    }
  };

  if (!publicPageEnabled) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Estadísticas no disponibles
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Para ver las estadísticas de tu página pública, primero debes activarla en la configuración de &quot;Página Pública&quot;.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Loading skeleton for cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Loading skeleton for chart */}
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error al cargar estadísticas
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sin datos disponibles
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Aún no hay datos de visitas registrados para tu página pública.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <AnalyticsOverviewCards
        totalPageViews={data.totalPageViews}
        uniqueSessions={data.uniqueSessions}
        totalConversions={data.totalConversions}
        conversionRate={data.conversionRate}
        pageViewsChange={data.pageViewsChange}
        conversionsChange={data.conversionsChange}
      />

      {/* Main chart */}
      <VisitsConversionsChart data={data.dailyData} />

      {/* Secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficSourcesChart data={data.topReferrers} />
        <TopPagesChart data={data.topPages} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceBreakdownChart data={data.deviceBreakdown} />
        <BrowserBreakdownChart data={data.browserBreakdown} />
      </div>
    </div>
  );
}
