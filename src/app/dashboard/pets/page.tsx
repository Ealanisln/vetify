import { requireActiveSubscription } from '../../../lib/auth';
import { PetsPageClient } from './PetsPageClient';

export default async function PetsPage() {
  // CRITICAL FIX: Use requireActiveSubscription to block access with expired trial
  const { tenant } = await requireActiveSubscription();
  const maxPets = tenant.tenantSubscription?.plan?.maxPets || 50;

  return <PetsPageClient maxPets={maxPets} />;
}
