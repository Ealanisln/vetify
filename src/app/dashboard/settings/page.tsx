import { requireAuth } from '../../../lib/auth';
import { SettingsPageClient } from './SettingsPageClient';

export default async function SettingsPage() {
  const { tenant } = await requireAuth();

  return <SettingsPageClient tenant={tenant} />;
} 