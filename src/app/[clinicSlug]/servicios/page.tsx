import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTenantBySlug, getAllPublicServices } from '../../../lib/tenant';
import { ServicesPage } from '../../../components/public/ServicesPage';
import { StructuredData } from '@/components/seo/StructuredData';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { getBaseUrl } from '@/lib/seo/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    return {
      title: 'Página no disponible',
      description: 'Los servicios que buscas no están disponibles.',
    };
  }

  const baseUrl = getBaseUrl();
  const servicesUrl = `${baseUrl}/${tenant.slug}/servicios`;
  const title = `Servicios Veterinarios - ${tenant.name}`;
  const description = `Descubre todos los servicios veterinarios que ofrece ${tenant.name}. Consultas, vacunación, cirugía, estética y más para el cuidado de tu mascota.`;

  const ogImage = tenant.logo
    ? tenant.logo
    : `${baseUrl}/api/og?clinic=${encodeURIComponent(tenant.name)}&title=${encodeURIComponent('Nuestros Servicios')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: servicesUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${tenant.name} - Servicios Veterinarios`,
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
      canonical: servicesUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ServiciosPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  const services = await getAllPublicServices(tenant.id);

  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    `/${tenant.slug}/servicios`,
    'Servicios',
    'es'
  );

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <ServicesPage tenant={tenant} services={services} />
    </>
  );
}
