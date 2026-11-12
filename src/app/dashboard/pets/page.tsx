import { requireActiveSubscription } from '../../../lib/auth';
import { checkPetLimit } from '../../../lib/plan-limits';
import { PetsPageClient } from './PetsPageClient';

export default async function PetsPage() {
  // CRITICAL FIX: Use requireActiveSubscription to block access with expired trial
  const { tenant } = await requireActiveSubscription();
  const { canAdd, current, limit } = await checkPetLimit(tenant.id);

  return <PetsPageClient petLimit={{ canAdd, current, limit }} />;
}
