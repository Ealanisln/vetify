'use client';

import { RevenueAnalytics, CustomerAnalytics, ServiceAnalytics, InventoryAnalytics } from '../../lib/reports';
import BasicReportsClient from './BasicReportsClient';
import AdvancedReportsSection from './AdvancedReportsSection';
import AdvancedReportsUpgradePrompt from './AdvancedReportsUpgradePrompt';
import { FeatureGate } from '../features/FeatureGate';

interface ReportsData {
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  services: ServiceAnalytics;
  inventory: InventoryAnalytics;
}

interface EnhancedReportsClientProps {
  reportsData: ReportsData;
}

/**
 * Enhanced Reports Client - Main Orchestrator
 *
 * Architecture:
 * - Always shows BasicReportsClient (available to all plans)
 * - Conditionally shows AdvancedReportsSection based on plan:
 *   - Plan Básico: Shows AdvancedReportsUpgradePrompt
 *   - Plan Profesional+: Shows full AdvancedReportsSection
 *
 * Plan Features:
 * - Plan Básico: Overview metrics, top 5 lists, basic export
 * - Plan Profesional: + Advanced charts, analytics, detailed exports
 */
export default function EnhancedReportsClient({ reportsData }: EnhancedReportsClientProps) {
  return (
    <div className="space-y-8">
      {/* Basic Reports - Always visible */}
      <BasicReportsClient reportsData={reportsData} />

      {/* Advanced Reports - Gated by subscription plan */}
      <FeatureGate
        feature="advancedReports"
        fallback={<AdvancedReportsUpgradePrompt />}
      >
        <AdvancedReportsSection reportsData={reportsData} />
      </FeatureGate>
    </div>
  );
}
