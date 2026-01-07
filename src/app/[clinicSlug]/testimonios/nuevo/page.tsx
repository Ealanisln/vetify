import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTenantBySlug } from '@/lib/tenant';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { StructuredData } from '@/components/seo/StructuredData';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { getBaseUrl } from '@/lib/seo/config';
import TestimonialForm from '@/components/public/TestimonialForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    return {
      title: 'Pagina no disponible',
      description: 'La pagina que buscas no esta disponible.',
    };
  }

  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/${tenant.slug}/testimonios/nuevo`;
  const title = `Deja tu testimonio - ${tenant.name}`;
  const description = `Comparte tu experiencia con ${tenant.name}. Tu opinion es muy importante para nosotros y ayuda a otros a conocer nuestros servicios.`;

  const ogImage = tenant.logo
    ? tenant.logo
    : `${baseUrl}/api/og?clinic=${encodeURIComponent(tenant.name)}&title=${encodeURIComponent('Deja tu testimonio')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${tenant.name} - Deja tu testimonio`,
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
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function NuevoTestimonioPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  const breadcrumbSchema = createBreadcrumbsFromPath(
    `/${tenant.slug}/testimonios/nuevo`,
    'Deja tu testimonio',
    'es'
  );

  return (
    <>
      <StructuredData data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href={`/${tenant.slug}`}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Volver a {tenant.name}
                </Link>
              </div>
              <div className="text-right flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Deja tu testimonio
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tu opinion nos importa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/50 p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Comparte tu experiencia
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Tu testimonio ayuda a otros a conocer nuestros servicios
              </p>
            </div>

            <TestimonialForm clinicSlug={tenant.slug} clinicName={tenant.name} />
          </div>
        </div>
      </div>
    </>
  );
}
