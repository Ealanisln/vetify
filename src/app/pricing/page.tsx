import type { Metadata } from 'next';
import { createPageSEO, generateMetadata } from '@/lib/seo';
import { PAGE_METADATA } from '@/lib/seo/config';
import { getLocalizedContent } from '@/lib/seo/language';
import { generateWebPageSchema } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/StructuredData';

// Generate SEO metadata for pricing page
const lang = 'es';
const pageConfig = PAGE_METADATA.pricing;
const title = getLocalizedContent(pageConfig.title, lang);
const description = getLocalizedContent(pageConfig.description, lang);

export const metadata: Metadata = generateMetadata(
  createPageSEO(title, description, {
    path: '/pricing',
    lang,
    keywords: [
      'precios vetify',
      'planes veterinarios',
      'costo software veterinario',
      'tarifas clínica veterinaria',
      'suscripción veterinaria',
      'prueba gratis',
    ],
  }),
  lang
);

export default function PricingPage() {
  // Generate structured data for this page
  const webPageSchema = generateWebPageSchema(
    title,
    description,
    'https://vetify.com/pricing', // Update with actual URL
    lang
  );

  return (
    <>
      {/* Add structured data for this page */}
      <StructuredData data={webPageSchema} />

      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          Planes y Precios
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Elige el plan perfecto para tu clínica veterinaria
        </p>

        {/* Your pricing content here */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pricing cards would go here */}
          <div className="border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Plan Básico</h2>
            <p className="text-gray-600 mb-4">
              Perfecto para clínicas pequeñas
            </p>
            <div className="text-3xl font-bold mb-4">
              $990<span className="text-sm text-gray-600">/mes</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li>✓ Hasta 100 pacientes</li>
              <li>✓ Gestión de citas</li>
              <li>✓ Historial médico</li>
              <li>✓ Soporte por email</li>
            </ul>
            <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90">
              Comenzar prueba gratis
            </button>
          </div>

          <div className="border rounded-lg p-6 shadow-lg border-primary">
            <div className="bg-primary text-white text-sm py-1 px-3 rounded-full inline-block mb-4">
              Más Popular
            </div>
            <h2 className="text-2xl font-bold mb-4">Plan Profesional</h2>
            <p className="text-gray-600 mb-4">
              Ideal para clínicas en crecimiento
            </p>
            <div className="text-3xl font-bold mb-4">
              $1,990<span className="text-sm text-gray-600">/mes</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li>✓ Pacientes ilimitados</li>
              <li>✓ Todas las funcionalidades básicas</li>
              <li>✓ Inventario y facturación</li>
              {/* FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented */}
              {/* <li>✓ Automatizaciones WhatsApp</li> */}
              <li>✓ Soporte prioritario</li>
            </ul>
            <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90">
              Comenzar prueba gratis
            </button>
          </div>

          <div className="border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Plan Enterprise</h2>
            <p className="text-gray-600 mb-4">
              Para hospitales veterinarios
            </p>
            <div className="text-3xl font-bold mb-4">Personalizado</div>
            <ul className="space-y-2 mb-6">
              <li>✓ Todo el plan profesional</li>
              <li>✓ Múltiples sucursales</li>
              <li>✓ API personalizada</li>
              <li>✓ Capacitación dedicada</li>
              <li>✓ Soporte 24/7</li>
            </ul>
            <button className="w-full border border-primary text-primary py-2 rounded-lg hover:bg-primary/10">
              Contactar ventas
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            🎉 Prueba gratis por 14 días - Sin tarjeta de crédito requerida
          </p>
        </div>
      </div>
    </>
  );
}
