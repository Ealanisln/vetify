import { requireAuth } from '../../lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import { DashboardLayoutClient } from './DashboardLayoutClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenant } = await requireAuth();

  // Resolved server-side so money renders in the tenant's currency on the first
  // paint, with no fetch and no flash of the wrong one.
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id },
    select: { currencyCode: true },
  });

  return (
    <DashboardLayoutClient
      user={user}
      tenant={tenant}
      currencyCode={settings?.currencyCode ?? DEFAULT_CURRENCY}
    >
      {children}
    </DashboardLayoutClient>
  );
}