"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useThemeAware, getThemeClass } from '../../hooks/useThemeAware';
import { Zap, MessageCircle, Shield, Package, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { FeatureShowcase, HowItWorksSection } from '../../components/marketing';

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
    title: "Gestión Completa de Citas",
    description: `
      <p><strong>Organiza y controla todas las citas de tu clínica</strong></p>
      <p>Sistema completo para programar y gestionar las citas de tus pacientes:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Calendario visual con todas las citas programadas</li>
        <li>Múltiples estados: programada, confirmada, en progreso, completada</li>
        <li>Asignación de veterinarios y personal a cada cita</li>
        <li>Duración personalizable según tipo de consulta</li>
        <li>Notas y razón de consulta para cada cita</li>
      </ul>
    `,
    icon: <MessageCircle className="h-8 w-8" />,
    image: "/features/magic-vaccination.png",
    wowFactor: "Agenda ilimitada con calendario integrado",
  },
  {
    title: "Historiales Médicos Completos",
    description: `
      <p><strong>Registro detallado de la salud de cada mascota</strong></p>
      <p>Mantén un historial médico completo de cada paciente:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Registro de consultas con diagnóstico y tratamiento</li>
        <li>Control de vacunaciones por etapa (cachorro, adulto, senior)</li>
        <li>Seguimiento de desparasitaciones internas y externas</li>
        <li>Historial de medicamentos y prescripciones detallado</li>
        <li>Calendario de próximos tratamientos programados</li>
      </ul>
    `,
    icon: <Shield className="h-8 w-8" />,
    image: "/features/emergency-response.png",
    reverse: true,
    wowFactor: "Historial completo de cada paciente",
  },
  {
    title: "Control de Inventario y Ventas",
    description: `
      <p><strong>Gestiona tu inventario y registra todas las ventas</strong></p>
      <p>Control completo de medicamentos, productos y ventas:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Inventario de medicamentos, vacunas y productos veterinarios</li>
        <li>Alertas de stock mínimo y productos próximos a vencer</li>
        <li>Registro de ventas con múltiples métodos de pago</li>
        <li>Caja registradora con apertura y cierre de turno</li>
        <li>Historial completo de movimientos de inventario</li>
      </ul>
    `,
    icon: <Package className="h-8 w-8" />,
    image: "/features/smart-inventory.png",
    wowFactor: "Control completo de stock y ventas",
  },
  {
    title: "Sistema de Recordatorios",
    description: `
      <p><strong>Gestiona recordatorios para mantener a tus clientes informados</strong></p>
      <p>Crea y administra recordatorios para citas, vacunas y tratamientos:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Recordatorios de citas programadas</li>
        <li>Seguimiento de vacunas y tratamientos pendientes</li>
        <li>Recordatorios personalizados por mascota</li>
        <li>Historial de recordatorios enviados</li>
        <li>Estados de recordatorios: pendiente, enviado, completado</li>
      </ul>
    `,
    icon: <Clock className="h-8 w-8" />,
    image: "/features/recordatorios-inteligentes.png",
    reverse: true,
    wowFactor: "Seguimiento completo de tratamientos",
  },
  {
    title: "Gestión de Clientes y Mascotas",
    description: `
      <p><strong>Base de datos completa de tus clientes y sus mascotas</strong></p>
      <p>Administra toda la información de clientes y pacientes:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Registro completo de clientes con datos de contacto</li>
        <li>Fichas detalladas de cada mascota con raza, edad y peso</li>
        <li>Historial de consultas y tratamientos por mascota</li>
        <li>Búsqueda rápida de clientes y mascotas</li>
        <li>Notas y preferencias de contacto por cliente</li>
      </ul>
    `,
    icon: <TrendingUp className="h-8 w-8" />,
    image: "/features/analisis-predictivo.png",
    wowFactor: "Base de datos completa y organizada",
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
              <span className="text-sm font-medium text-vetify-accent-600 dark:text-vetify-accent-300">Sistema completo de gestión veterinaria</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              El CRM <span className="text-vetify-accent-500 dark:text-vetify-accent-300">completo</span> para tu clínica veterinaria
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <strong>Gestiona toda tu clínica en un solo lugar.</strong> Citas, historiales médicos, inventario, ventas y mucho más en una plataforma profesional.
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
                  <div className="text-3xl font-bold text-vetify-primary-600 dark:text-vetify-primary-400 mb-2">Todo en uno</div>
                  <p className="text-gray-600 dark:text-gray-300">Gestión completa de tu clínica</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-vetify-accent-600 dark:text-vetify-accent-400 mb-2">Multi-clínica</div>
                  <p className="text-gray-600 dark:text-gray-300">Múltiples sucursales en una cuenta</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">30 días gratis</div>
                  <p className="text-gray-600 dark:text-gray-300">Prueba sin compromiso</p>
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
                Funcionalidades <span className="text-vetify-accent-500 dark:text-vetify-accent-300">completas</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Todo lo que necesitas para administrar tu clínica veterinaria de manera profesional
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
                  ¿Listo para organizar tu clínica?
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Comienza con 30 días gratis. Sin tarjeta de crédito.
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