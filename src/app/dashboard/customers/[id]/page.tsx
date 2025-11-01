import { CustomerPageClient } from './CustomerPageClient';
import { requireActiveSubscription } from '../../../../lib/auth';

interface CustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  // CRITICAL FIX: Use requireActiveSubscription to block access with expired trial
  await requireActiveSubscription();

  const { id } = await params;

  return <CustomerPageClient id={id} />;
} 