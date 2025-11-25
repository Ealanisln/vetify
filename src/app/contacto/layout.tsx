import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs';
import { generateFAQPageSchema, COMMON_FAQS_ES } from '@/lib/seo/faq-schema';
import { StructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

/**
 * Generate metadata for the contact page
 * Includes contact-specific keywords and Open Graph tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.pro';

  const seoConfig = createPageSEO(
    'Contacto - Vetify',
    'Contáctanos para conocer más sobre Vetify. Estamos aquí para ayudarte a transformar tu clínica veterinaria con nuestro software de gestión. Respuesta en menos de 24 horas.',
    {
      path: '/contacto',
      keywords: [
        'contacto vetify',
        'contactar soporte veterinario',
        'ayuda software veterinario',
        'demo vetify',
        'información vetify',
        'soporte técnico veterinaria',
        'agendar demo veterinaria',
        'solicitar información veterinaria',
      ],
      lang,
      ogImage: `${baseUrl}/api/og?page=contact`,
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' },
    { name: 'Contacto', path: '/contacto' }
  ], 'es');

  const faqSchema = generateFAQPageSchema(COMMON_FAQS_ES.contact);

  return (
    <>
      <StructuredData data={[breadcrumbSchema, faqSchema]} />
      {children}
    </>
  );
}
