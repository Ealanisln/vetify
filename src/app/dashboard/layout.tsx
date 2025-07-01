import { requireAuth } from '@/lib/auth';
import { DashboardLayoutClient } from './DashboardLayoutClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenant } = await requireAuth();

  return (
    <DashboardLayoutClient user={user} tenant={tenant}>
      {children}
    </DashboardLayoutClient>
  );
} 