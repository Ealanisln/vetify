"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FeatureShowcase, HowItWorksSection } from "@/components/marketing";
import { ChevronRight, MessageCircle, Zap, BarChart, Users, Clock, Shield, Workflow, Database, Bell, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface DetailedFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  reverse?: boolean;
  highlight?: boolean;
}

const DetailedFeature: React.FC<DetailedFeatureProps> = ({ 
  title, 
  description, 
  icon, 
  image, 
  reverse = false,
  highlight = false
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-16 border-b border-gray-100 dark:border-gray-800 ${reverse ? 'lg:flex-row-reverse' : ''} ${highlight ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl px-8' : ''}`}>
      <div className={`${reverse ? 'lg:order-2' : ''}`}>
        <div className={`inline-flex items-center justify-center p-3 ${highlight ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-vetify-accent-50 dark:bg-vetify-accent-900/30'} rounded-xl ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-vetify-accent-600 dark:text-vetify-accent-300'} mb-5`}>
          {icon}
        </div>
        {highlight && (
          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-semibold mb-4">
            🚀 EXCLUSIVO DE VETIFY
          </div>
        )}
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="text-gray-600 dark:text-gray-300 space-y-4" dangerouslySetInnerHTML={{ __html: description }} />
      </div>
      <div className={`${reverse ? 'lg:order-1' : ''}`}>
        <div className="relative rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-2">
          <div className={`absolute inset-0 ${highlight ? 'bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20' : 'bg-gradient-to-br from-vetify-primary-50/50 to-transparent dark:from-vetify-primary-900/20'} z-0`}></div>
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
    title: "WhatsApp Automático Nativo",
    description: `
      <p class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">¡La función que vuela la cabeza de los veterinarios! 🤯</p>
      <p>Automatización de WhatsApp que ningún competidor mexicano puede igualar:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li><strong>Mensajes automáticos al registrar mascotas</strong> - Impresiona a los dueños desde el primer contacto</li>
        <li><strong>Recordatorios de citas y vacunas</strong> - Reduce el 40% de citas perdidas</li>
        <li><strong>Seguimiento post-consulta</strong> - Aumenta la satisfacción del cliente</li>
        <li><strong>Comunicación bidireccional</strong> - Los dueños pueden responder directamente</li>
        <li><strong>Plantillas personalizables</strong> - Adapta los mensajes al tono de tu clínica</li>
      </ul>
      <p class="mt-4 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg">
        💡 <strong>Setup en 15 minutos</strong> vs 6+ semanas de VetPraxis, easyVet y VetCloud
      </p>
    `,
    icon: <MessageCircle className="h-8 w-8" />,
    image: "/features/whatsapp-automation.png",
    highlight: true,
  },
  {
    title: "Automatización Avanzada con n8n",
    description: `
      <p>Conecta Vetify con más de 400+ servicios y automatiza cualquier proceso:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li><strong>Integración con WhatsApp Business API</strong> - Mensajería masiva y personalizada</li>
        <li><strong>Conexión con email marketing</strong> - Mailchimp, SendGrid, Gmail automático</li>
        <li><strong>SMS automáticos</strong> - Twilio, Vonage para recordatorios críticos</li>
        <li><strong>Sincronización con Google Calendar</strong> - Citas automáticas en calendarios</li>
        <li><strong>Webhooks personalizados</strong> - Conecta con cualquier sistema existente</li>
        <li><strong>Reportes automáticos</strong> - Envío programado de métricas por email</li>
      </ul>
      <p class="mt-4 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 p-3 rounded-lg">
        🔌 <strong>API Completa disponible</strong> - Incluida en Plan PROFESIONAL y PREMIUM
      </p>
    `,
    icon: <Workflow className="h-8 w-8" />,
    image: "/features/n8n-automation.png",
    reverse: true,
    highlight: true,
  },
  {
    title: "Expedientes Clínicos Inteligentes",
    description: `
      <p>Sistema de historiales médicos más avanzado que la competencia mexicana:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li><strong>Historial médico cronológico</strong> - Timeline completo del paciente</li>
        <li><strong>Carga de imágenes y documentos</strong> - Radiografías, análisis, recetas</li>
        <li><strong>Control de vacunaciones automático</strong> - Recordatorios inteligentes</li>
        <li><strong>Plantillas de consulta</strong> - Acelera el registro de información</li>
        <li><strong>Búsqueda inteligente</strong> - Encuentra cualquier dato en segundos</li>
        <li><strong>Backup automático en la nube</strong> - Nunca pierdas información</li>
      </ul>
    `,
    icon: <Database className="h-8 w-8" />,
    image: "/features/expedientes-clinicos.png",
  },
  {
    title: "Agenda y Notificaciones Inteligentes",
    description: `
      <p>Sistema de citas que reduce no-shows y optimiza tu tiempo:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li><strong>Vista multi-doctor</strong> - Gestiona equipos grandes fácilmente</li>
        <li><strong>Recordatorios automáticos multi-canal</strong> - WhatsApp, SMS, Email</li>
        <li><strong>Confirmaciones automáticas</strong> - Los clientes confirman con un click</li>
        <li><strong>Lista de espera inteligente</strong> - Llena huecos automáticamente</li>
        <li><strong>Tiempo estimado por servicio</strong> - Optimiza la programación</li>
        <li><strong>Sincronización con Google Calendar</strong> - Acceso desde cualquier dispositivo</li>
      </ul>
    `,
    icon: <Clock className="h-8 w-8" />,
    image: "/features/agenda-inteligente.png",
    reverse: true,
  },
  {
    title: "Facturación CFDI y Control de Inventario",
    description: `
      <p>Cumplimiento fiscal automático y control total de tu inventario:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li><strong>Facturación electrónica CFDI automática</strong> - Cumple con SAT sin complicaciones</li>
        <li><strong>Control de stock inteligente</strong> - Alertas de bajo inventario</li>
        <li><strong>Códigos de barras</strong> - Escaneo rápido de productos</li>
        <li><strong>Precios por cliente</strong> - Descuentos automáticos y promociones</li>
        <li><strong>Reportes fiscales</strong> - Listos para tu contador</li>
        <li><strong>Integración con terminales de pago</strong> - Cobra con tarjeta directamente</li>
      </ul>
    `,
    icon: <Shield className="h-8 w-8" />,
    image: "/features/inventario-facturacion.png",
  },
  {
    title: "Análisis y Reportes Avanzados",
    description: `
      <p>Métricas que te ayudan a tomar mejores decisiones para tu clínica:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li><strong>Dashboard en tiempo real</strong> - KPIs clave de tu clínica</li>
        <li><strong>Análisis de rentabilidad</strong> - Por servicio, doctor y período</li>
        <li><strong>Predicciones de ingresos</strong> - Basadas en históricos</li>
        <li><strong>Reportes de satisfacción</strong> - Feedback automático de clientes</li>
        <li><strong>Benchmarks de la industria</strong> - Compárate con otras clínicas</li>
        <li><strong>Exportación avanzada</strong> - Excel, PDF, y APIs para contadores</li>
      </ul>
    `,
    icon: <BarChart className="h-8 w-8" />,
    image: "/features/reportes-analiticos.png",
    reverse: true,
  },
  {
    title: "Portal de Clientes y Comunicación",
    description: `
      <p>Mejora la experiencia del cliente y reduce llamadas administrativas:</p>
      <ul class="list-disc list-inside mt-3 space-y-2">
        <li><strong>App móvil para clientes</strong> - Acceso 24/7 a información de mascotas</li>
        <li><strong>Reserva de citas online</strong> - Los clientes pueden agendar solos</li>
        <li><strong>Historial médico compartido</strong> - Transparencia total con los dueños</li>
        <li><strong>Chat directo con el veterinario</strong> - Consultas rápidas por WhatsApp</li>
        <li><strong>Recordatorios personalizados</strong> - Por WhatsApp, email y push notifications</li>
        <li><strong>Facturación digital</strong> - Recibos automáticos por WhatsApp</li>
      </ul>
      <p class="mt-4 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg">
        📱 <strong>Disponible en Plan PROFESIONAL y PREMIUM</strong>
      </p>
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
      {/* Enhanced Background */}
      <div
        className={`absolute inset-0 transition-colors duration-500 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      />

      {/* Background Decorations */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-gradient-to-r from-green-400 to-blue-500 blur-3xl opacity-15 dark:opacity-5"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 blur-3xl opacity-15 dark:opacity-5"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <section className="relative py-16 lg:py-20 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* New badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full mb-6 border border-green-200 dark:border-green-700">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                🚀 EL CRM VETERINARIO MÁS AVANZADO DE MÉXICO
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              Funcionalidades que{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                la competencia
              </span>{' '}
              no tiene
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Descubre por qué <strong>500+ veterinarios</strong> eligieron Vetify sobre VetPraxis, easyVet y VetCloud. 
              <span className="font-semibold text-gray-900 dark:text-white"> WhatsApp automático incluido.</span>
            </p>

            {/* Key Stats */}
            <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center items-center text-sm">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">WhatsApp nativo (único en México)</span>
              </div>
              <div className="flex items-center">
                <Workflow className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">400+ integraciones con n8n</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Setup 15 min vs 6+ semanas</span>
              </div>
            </div>

            <div className="mt-8">
              <Link 
                href="/precios" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Ver planes con descuento <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Competitive Advantage Banner */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">🔥 Lo que nos diferencia de VetPraxis, easyVet y VetCloud</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-3xl font-bold">50%</div>
                  <div className="text-sm">Más barato</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">15min</div>
                  <div className="text-sm">Setup vs 6+ semanas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-sm">WhatsApp automático</div>
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
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Funcionalidades <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">exclusivas</span> de Vetify
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Cada herramienta está diseñada para que tu clínica sea más eficiente y rentable que con cualquier otro software veterinario mexicano
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
                  highlight={feature.highlight}
                />
              ))}
            </div>

            {/* n8n Integration Showcase */}
            <div className="mt-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4">🔌 Integraciones Ilimitadas con n8n</h3>
                <p className="text-purple-100 text-lg max-w-3xl mx-auto">
                  Conecta Vetify con más de 400 servicios. Automatiza cualquier proceso que imagines.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="bg-white/10 rounded-xl p-4">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-semibold">WhatsApp Business</div>
                  <div className="text-sm text-purple-100">API oficial</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <Globe className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-semibold">Google Calendar</div>
                  <div className="text-sm text-purple-100">Sync automático</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <Bell className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-semibold">Email Marketing</div>
                  <div className="text-sm text-purple-100">Mailchimp, SendGrid</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <Workflow className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-semibold">Webhooks</div>
                  <div className="text-sm text-purple-100">API personalizada</div>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-purple-100 text-sm">
                  Disponible en Plan PROFESIONAL y PREMIUM • Sin costo adicional
                </p>
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-16 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  ¿Listo para tener la clínica más moderna de México?
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Únete a los 500+ veterinarios que ya eligieron Vetify. <strong>Setup en 15 minutos.</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/registro" 
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Probar GRATIS <Zap className="ml-2 h-5 w-5" />
                  </Link>
                  <Link 
                    href="/precios" 
                    className="inline-flex items-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                  >
                    Ver precios con descuento
                  </Link>
                </div>
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