import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTenantBySlug } from '../../../lib/tenant';
import { QuickBooking } from '../../../components/public/QuickBooking';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StructuredData } from '@/components/seo/StructuredData';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { getBaseUrl } from '@/lib/seo/config';

/**
 * Generate dynamic metadata for clinic booking pages
 * Includes booking-specific information for appointment scheduling
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled || !tenant.publicBookingEnabled) {
    return {
      title: 'Página no disponible',
      description: 'La página de reservas que buscas no está disponible.',
    };
  }

  const baseUrl = getBaseUrl();
  const bookingUrl = `${baseUrl}/${tenant.slug}/agendar`;
  const title = `Agendar Cita - ${tenant.name}`;
  const description = `Agenda una cita en ${tenant.name}. Reserva online de forma rápida y sencilla para la atención veterinaria de tu mascota.`;

  // Use clinic logo or fallback to dynamic OG image
  const ogImage = tenant.logo
    ? tenant.logo
    : `${baseUrl}/api/og?clinic=${encodeURIComponent(tenant.name)}&title=${encodeURIComponent('Agendar Cita')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: bookingUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${tenant.name} - Agendar Cita`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: bookingUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

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

  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    `/${tenant.slug}/agendar`,
    'Agendar Cita',
    'es'
  );

  return (
    <>
      {/* Structured data for SEO */}
      <StructuredData data={breadcrumbSchema} />

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
    </>
  );
} 