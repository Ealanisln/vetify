import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTenantBySlug, getFeaturedServices } from '../../lib/tenant';
import { ClinicHero } from '../../components/public/ClinicHero';
import { ClinicServices } from '../../components/public/ClinicServices';
import { ClinicInfo } from '../../components/public/ClinicInfo';
import { QuickBooking } from '../../components/public/QuickBooking';
import { TestimonialsSection } from '../../components/public/TestimonialsSection';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateLocalBusinessSchema } from '@/lib/seo/structured-data';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { getBaseUrl } from '@/lib/seo/config';
import { getApprovedTestimonials, getPublicTestimonialStats } from '@/lib/testimonials';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';

/**
 * Generate dynamic metadata for individual clinic pages
 * Includes clinic-specific information and LocalBusiness structured data
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    return {
      title: 'Clínica no encontrada',
      description: 'La clínica veterinaria que buscas no está disponible.',
    };
  }

  const baseUrl = getBaseUrl();
  const clinicUrl = `${baseUrl}/${tenant.slug}`;
  const title = `${tenant.name} - Clínica Veterinaria`;
  const description =
    tenant.publicDescription ||
    `${tenant.name} - Atención veterinaria profesional. Agenda tu cita online de forma rápida y sencilla.`;

  // Use clinic logo or fallback to dynamic OG image
  const ogImage = tenant.logo
    ? tenant.logo
    : `${baseUrl}/api/og?clinic=${encodeURIComponent(tenant.name)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: clinicUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${tenant.name} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: clinicUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

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

  // Fetch featured services and testimonials in parallel
  const [featuredServices, testimonials, testimonialStats] = await Promise.all([
    getFeaturedServices(tenant.id),
    getApprovedTestimonials(tenant.id, { featuredOnly: false, limit: 10 }),
    getPublicTestimonialStats(tenant.id),
  ]);

  const baseUrl = getBaseUrl();
  const clinicUrl = `${baseUrl}/${tenant.slug}`;

  // Generate LocalBusiness structured data
  const localBusinessSchema = generateLocalBusinessSchema(
    {
      name: tenant.name,
      description:
        tenant.publicDescription ||
        `${tenant.name} - Clínica veterinaria profesional`,
      url: clinicUrl,
      telephone: tenant.publicPhone,
      email: tenant.publicEmail,
      address: {
        streetAddress: tenant.publicAddress,
        addressLocality: tenant.publicCity,
        addressRegion: tenant.publicState,
        postalCode: tenant.publicPostalCode,
        addressCountry: tenant.publicCountry || 'MX',
      },
      images: tenant.logo ? [tenant.logo] : undefined,
      priceRange: '$$', // Default price range for veterinary clinics
    },
    'es'
  );

  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    `/${tenant.slug}`,
    tenant.name,
    'es'
  );

  return (
    <>
      {/* Analytics tracking */}
      <AnalyticsTracker tenantSlug={tenant.slug} pageSlug="landing" />

      {/* Structured data for SEO */}
      <StructuredData data={[localBusinessSchema, breadcrumbSchema]} />

      <ClinicHero tenant={tenant} />
      <QuickBooking tenant={tenant} />
      <ClinicServices tenant={tenant} featuredServices={featuredServices} />
      <TestimonialsSection
        tenant={tenant}
        testimonials={testimonials}
        stats={testimonialStats}
      />
      <ClinicInfo tenant={tenant} />
    </>
  );
} 