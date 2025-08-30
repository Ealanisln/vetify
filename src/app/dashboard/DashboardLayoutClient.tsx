"use client";

import { useState } from 'react';
import { Sidebar, DashboardHeader } from '@/components/dashboard';
import type { UserWithTenant, TenantWithPlan } from '@/types';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: UserWithTenant;
  tenant: TenantWithPlan;
}

export function DashboardLayoutClient({ children, user, tenant }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
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
    </div>
  );
} 