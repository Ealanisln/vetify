import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTenantBySlug, getPublicTeam } from '../../../lib/tenant';
import { TeamSection } from '../../../components/public/TeamSection';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
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
      description: 'El equipo que buscas no está disponible.',
    };
  }

  const baseUrl = getBaseUrl();
  const teamUrl = `${baseUrl}/${tenant.slug}/equipo`;
  const title = `Nuestro Equipo - ${tenant.name}`;
  const description = `Conoce al equipo de profesionales de ${tenant.name}. Veterinarios y especialistas dedicados al cuidado de tus mascotas.`;

  const ogImage = tenant.logo
    ? tenant.logo
    : `${baseUrl}/api/og?clinic=${encodeURIComponent(tenant.name)}&title=${encodeURIComponent('Nuestro Equipo')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: teamUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${tenant.name} - Nuestro Equipo`,
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
      canonical: teamUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function EquipoPage({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  const team = await getPublicTeam(tenant.id);

  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    `/${tenant.slug}/equipo`,
    'Nuestro Equipo',
    'es'
  );

  return (
    <>
      <StructuredData data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Header con navegación */}
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
                <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Nuestro Equipo
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {team.length} {team.length === 1 ? 'profesional' : 'profesionales'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        {team.length > 0 ? (
          <TeamSection tenant={tenant} team={team} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Equipo en construcción
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Pronto tendremos información sobre nuestros profesionales.
            </p>
            <Link
              href={`/${tenant.slug}`}
              className="inline-flex items-center text-primary dark:text-[#75a99c] hover:underline"
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
