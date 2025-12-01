import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs';
import { StructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

/**
 * Generate metadata for the privacy policy page
 * Includes privacy-specific keywords and Open Graph tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.pro';

  const seoConfig = createPageSEO(
    'Política de Privacidad - Vetify',
    'Conoce cómo Vetify protege tus datos personales. Política de privacidad conforme a la LFPDPPP. Información sobre recopilación de datos, cookies, derechos ARCO y medidas de seguridad.',
    {
      path: '/privacidad',
      keywords: [
        'política de privacidad vetify',
        'protección de datos veterinaria',
        'LFPDPPP',
        'derechos ARCO',
        'privacidad datos personales',
        'cookies software veterinario',
        'seguridad datos clínica veterinaria',
        'aviso de privacidad',
      ],
      lang,
      ogImage: `${baseUrl}/api/og?page=privacy`,
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

export default function PrivacidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' },
    { name: 'Privacidad', path: '/privacidad' }
  ], 'es');

  return (
    <>
      <StructuredData data={[breadcrumbSchema]} />
      {children}
    </>
  );
}
