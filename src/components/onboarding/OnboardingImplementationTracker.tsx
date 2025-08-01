'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, PlayCircle, ChevronDown, ChevronRight } from 'lucide-react';

export interface ImplementationTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  estimatedHours?: number;
  dependencies?: string[];
  notes?: string;
  lastUpdated?: Date;
}

export interface ImplementationPhase {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: ImplementationTask[];
  startDate?: Date;
  endDate?: Date;
  blockers?: string[];
}

// Implementation phases based on the onboarding flow document
export const IMPLEMENTATION_PHASES: ImplementationPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Database & Core Setup',
    description: 'Set up database schema and core utilities for trial management',
    status: 'in_progress',
    tasks: [
      {
        id: 'run-b2b-plans-sql',
        title: 'Run scripts/create-b2b-plans.sql',
        description: 'Seed B2B plans in database before deployment',
        status: 'pending',
        priority: 'critical',
        estimatedHours: 1,
      },
      {
        id: 'add-trial-fields',
        title: 'Add trial and billing fields to Tenant/TenantSubscription models',
        description: 'Update database schema with trial management fields',
        status: 'pending',
        priority: 'high',
        estimatedHours: 3,
      },
      {
        id: 'prisma-migrations',
        title: 'Update Prisma migrations for trial support',
        description: 'Create and run migrations for trial functionality',
        status: 'pending',
        priority: 'high',
        estimatedHours: 2,
        dependencies: ['add-trial-fields'],
      },
      {
        id: 'trial-utilities',
        title: 'Create trial management and billing utilities',
        description: 'Implement lib/trial-management.ts and lib/billing-utils.ts',
        status: 'pending',
        priority: 'high',
        estimatedHours: 4,
      },
      {
        id: 'test-trial-calculations',
        title: 'Test plan queries and trial calculations',
        description: 'Unit tests for trial logic and billing calculations',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 2,
        dependencies: ['trial-utilities'],
      },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Trial Onboarding (No Stripe)',
    description: 'Implement multi-step onboarding without Stripe integration',
    status: 'in_progress',
    tasks: [
      {
        id: 'update-tenant-creation',
        title: 'Update createTenantWithDefaults to skip Stripe',
        description: 'Modify tenant creation to not create Stripe customer during trial',
        status: 'pending',
        priority: 'high',
        estimatedHours: 3,
        dependencies: ['add-trial-fields'],
      },
      {
        id: 'multistep-components',
        title: 'Create multi-step onboarding components',
        description: 'Build PlanSelection, ClinicInfo, and Confirmation components',
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 6,
      },
      {
        id: 'plan-selection-ui',
        title: 'Implement plan selection UI with billing clarifications',
        description: 'Clear messaging about trial and billing start',
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 4,
      },
      {
        id: 'progress-confirmation',
        title: 'Add progress indicator and confirmation with billing messaging',
        description: 'Update OnboardingProgress and create confirmation step',
        status: 'in_progress',
        priority: 'medium',
        estimatedHours: 3,
      },
      {
        id: 'test-onboarding-flow',
        title: 'Test complete onboarding flow without payment',
        description: 'End-to-end testing of trial onboarding',
        status: 'pending',
        priority: 'high',
        estimatedHours: 3,
        dependencies: ['multistep-components', 'update-tenant-creation'],
      },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Trial Management System',
    description: 'Build trial status tracking and notification system',
    status: 'pending',
    tasks: [
      {
        id: 'trial-status-api',
        title: 'Create trial status checking API',
        description: 'API endpoint for checking trial status and remaining days',
        status: 'pending',
        priority: 'high',
        estimatedHours: 3,
        dependencies: ['trial-utilities'],
      },
      {
        id: 'dashboard-trial-banner',
        title: 'Implement dashboard trial banner with billing status',
        description: 'TrialBanner component for dashboard',
        status: 'pending',
        priority: 'high',
        estimatedHours: 4,
        dependencies: ['trial-status-api'],
      },
      {
        id: 'notification-system',
        title: 'Build notification system for users without payment method',
        description: 'Email notifications at 7, 3, and 1 day before expiration',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 5,
      },
      {
        id: 'automated-cleanup',
        title: 'Create automated cleanup script',
        description: 'Script to handle expired trials without payment method',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 3,
      },
    ],
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Immediate Billing Conversion System',
    description: 'Stripe integration with immediate billing (no trial period)',
    status: 'pending',
    tasks: [
      {
        id: 'payment-collection-ui',
        title: 'Build payment method collection UI with billing start messaging',
        description: 'TrialUpgrade component with clear billing communication',
        status: 'pending',
        priority: 'high',
        estimatedHours: 6,
      },
      {
        id: 'stripe-immediate-billing',
        title: 'Create Stripe integration for immediate billing (no trial)',
        description: 'Subscription creation without trial period in Stripe',
        status: 'pending',
        priority: 'critical',
        estimatedHours: 8,
      },
      {
        id: 'subscription-upgrade-api',
        title: 'Implement subscription upgrade API with billing date calculation',
        description: 'API for converting trial to paid subscription',
        status: 'pending',
        priority: 'high',
        estimatedHours: 5,
        dependencies: ['stripe-immediate-billing'],
      },
      {
        id: 'subscription-management-pages',
        title: 'Add subscription management pages',
        description: 'UI for managing subscriptions and billing',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 4,
      },
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5: Monitoring & Analytics',
    description: 'Trial conversion tracking and metrics',
    status: 'pending',
    tasks: [
      {
        id: 'conversion-tracking',
        title: 'Add trial conversion tracking with billing metrics',
        description: 'Analytics for trial-to-paid conversion rates',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 4,
      },
      {
        id: 'metrics-dashboard',
        title: 'Create trial metrics dashboard',
        description: 'Admin dashboard for trial conversion analytics',
        status: 'pending',
        priority: 'low',
        estimatedHours: 6,
      },
      {
        id: 'cron-jobs',
        title: 'Set up automated trial management cron jobs',
        description: 'Automated cleanup and notification jobs',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 3,
      },
    ],
  },
  {
    id: 'phase-6',
    title: 'Phase 6: Deployment & Testing',
    description: 'Production deployment and end-to-end testing',
    status: 'pending',
    tasks: [
      {
        id: 'deploy-trial-system',
        title: 'Deploy trial management system',
        description: 'Production deployment of all trial features',
        status: 'pending',
        priority: 'critical',
        estimatedHours: 4,
      },
      {
        id: 'production-seed',
        title: 'Run plan seeding in production',
        description: 'Execute B2B plan seeding in production database',
        status: 'pending',
        priority: 'critical',
        estimatedHours: 1,
      },
      {
        id: 'end-to-end-testing',
        title: 'Test end-to-end trial flow with immediate billing',
        description: 'Complete system testing in production',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
      },
    ],
  },
];

interface OnboardingImplementationTrackerProps {
  className?: string;
}

export function OnboardingImplementationTracker({ 
  className = '' 
}: OnboardingImplementationTrackerProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['phase-1', 'phase-2']));
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      blocked: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge 
        variant="outline" 
        className={variants[status as keyof typeof variants] || variants.pending}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'bg-red-50 text-red-700 border-red-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      low: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${variants[priority as keyof typeof variants] || variants.low}`}
      >
        {priority}
      </Badge>
    );
  };

  const filteredPhases = IMPLEMENTATION_PHASES.filter(phase => {
    if (filterStatus === 'all') return true;
    return phase.status === filterStatus;
  });

  // Calculate overall progress
  const totalTasks = IMPLEMENTATION_PHASES.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const completedTasks = IMPLEMENTATION_PHASES.reduce(
    (acc, phase) => acc + phase.tasks.filter(task => task.status === 'completed').length, 
    0
  );
  const inProgressTasks = IMPLEMENTATION_PHASES.reduce(
    (acc, phase) => acc + phase.tasks.filter(task => task.status === 'in_progress').length, 
    0
  );
  const overallProgress = (completedTasks / totalTasks) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Onboarding Flow Implementation Tracker
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Multi-Step Onboarding with Plan Selection & Trial Management
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#75a99c]">
              {Math.round(overallProgress)}%
            </div>
            <div className="text-sm text-gray-500">Overall Progress</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-[#75a99c] h-3 rounded-full transition-all duration-300" 
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {completedTasks}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {inProgressTasks}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {totalTasks - completedTasks - inProgressTasks}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {IMPLEMENTATION_PHASES.length}
            </div>
            <div className="text-sm text-gray-500">Phases</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mt-4">
          {['all', 'pending', 'in_progress', 'completed'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </Card>

      {/* Implementation Phases */}
      <div className="space-y-4">
        {filteredPhases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          const phaseProgress = (phase.tasks.filter(t => t.status === 'completed').length / phase.tasks.length) * 100;
          
          return (
            <Card key={phase.id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => togglePhase(phase.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {phase.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {Math.round(phaseProgress)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {phase.tasks.filter(t => t.status === 'completed').length}/{phase.tasks.length} tasks
                      </div>
                    </div>
                    {getStatusBadge(phase.status)}
                  </div>
                </div>
                
                {/* Phase Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-[#75a99c] h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${phaseProgress}%` }}
                  />
                </div>
              </div>

              {/* Phase Tasks */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="p-4 space-y-3">
                    {phase.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="mt-0.5">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {task.description}
                                </p>
                              )}
                              {task.dependencies && task.dependencies.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-500">
                                    Depends on: {task.dependencies.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {getPriorityBadge(task.priority)}
                              {getStatusBadge(task.status)}
                              {task.estimatedHours && (
                                <Badge variant="outline" className="text-xs">
                                  {task.estimatedHours}h
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Key Decisions Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🔑 Key Implementation Decisions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Trial Period: 30 days free for all plans</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Default Plan: PROFESIONAL entry-level</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">No Free Plan: B2B model only</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Billing Interval: User choice during onboarding</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">NO Stripe trial - billing starts with payment method</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">First charge calculated from payment addition date</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">App trial continues until original end date</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Clear communication about billing start</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}