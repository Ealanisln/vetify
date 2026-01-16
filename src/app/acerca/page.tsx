import Link from 'next/link';
import {
  Heart,
  Target,
  Shield,
  Zap,
  Users,
  Globe,
  Clock,
  Lock,
  Award,
  Sparkles,
  Mail,
} from 'lucide-react';
import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { PAGE_METADATA } from '@/lib/seo/config';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { generateOrganizationSchema } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

/**
 * Generate metadata for the About page
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const pageMetadata = PAGE_METADATA.about;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.pro';

  const seoConfig = createPageSEO(
    pageMetadata.title[lang],
    pageMetadata.description[lang],
    {
      path: '/acerca',
      keywords: [
        'acerca de vetify',
        'misión vetify',
        'software veterinario mexicano',
        'empresa tecnología veterinaria',
        'historia vetify',
        'valores vetify',
        'equipo vetify',
        'software veterinario confiable',
      ],
      lang,
      images: [
        {
          url: `${baseUrl}/api/og?page=about`,
          width: 1200,
          height: 630,
          alt: 'Vetify - Acerca de Nosotros',
        },
      ],
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="text-muted-foreground space-y-4 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors">
      <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

interface TrustSignalProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function TrustSignal({ icon, title, description }: TrustSignalProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

export default function AcercaPage() {
  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    '/acerca',
    'Acerca de Nosotros',
    'es'
  );

  // Generate organization structured data
  const organizationSchema = generateOrganizationSchema('es', {
    includeAddress: true,
    socialLinks: [],
  });

  return (
    <>
      {/* Structured data for SEO */}
      <StructuredData data={[breadcrumbSchema, organizationSchema]} />

      <main className="min-h-screen bg-background">
        {/* Header */}
        <section className="relative py-20 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl opacity-20"></div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-6">
              <Heart className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6">
              Acerca de <span className="text-primary">Vetify</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transformamos la gestión veterinaria con tecnología accesible, segura y
              diseñada para impulsar el éxito de las clínicas en México.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 lg:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-xl shadow-lg p-8 md:p-10 border border-border">

              {/* Mission */}
              <Section icon={<Target className="h-5 w-5" />} title="Nuestra Misión">
                <p>
                  En <strong className="text-foreground">Vetify</strong>, nuestra misión es
                  empoderar a las clínicas veterinarias de todos los tamaños con herramientas
                  tecnológicas que simplifiquen su operación diaria, mejoren la atención a sus
                  pacientes y les permitan enfocarse en lo que más importa:{' '}
                  <strong className="text-foreground">el bienestar animal</strong>.
                </p>
                <p>
                  Creemos que cada veterinario merece acceso a tecnología de primer nivel,
                  sin importar el tamaño de su práctica. Por eso desarrollamos un sistema
                  integral, intuitivo y accesible que se adapta a las necesidades reales
                  del sector veterinario en Latinoamérica.
                </p>
              </Section>

              {/* Story */}
              <Section icon={<Sparkles className="h-5 w-5" />} title="Nuestra Historia">
                <p>
                  Vetify nació de una observación simple pero poderosa: muchas clínicas
                  veterinarias en México aún gestionan su operación con hojas de cálculo,
                  libretas o sistemas obsoletos que limitan su crecimiento y eficiencia.
                </p>
                <p>
                  Fundada con la visión de modernizar la industria veterinaria, Vetify se
                  desarrolló escuchando activamente las necesidades de veterinarios, técnicos
                  y administradores de clínicas. Cada funcionalidad que construimos responde
                  a problemas reales que enfrentan las clínicas día a día.
                </p>
                <p>
                  Hoy, Vetify se posiciona como una solución integral que combina la gestión
                  de citas, historiales médicos digitales, control de inventario y mucho más,
                  todo en una plataforma diseñada específicamente para el mercado hispanohablante.
                </p>
              </Section>

              {/* Values */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Nuestros Valores</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ValueCard
                    icon={<Heart className="h-5 w-5" />}
                    title="Pasión por el Bienestar Animal"
                    description="Todo lo que hacemos está orientado a mejorar la atención veterinaria y, en última instancia, la vida de las mascotas."
                  />
                  <ValueCard
                    icon={<Zap className="h-5 w-5" />}
                    title="Simplicidad y Eficiencia"
                    description="Diseñamos herramientas intuitivas que ahorran tiempo y reducen la complejidad operativa."
                  />
                  <ValueCard
                    icon={<Shield className="h-5 w-5" />}
                    title="Seguridad y Confianza"
                    description="Protegemos los datos de nuestros usuarios con los más altos estándares de seguridad."
                  />
                  <ValueCard
                    icon={<Users className="h-5 w-5" />}
                    title="Cercanía con el Cliente"
                    description="Escuchamos activamente y construimos soluciones basadas en las necesidades reales de las clínicas."
                  />
                </div>
              </div>

              {/* Trust Signals */}
              <Section icon={<Shield className="h-5 w-5" />} title="Por Qué Confiar en Vetify">
                <div className="space-y-6 mt-6">
                  <TrustSignal
                    icon={<Lock className="h-5 w-5" />}
                    title="Seguridad de Datos"
                    description="Encriptación SSL/TLS, datos protegidos en reposo y cumplimiento con la LFPDPPP mexicana."
                  />
                  <TrustSignal
                    icon={<Clock className="h-5 w-5" />}
                    title="Alta Disponibilidad"
                    description="Infraestructura en la nube con respaldos automáticos y monitoreo continuo 24/7."
                  />
                  <TrustSignal
                    icon={<Globe className="h-5 w-5" />}
                    title="Diseñado para México"
                    description="Plataforma en español, soporte en hora local y características adaptadas al mercado mexicano."
                  />
                  <TrustSignal
                    icon={<Zap className="h-5 w-5" />}
                    title="Actualizaciones Constantes"
                    description="Mejoras continuas basadas en retroalimentación de usuarios y las últimas tecnologías."
                  />
                </div>
              </Section>

              {/* Contact CTA */}
              <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    ¿Tienes preguntas?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Nos encantaría conocer tu clínica y mostrarte cómo Vetify puede ayudarte.
                  </p>
                  <Link
                    href="/contacto"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contáctanos
                  </Link>
                </div>
              </div>

            </div>

            {/* Secondary CTA */}
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                ¿Listo para transformar tu clínica veterinaria?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/precios"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Ver Planes y Precios
                </Link>
                <Link
                  href="/funcionalidades"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-accent transition-colors"
                >
                  Explorar Funcionalidades
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
