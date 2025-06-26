import { CustomerPageClient } from './CustomerPageClient';

interface CustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  
  return <CustomerPageClient id={id} />;
} 