import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs';
import { StructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

/**
 * Generate metadata for the changelog/updates page
 * Includes changelog-specific keywords and Open Graph tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.pro';

  const seoConfig = createPageSEO(
    'Actualizaciones - Vetify',
    'Consulta las últimas actualizaciones, mejoras y correcciones en Vetify. Mantente informado sobre las novedades del software de gestión veterinaria.',
    {
      path: '/actualizaciones',
      keywords: [
        'actualizaciones vetify',
        'changelog vetify',
        'novedades software veterinario',
        'mejoras vetify',
        'versiones vetify',
        'historial de cambios',
        'nuevas funciones veterinaria',
      ],
      lang,
      ogImage: `${baseUrl}/api/og?page=changelog`,
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

export default function ActualizacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' },
    { name: 'Actualizaciones', path: '/actualizaciones' }
  ], 'es');

  return (
    <>
      <StructuredData data={[breadcrumbSchema]} />
      {children}
    </>
  );
}
