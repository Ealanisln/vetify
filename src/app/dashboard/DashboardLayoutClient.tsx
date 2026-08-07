"use client";

import { useState } from 'react';
import { Sidebar, DashboardHeader } from '../../components/dashboard';
import { LocationProvider } from '@/components/providers/LocationProvider';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { BugReportButton } from '@/components/bug-report';
import type { UserWithTenant, TenantWithPlan } from '@/types';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: UserWithTenant;
  tenant: TenantWithPlan;
  /** ISO-4217 code from TenantSettings.currencyCode. */
  currencyCode: string;
}

export function DashboardLayoutClient({ children, user, tenant, currencyCode }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CurrencyProvider currencyCode={currencyCode}>
      <LocationProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar
            user={user}
            tenant={tenant}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <div className="lg:pl-64">
            <DashboardHeader
              user={user}
              tenant={tenant}
              onMenuClick={() => setSidebarOpen(true)}
            />
            <main className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
          <BugReportButton />
        </div>
      </LocationProvider>
    </CurrencyProvider>
  );
}