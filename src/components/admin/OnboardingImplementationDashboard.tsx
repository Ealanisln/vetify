'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { OnboardingImplementationTracker } from '../onboarding/OnboardingImplementationTracker';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Database, 
  Code, 
  Rocket,
  TrendingUp,
  Users 
} from 'lucide-react';

interface ImplementationStatus {
  // Database Status
  plansSeeded: boolean;
  trialFieldsAdded: boolean;
  migrationsRun: boolean;
  
  // API Status  
  onboardingApiUpdated: boolean;
  subscriptionApiExists: boolean;
  trialStatusApiExists: boolean;
  upgradeApiExists: boolean;
  
  // Components Status
  multiStepOnboardingExists: boolean;
  planSelectionExists: boolean;
  trialBannerExists: boolean;
  upgradeUIExists: boolean;
  
  // System Status
  stripeConfigured: boolean;
  emailNotificationsConfigured: boolean;
  cronJobsSetup: boolean;
  
  lastChecked: Date;
}

export function OnboardingImplementationDashboard() {
  const [status, setStatus] = useState<ImplementationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'next-steps'>('overview');

  useEffect(() => {
    checkImplementationStatus();
  }, []);

  const checkImplementationStatus = async () => {
    setLoading(true);
    try {
      // This would normally call actual API endpoints to check implementation status
      // For now, we'll simulate based on known file existence and git status
      
      const mockStatus: ImplementationStatus = {
        // Database - needs to be checked
        plansSeeded: false, // Need to verify in database
        trialFieldsAdded: false, // Need prisma schema check
        migrationsRun: false, // Need migration status check
        
        // API Status - based on existing files
        onboardingApiUpdated: true, // EXISTS: src/app/api/onboarding/route.ts
        subscriptionApiExists: true, // EXISTS: src/app/api/subscription/current/route.ts
        trialStatusApiExists: false, // MISSING: src/app/api/subscription/status/route.ts
        upgradeApiExists: false, // MISSING: src/app/api/subscription/upgrade/route.ts
        
        // Components - based on existing files
        multiStepOnboardingExists: true, // EXISTS: OnboardingForm.tsx with steps
        planSelectionExists: false, // MISSING: PlanSelection.tsx component
        trialBannerExists: false, // MISSING: TrialBanner.tsx
        upgradeUIExists: false, // MISSING: TrialUpgrade.tsx
        
        // System Status
        stripeConfigured: true, // EXISTS: stripe integration
        emailNotificationsConfigured: false, // Need to verify email setup
        cronJobsSetup: false, // Need to verify cron jobs
        
        lastChecked: new Date(),
      };
      
      setStatus(mockStatus);
    } catch (error) {
      console.error('Error checking implementation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isImplemented: boolean, isRequired: boolean = true) => {
    if (isImplemented) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (isRequired) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (isImplemented: boolean, isRequired: boolean = true) => {
    if (isImplemented) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Implemented</Badge>;
    } else if (isRequired) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Missing</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Optional</Badge>;
    }
  };

  const calculateProgress = () => {
    if (!status) return 0;
    
    const criticalItems = [
      status.onboardingApiUpdated,
      status.multiStepOnboardingExists,
      status.stripeConfigured,
    ];
    
    const allItems = [
      status.plansSeeded,
      status.trialFieldsAdded,
      status.migrationsRun,
      status.onboardingApiUpdated,
      status.subscriptionApiExists,
      status.trialStatusApiExists,
      status.upgradeApiExists,
      status.multiStepOnboardingExists,
      status.planSelectionExists,
      status.trialBannerExists,
      status.upgradeUIExists,
      status.stripeConfigured,
      status.emailNotificationsConfigured,
      status.cronJobsSetup,
    ];
    
    return (allItems.filter(Boolean).length / allItems.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Error Loading Status
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to check implementation status
          </p>
          <Button onClick={checkImplementationStatus} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Onboarding Implementation Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track progress of the multi-step onboarding with trial management implementation
          </p>
        </div>
        <Button onClick={checkImplementationStatus} variant="outline">
          Refresh Status
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Overall Implementation Progress
          </h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#75a99c]">
              {Math.round(progress)}%
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-[#75a99c] h-4 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last checked: {status.lastChecked.toLocaleString()}
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'detailed', label: 'Detailed Tracker', icon: CheckCircle },
            { id: 'next-steps', label: 'Next Steps', icon: Rocket },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'detailed' | 'next-steps')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#75a99c] text-[#75a99c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Database Status */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Database className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Database Setup
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">B2B Plans Seeded</span>
                {getStatusBadge(status.plansSeeded)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trial Fields Added</span>
                {getStatusBadge(status.trialFieldsAdded)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Migrations Run</span>
                {getStatusBadge(status.migrationsRun)}
              </div>
            </div>
          </Card>

          {/* API Status */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                API Endpoints
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Onboarding API</span>
                {getStatusBadge(status.onboardingApiUpdated)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trial Status API</span>
                {getStatusBadge(status.trialStatusApiExists)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Upgrade API</span>
                {getStatusBadge(status.upgradeApiExists)}
              </div>
            </div>
          </Card>

          {/* UI Components */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                UI Components
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Multi-step Onboarding</span>
                {getStatusBadge(status.multiStepOnboardingExists)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trial Banner</span>
                {getStatusBadge(status.trialBannerExists)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Upgrade UI</span>
                {getStatusBadge(status.upgradeUIExists)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'detailed' && (
        <OnboardingImplementationTracker />
      )}

      {activeTab === 'next-steps' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🚀 Immediate Next Steps (Priority 1)
            </h3>
            <div className="space-y-4">
              {!status.plansSeeded && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Run B2B Plans Migration
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Execute `scripts/create-b2b-plans.sql` to seed the required B2B plans in the database.
                    </p>
                    <code className="block mt-2 p-2 bg-red-100 dark:bg-red-800 rounded text-xs">
                      pnpm db:migrate && node scripts/create-b2b-plans.sql
                    </code>
                  </div>
                </div>
              )}

              {!status.trialFieldsAdded && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Add Trial Fields to Database Schema
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Update Tenant and TenantSubscription models with trial management fields.
                    </p>
                  </div>
                </div>
              )}

              {!status.trialStatusApiExists && (
                <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">
                      Create Trial Status API
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Build `src/app/api/subscription/status/route.ts` for trial status checking.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📋 Implementation Sequence
            </h3>
            <ol className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#75a99c] text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Complete Database Setup
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Run migrations, seed plans, add trial fields
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Build Missing API Endpoints
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Trial status, subscription upgrade, and management APIs
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Implement UI Components
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plan selection, trial banners, and upgrade flows
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Test & Deploy
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    End-to-end testing and production deployment
                  </p>
                </div>
              </li>
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}