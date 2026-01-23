import { requireActiveSubscription } from '@/lib/auth';
import { CustomersPageClient } from './CustomersPageClient';

export default async function CustomersPage() {
  await requireActiveSubscription();
  return <CustomersPageClient />;
}
