import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTenantBySlug } from '../../../lib/tenant';
import { ClinicGallery } from '../../../components/public/ClinicGallery';
import Link from 'next/link';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { StructuredData } from '@/components/seo/StructuredData';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { getBaseUrl } from '@/lib/seo/config';

export async function generateMetadata({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    return {
      title: 'Página no disponible',
      description: 'La galería que buscas no está disponible.',
    };
  }

  const baseUrl = getBaseUrl();
  const galleryUrl = `${baseUrl}/${tenant.slug}/galeria`;
  const title = `Galería - ${tenant.name}`;
  const description = `Conoce las instalaciones, equipo y pacientes de ${tenant.name}. Galería de fotos de nuestra clínica veterinaria.`;

  const gallery = tenant.publicImages?.gallery || [];
  const ogImage = gallery.length > 0
    ? gallery[0].url
    : tenant.logo
      ? tenant.logo
      : `${baseUrl}/api/og?clinic=${encodeURIComponent(tenant.name)}&title=${encodeURIComponent('Galería')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: galleryUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${tenant.name} - Galería`,
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
      canonical: galleryUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function GaleriaPage({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  const gallery = tenant.publicImages?.gallery || [];

  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    `/${tenant.slug}/galeria`,
    'Galería',
    'es'
  );

  return (
    <>
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
              <div className="text-right flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Galería
                  </h1>
                  <p className="text-sm text-gray-500">
                    {gallery.length} {gallery.length === 1 ? 'imagen' : 'imágenes'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Galería */}
        {gallery.length > 0 ? (
          <ClinicGallery tenant={tenant} images={gallery} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Galería en construcción
            </h2>
            <p className="text-gray-500 mb-6">
              Pronto tendremos fotos de nuestras instalaciones y equipo.
            </p>
            <Link
              href={`/${tenant.slug}`}
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
