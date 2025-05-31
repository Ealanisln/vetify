import React from 'react';
import { ChevronRight, MessageCircle, Shield, Package, Zap, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  wowFactor: string;
  benefits: string[];
  badgeColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, accent, wowFactor, benefits, badgeColor }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all group">
      <div className={`p-3 rounded-lg mb-4 inline-flex w-fit ${accent} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
      
      <div className="mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
          <Zap className="h-3 w-3 mr-1" />
          {wowFactor}
        </div>
      </div>

      <ul className="space-y-2 flex-grow">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
            <div className="w-1.5 h-1.5 rounded-full bg-vetify-accent-500 mt-2 mr-2 flex-shrink-0"></div>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
};

const workflows = [
  {
    icon: <MessageCircle className="h-6 w-6 text-green-600" />,
    title: "Magic Vaccination Assistant",
    description: "El gancho: \"Nunca más olvides una vacuna\". Sistema inteligente que automatiza completamente el seguimiento de vacunaciones.",
    accent: "bg-green-50 dark:bg-green-900/20",
    wowFactor: "90% reducción en vacunas olvidadas",
    badgeColor: "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-600",
    benefits: [
      "Revisa mascotas que necesitan vacuna en los próximos 7 días",
      "Envía WhatsApp automático con emoji de mascota",
      "Crea evento en calendario del veterinario",
      "Pre-llena formulario de consulta",
      "Seguimiento 24h antes de la cita"
    ],
  },
  {
    icon: <Shield className="h-6 w-6 text-red-600" />,
    title: "Emergency Response Protocol",
    description: "El gancho: \"Respuesta automática en emergencias\". Protocolo que se activa con la palabra 'EMERGENCIA' en cualquier comunicación.",
    accent: "bg-red-50 dark:bg-red-900/20",
    wowFactor: "Respuesta menor a 2 minutos",
    badgeColor: "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-600",
    benefits: [
      "Alerta inmediata a todos los veterinarios disponibles",
      "Envía instrucciones de ubicación al dueño",
      "Abre slot de emergencia en agenda",
      "Prepara checklist de emergencia",
      "Inicia secuencia de seguimiento automático"
    ],
  },
  {
    icon: <Package className="h-6 w-6 text-blue-600" />,
    title: "Smart Inventory Guardian",
    description: "El gancho: \"Nunca te quedes sin medicamentos críticos\". IA que predice necesidades de inventario y automatiza compras.",
    accent: "bg-blue-50 dark:bg-blue-900/20",
    wowFactor: "30% reducción de costos",
    badgeColor: "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-600",
    benefits: [
      "Analiza patrones de uso con IA",
      "Genera orden de compra automática",
      "Encuentra mejores precios de proveedores",
      "Programa entrega automática",
      "Notifica al equipo sobre stock entrante"
    ],
  },
];

const additionalFeatures = [
  {
    icon: <Clock className="h-5 w-5 text-purple-600" />,
    title: "Recordatorios Inteligentes",
    description: "Comunicación proactiva que mantiene a tus clientes comprometidos",
    accent: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
    title: "Análisis Predictivo",
    description: "Insights basados en datos para hacer crecer tu clínica",
    accent: "bg-amber-50 dark:bg-amber-900/20",
  },
];

export const FeatureShowcase: React.FC = () => {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-vetify-accent-100 blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-vetify-primary-100 blur-3xl opacity-20 dark:opacity-5"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-vetify-accent-50 dark:bg-vetify-accent-900/30 rounded-full mb-6">
            <Zap className="h-4 w-4 text-vetify-accent-600 dark:text-vetify-accent-300 mr-2" />
            <span className="text-sm font-medium text-vetify-accent-600 dark:text-vetify-accent-300">Workflows de máximo impacto</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Los 3 workflows que <span className="text-vetify-accent-500 dark:text-vetify-accent-300">transformarán</span> tu clínica
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            <strong>Aumenta tus ingresos 30% con recordatorios automáticos.</strong> Automatización inteligente diseñada por veterinarios para veterinarios.
          </p>
        </div>

        {/* Main MVP Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {workflows.map((workflow, index) => (
            <FeatureCard
              key={index}
              icon={workflow.icon}
              title={workflow.title}
              description={workflow.description}
              accent={workflow.accent}
              wowFactor={workflow.wowFactor}
              benefits={workflow.benefits}
              badgeColor={workflow.badgeColor}
            />
          ))}
        </div>

        {/* Value Props Section */}
        <div className="bg-gradient-to-r from-vetify-primary-50 to-vetify-accent-50 dark:from-vetify-primary-900/20 dark:to-vetify-accent-900/20 rounded-2xl p-8 mb-16">
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

        {/* Additional Features */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Y mucho más para hacer crecer tu clínica
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="flex items-start p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className={`p-2 rounded-lg mr-4 ${feature.accent}`}>
                {feature.icon}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{feature.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Listo para automatizar tu clínica?
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Comienza GRATIS hoy. Sin tarjeta de crédito. Setup en 15 minutos.
            </p>
            <Link href="/registro" className="inline-flex items-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all mr-4">
              Comenzar GRATIS <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/precios" className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 hover:border-vetify-accent-500 dark:hover:border-vetify-accent-400 rounded-xl text-gray-700 dark:text-gray-300 hover:text-vetify-accent-600 dark:hover:text-vetify-accent-400 font-medium transition-all">
              Ver precios
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase; 