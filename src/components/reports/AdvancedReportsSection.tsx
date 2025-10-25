'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import RevenueCharts from './RevenueCharts';
import CustomerAnalyticsComponent from './CustomerAnalytics';
import ServiceInventoryAnalytics from './ServiceInventoryAnalytics';
import { exportToCSV, RevenueAnalytics, CustomerAnalytics, ServiceAnalytics, InventoryAnalytics } from '../../lib/reports';

interface ReportsData {
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  services: ServiceAnalytics;
  inventory: InventoryAnalytics;
}

interface AdvancedReportsSectionProps {
  reportsData: ReportsData;
}

const advancedTabs = [
  { id: 'revenue', name: 'Ingresos', icon: ChartBarIcon },
  { id: 'customers', name: 'Clientes', icon: UserGroupIcon },
  { id: 'services', name: 'Servicios e Inventario', icon: ShoppingCartIcon },
];

/**
 * Advanced Reports Section for Plan Profesional+
 *
 * Features:
 * - Interactive charts and graphs
 * - Detailed analytics by section
 * - Advanced CSV export by tab
 * - Trend analysis and comparisons
 *
 * This component is protected by <FeatureGate feature="advancedReports">
 */
export default function AdvancedReportsSection({ reportsData }: AdvancedReportsSectionProps) {
  const [activeTab, setActiveTab] = useState('revenue');

  const handleExport = (type: string) => {
    switch (type) {
      case 'revenue':
        exportToCSV([
          ...reportsData.revenue.dailySales,
          ...reportsData.revenue.monthlySales
        ], 'revenue-report');
        break;
      case 'customers':
        exportToCSV(reportsData.customers.topCustomers, 'customers-report');
        break;
      case 'services':
        exportToCSV(reportsData.services.topServices, 'services-report');
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'revenue':
        return <RevenueCharts data={reportsData.revenue} />;
      case 'customers':
        return <CustomerAnalyticsComponent data={reportsData.customers} />;
      case 'services':
        return <ServiceInventoryAnalytics serviceData={reportsData.services} inventoryData={reportsData.inventory} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Analytics Avanzados</h2>
          <p className="text-sm text-muted-foreground">
            Análisis detallado con gráficos interactivos y tendencias
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport(activeTab)}
          className="flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Exportar {advancedTabs.find(t => t.id === activeTab)?.name}
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {advancedTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
}
