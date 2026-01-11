import { redirect } from 'next/navigation';
import { requirePermission } from '../../../lib/auth';
import { SettingsPageClient } from './SettingsPageClient';

export default async function SettingsPage() {
  try {
    // Only MANAGER and ADMINISTRATOR can access settings
    const { tenant } = await requirePermission('settings', 'read');
    return <SettingsPageClient tenant={tenant} />;
  } catch {
    // User doesn't have permission - redirect to dashboard
    redirect('/dashboard?error=access_denied');
  }
} 