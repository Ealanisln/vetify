import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import type { Metadata } from 'next';

/**
 * Generate metadata for the contact page
 * Includes contact-specific keywords and Open Graph tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.com';

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
      images: [
        {
          url: `${baseUrl}/api/og?page=contact`,
          width: 1200,
          height: 630,
          alt: 'Vetify - Contáctanos',
        },
      ],
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
