import { notFound } from 'next/navigation';
import { getTenantBySlug } from '../../../lib/tenant';
import { QuickBooking } from '../../../components/public/QuickBooking';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AgendarPage({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled || !tenant.publicBookingEnabled) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href={`/${tenant.slug}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver a {tenant.name}
              </Link>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-semibold text-gray-900">
                Agendar Cita
              </h1>
              <p className="text-sm text-gray-500">
                {tenant.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de booking */}
      <QuickBooking tenant={tenant} />
    </div>
  );
} 