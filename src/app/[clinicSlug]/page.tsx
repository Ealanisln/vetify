import { notFound } from 'next/navigation';
import { getTenantBySlug } from '../../lib/tenant';
import { ClinicHero } from '../../components/public/ClinicHero';
import { ClinicServices } from '../../components/public/ClinicServices';
import { ClinicInfo } from '../../components/public/ClinicInfo';
import { QuickBooking } from '../../components/public/QuickBooking';

export default async function ClinicPage({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  return (
    <>
      <ClinicHero tenant={tenant} />
      <QuickBooking tenant={tenant} />
      <ClinicServices tenant={tenant} />
      <ClinicInfo tenant={tenant} />
    </>
  );
} 