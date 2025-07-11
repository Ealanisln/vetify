"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useThemeAware, getThemeClass } from "@/hooks/useThemeAware";
import { Zap, MessageCircle, Shield, Package, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { FeatureShowcase, HowItWorksSection } from "@/components/marketing";

interface DetailedFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  reverse?: boolean;
  wowFactor: string;
}

const DetailedFeature: React.FC<DetailedFeatureProps> = ({ 
  title, 
  description, 
  icon, 
  image, 
  reverse = false,
  wowFactor 
}) => {
  // Determinar el color del badge basado en el título
  const getBadgeColor = (title: string) => {
    if (title.includes("Magic Vaccination")) {
      return "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-600";
    } else if (title.includes("Emergency Response")) {
      return "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-600";
    } else if (title.includes("Smart Inventory")) {
      return "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-600";
    } else if (title.includes("Recordatorios")) {
      return "bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-600";
    } else {
      return "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-600";
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-16 border-b border-gray-100 dark:border-gray-800 ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      <div className={`${reverse ? 'lg:order-2' : ''}`}>
        <div className="inline-flex items-center justify-center p-3 bg-vetify-accent-50 dark:bg-vetify-accent-900/30 rounded-xl text-vetify-accent-600 dark:text-vetify-accent-300 mb-5">
          {icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(title)}`}>
            <Zap className="h-3 w-3 mr-1" />
            {wowFactor}
          </div>
        </div>
        
        <div className="text-gray-600 dark:text-gray-300 space-y-4" dangerouslySetInnerHTML={{ __html: description }} />
      </div>
      <div className={`${reverse ? 'lg:order-1' : ''}`}>
        <div className="relative rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-2">
          <div className="absolute inset-0 bg-gradient-to-br from-vetify-primary-50/50 to-transparent dark:from-vetify-primary-900/20 z-0"></div>
          <div className="relative z-10">
            <Image
              src={image}
              alt={title}
              width={600}
              height={400}
              className="rounded-lg w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const featuresData = [
  {
    title: "Magic Vaccination Assistant",
    description: `
      <p><strong>El gancho: "Nunca más olvides una vacuna"</strong></p>
      <p>Sistema inteligente que automatiza completamente el seguimiento de vacunaciones:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Revisa automáticamente mascotas que necesitan vacuna en los próximos 7 días</li>
        <li>Envía WhatsApp automático con emoji de mascota personalizado</li>
        <li>Crea evento automático en el calendario del veterinario</li>
        <li>Pre-llena el formulario de consulta con datos del paciente</li>
        <li>Envía seguimiento automático 24 horas antes de la cita</li>
      </ul>
    `,
    icon: <MessageCircle className="h-8 w-8" />,
    image: "/features/magic-vaccination.png",
    wowFactor: "90% reducción en vacunas olvidadas",
  },
  {
    title: "Emergency Response Protocol",
    description: `
      <p><strong>El gancho: "Respuesta automática en emergencias"</strong></p>
      <p>Protocolo que se activa automáticamente con la palabra 'EMERGENCIA' en cualquier comunicación:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Alerta inmediata a todos los veterinarios disponibles</li>
        <li>Envía automáticamente instrucciones de ubicación al dueño</li>
        <li>Abre slot de emergencia en la agenda instantáneamente</li>
        <li>Prepara checklist de emergencia personalizado</li>
        <li>Inicia secuencia de seguimiento automático post-emergencia</li>
      </ul>
    `,
    icon: <Shield className="h-8 w-8" />,
    image: "/features/emergency-response.png",
    reverse: true,
    wowFactor: "Respuesta menor a 2 minutos",
  },
  {
    title: "Smart Inventory Guardian",
    description: `
      <p><strong>El gancho: "Nunca te quedes sin medicamentos críticos"</strong></p>
      <p>IA que predice necesidades de inventario y automatiza todo el proceso de compras:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Analiza patrones de uso con inteligencia artificial</li>
        <li>Genera automáticamente órdenes de compra optimizadas</li>
        <li>Encuentra los mejores precios entre proveedores</li>
        <li>Programa entregas automáticas según demanda</li>
        <li>Notifica al equipo sobre stock entrante y disponibilidad</li>
      </ul>
    `,
    icon: <Package className="h-8 w-8" />,
    image: "/features/smart-inventory.png",
    wowFactor: "30% reducción de costos + Zero stockouts",
  },
  {
    title: "Recordatorios Inteligentes",
    description: `
      <p>Comunicación proactiva que mantiene a tus clientes comprometidos y aumenta la retención:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>WhatsApp automático para citas, vacunas y medicamentos</li>
        <li>Personalización basada en el historial de cada mascota</li>
        <li>Seguimiento automático de tratamientos en curso</li>
        <li>Recordatorios de servicios preventivos por edad/raza</li>
        <li>Comunicación post-consulta para fidelización</li>
      </ul>
    `,
    icon: <Clock className="h-8 w-8" />,
    image: "/features/recordatorios-inteligentes.png",
    reverse: true,
    wowFactor: "40% aumento en retención de clientes",
  },
  {
    title: "Análisis Predictivo",
    description: `
      <p>Insights basados en datos para tomar decisiones inteligentes y hacer crecer tu clínica:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Predicción de demanda por servicios y temporadas</li>
        <li>Análisis de rentabilidad por cliente y servicio</li>
        <li>Identificación de oportunidades de crecimiento</li>
        <li>Alertas de patrones inusuales en la clínica</li>
        <li>Reportes automáticos para toma de decisiones</li>
      </ul>
    `,
    icon: <TrendingUp className="h-8 w-8" />,
    image: "/features/analisis-predictivo.png",
    wowFactor: "Decisiones basadas en datos reales",
  },
];

const FuncionalidadesPage: React.FC = () => {
  const { mounted, theme } = useThemeAware();

  // Theme-aware class helpers
  const backgroundClass = getThemeClass(
    "bg-gradient-to-b from-beige to-white",
    "bg-gradient-to-b from-beigeD to-grayD",
    mounted,
    theme
  );

  return (
    <main className="relative min-h-screen">
      <div
        className={`absolute inset-0 transition-colors duration-500 ${backgroundClass}`}
      />

      <div className="relative z-10">
        {/* Header */}
        <section className="relative py-16 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-vetify-accent-200 blur-3xl opacity-30 dark:opacity-10"></div>
            <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-vetify-primary-100 blur-3xl opacity-20 dark:opacity-5"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-vetify-accent-50 dark:bg-vetify-accent-900/30 rounded-full mb-6">
              <Zap className="h-4 w-4 text-vetify-accent-600 dark:text-vetify-accent-300 mr-2" />
              <span className="text-sm font-medium text-vetify-accent-600 dark:text-vetify-accent-300">Automatización inteligente para veterinarios</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              El CRM que <span className="text-vetify-accent-500 dark:text-vetify-accent-300">automatiza</span> tu clínica veterinaria
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <strong>Reduce 5 horas de trabajo manual por semana.</strong> Workflows inteligentes que aumentan tus ingresos 30% con recordatorios automáticos.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/registro" 
                className="inline-flex items-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all"
              >
                Probar 30 días gratis <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
              <Link 
                href="/precios" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 hover:border-vetify-accent-500 dark:hover:border-vetify-accent-400 rounded-xl text-gray-700 dark:text-gray-300 hover:text-vetify-accent-600 dark:hover:text-vetify-accent-400 font-medium transition-all"
              >
                Ver precios
              </Link>
            </div>
          </div>
        </section>

        {/* Value Props Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-vetify-primary-50 to-vetify-accent-50 dark:from-vetify-primary-900/20 dark:to-vetify-accent-900/20 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-vetify-primary-600 dark:text-vetify-primary-400 mb-2">5 horas</div>
                  <p className="text-gray-600 dark:text-gray-300">menos trabajo manual por semana</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-vetify-accent-600 dark:text-vetify-accent-400 mb-2">30%</div>
                  <p className="text-gray-600 dark:text-gray-300">aumento en ingresos promedio</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">15 min</div>
                  <p className="text-gray-600 dark:text-gray-300">setup completo sin técnicos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <FeatureShowcase />

        {/* Detailed features */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Workflows de <span className="text-vetify-accent-500 dark:text-vetify-accent-300">máximo impacto</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Cada workflow ha sido diseñado para automatizar las tareas más críticas de tu clínica veterinaria
              </p>
            </div>

            <div className="space-y-0">
              {featuresData.map((feature, index) => (
                <DetailedFeature
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  image={feature.image}
                  reverse={index % 2 !== 0}
                  wowFactor={feature.wowFactor}
                />
              ))}
            </div>

            <div className="mt-16 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-md">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  ¿Listo para automatizar tu clínica?
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Comienza con 30 días gratis. Setup en 15 minutos.
                </p>
                <Link 
                  href="/registro" 
                  className="inline-flex items-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all"
                >
                  Probar 30 días gratis <Zap className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <HowItWorksSection />
      </div>
    </main>
  );
};

export default FuncionalidadesPage; 