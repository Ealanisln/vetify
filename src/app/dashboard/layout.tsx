import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenant } = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} tenant={tenant} />
      <div className="lg:pl-64">
        <DashboardHeader user={user} tenant={tenant} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 