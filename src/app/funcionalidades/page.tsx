"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FeatureShowcase, HowItWorksSection } from "@/components/marketing";
import { ChevronRight, Search, Layers, Shield, Zap, BarChart, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface DetailedFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  reverse?: boolean;
}

const DetailedFeature: React.FC<DetailedFeatureProps> = ({ 
  title, 
  description, 
  icon, 
  image, 
  reverse = false 
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-16 border-b border-gray-100 dark:border-gray-800 ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      <div className={`${reverse ? 'lg:order-2' : ''}`}>
        <div className="inline-flex items-center justify-center p-3 bg-vetify-accent-50 dark:bg-vetify-accent-900/30 rounded-xl text-vetify-accent-600 dark:text-vetify-accent-300 mb-5">
          {icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
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
    title: "Expedientes clínicos digitales",
    description: `
      <p>Mantén toda la información de tus pacientes organizada y accesible al instante:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Historial médico completo y cronológico</li>
        <li>Carga de radiografías y resultados de laboratorio</li>
        <li>Control de vacunaciones y recordatorios automáticos</li>
        <li>Registro de medicamentos y tratamientos</li>
        <li>Notas de seguimiento y planes de tratamiento</li>
      </ul>
    `,
    icon: <Search className="h-8 w-8" />,
    image: "/features/expedientes-clinicos.png",
  },
  {
    title: "Agenda inteligente",
    description: `
      <p>Optimiza tu tiempo y el de tu equipo con un sistema de citas avanzado:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Vista por día, semana o mes para múltiples doctores</li>
        <li>Recordatorios automáticos por SMS o email</li>
        <li>Reduce el número de citas perdidas hasta en un 40%</li>
        <li>Categoriza citas por tipo de servicio con códigos de color</li>
        <li>Historial de asistencia y cancelaciones por cliente</li>
      </ul>
    `,
    icon: <Layers className="h-8 w-8" />,
    image: "/features/agenda-inteligente.png",
    reverse: true,
  },
  {
    title: "Inventario y facturación integrados",
    description: `
      <p>Controla tus productos y medicamentos mientras automatizas la facturación:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Control de stock con alertas de bajo inventario</li>
        <li>Facturación electrónica CFDI integrada</li>
        <li>Catálogo de servicios y productos personalizable</li>
        <li>Reportes de ventas y rentabilidad por producto</li>
        <li>Integración con terminales de pago</li>
      </ul>
    `,
    icon: <Shield className="h-8 w-8" />,
    image: "/features/inventario-facturacion.png",
  },
  {
    title: "Reportes y analíticos",
    description: `
      <p>Toma decisiones basadas en datos con informes detallados de tu clínica:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Dashboard con métricas clave de desempeño</li>
        <li>Análisis de ingresos y servicios más solicitados</li>
        <li>Patrones de crecimiento y estacionalidad</li>
        <li>Seguimiento de rendimiento por doctor</li>
        <li>Exportación a Excel y PDF para reuniones</li>
      </ul>
    `,
    icon: <BarChart className="h-8 w-8" />,
    image: "/features/reportes-analiticos.png",
    reverse: true,
  },
  {
    title: "Portal para clientes",
    description: `
      <p>Mejora la experiencia de tus clientes y reduce llamadas con un portal dedicado:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li>Acceso al historial médico de sus mascotas</li>
        <li>Programación de citas online</li>
        <li>Recordatorios de vacunación y medicamentos</li>
        <li>Comunicación directa con el veterinario</li>
        <li>Facturas y recibos digitales</li>
      </ul>
      <p class="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">*Próximamente en el Plan Premium</p>
    `,
    icon: <Users className="h-8 w-8" />,
    image: "/features/portal-clientes.png",
  },
];

export default function Funcionalidades() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="relative min-h-screen">
      {/* Fondo */}
      <div
        className={`absolute inset-0 transition-colors duration-500 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-b from-beigeD to-grayD"
            : "bg-gradient-to-b from-beige to-white"
        }`}
      />

      {/* Contenido */}
      <div className="relative z-10">
        {/* Header */}
        <section className="relative py-16 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-vetify-accent-200 blur-3xl opacity-30 dark:opacity-10"></div>
            <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-vetify-primary-100 blur-3xl opacity-20 dark:opacity-5"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              Funcionalidades de <span className="text-vetify-accent-500 dark:text-vetify-accent-300">Vetify</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Descubre todas las herramientas que Vetify pone a tu disposición para transformar la gestión de tu clínica veterinaria
            </p>
            <div className="mt-8">
              <Link 
                href="/precios" 
                className="inline-flex items-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all"
              >
                Ver planes y precios <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
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
                Herramientas creadas para <span className="text-vetify-accent-500 dark:text-vetify-accent-300">veterinarios</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Cada funcionalidad ha sido diseñada pensando en los retos específicos de las clínicas veterinarias
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
                  reverse={feature.reverse}
                />
              ))}
            </div>

            <div className="mt-16 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-md">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  ¿Listo para transformar tu clínica?
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Prueba todas estas funcionalidades sin costo durante 14 días
                </p>
                <Link 
                  href="/registro" 
                  className="inline-flex items-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all"
                >
                  Comenzar prueba gratuita <Zap className="ml-2 h-4 w-4" />
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
} 