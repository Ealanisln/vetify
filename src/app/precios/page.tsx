import { PricingPageEnhanced } from '@/components/pricing';

export default async function PreciosPage() {
  // Página pública - no requiere autenticación
  return <PricingPageEnhanced tenant={null} />;
}