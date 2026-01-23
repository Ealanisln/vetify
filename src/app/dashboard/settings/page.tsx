import { redirect } from 'next/navigation';
import { requirePermission, hasActiveSubscription } from '../../../lib/auth';
import { SettingsPageClient } from './SettingsPageClient';

export default async function SettingsPage() {
  try {
    // Only MANAGER and ADMINISTRATOR can access settings
    const { tenant } = await requirePermission('settings', 'read');
    const isActiveSubscription = hasActiveSubscription(tenant);
    return <SettingsPageClient tenant={tenant} isActiveSubscription={isActiveSubscription} />;
  } catch {
    // User doesn't have permission - redirect to dashboard
    redirect('/dashboard?error=access_denied');
  }
}
