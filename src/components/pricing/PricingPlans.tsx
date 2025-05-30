import React, { useState } from 'react';
import { PricingPlansProps, PlanType } from './types';
import { BillingCycleToggle } from './BillingCycleToggle';
import { PricingCard } from './PricingCard';
import { FeatureComparisonTable } from './FeatureComparisonTable';
import { FAQSection } from './FAQSection';
import { MessageCircle, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

const UPDATED_PLANS = [
  {
    type: PlanType.FREE,
    name: 'GRATIS',
    description: 'Para veterinarios que quieren probar Vetify sin riesgo.',
    pricing: { 
      monthly: 0, 
      annual: 0,
      monthlyWithDiscount: 0,
      annualWithDiscount: 0
    },
    features: [
      { name: 'Mascotas', description: 'Pacientes registrados en el sistema.', free: 50, basic: 500, professional: 2000, premium: 'Ilimitado' },
      { name: 'Veterinarios', description: 'Colaboradores con acceso al sistema.', free: 1, basic: 3, professional: 8, premium: 'Ilimitado' },
      { name: 'WhatsApp Básico', description: 'Mensajes automáticos limitados.', free: '50/mes', basic: 'Completo', professional: 'Completo', premium: 'Completo' },
      { name: 'Soporte', description: 'Ayuda y asistencia técnica.', free: 'Comunidad', basic: 'Email', professional: 'Prioritario', premium: '24/7' },
      { name: 'Reportes', description: 'Informes y métricas de la clínica.', free: 'Básicos', basic: 'Básicos', professional: 'Avanzados', premium: 'Completos' },
      { name: 'Inventario', description: 'Control de stock de productos.', free: false, basic: 'Básico', professional: true, premium: true },
      { name: 'Multi-sucursal', description: 'Gestionar múltiples ubicaciones.', free: false, basic: false, professional: true, premium: true },
      { name: 'API Completa', description: 'Integración con otros sistemas.', free: false, basic: false, professional: false, premium: true },
    ],
    recommended: false,
    badge: 'GRATIS',
  },
  {
    type: PlanType.BASIC,
    name: 'BÁSICO',
    description: 'Ideal para clínicas pequeñas con automatización completa.',
    pricing: { 
      monthly: 1299, 
      annual: 1039, // 20% discount
      monthlyWithDiscount: 974, // 25% off launch discount
      annualWithDiscount: 675 // 35% off launch discount
    },
    features: [
      { name: 'Mascotas', description: 'Pacientes registrados en el sistema.', free: 50, basic: 500, professional: 2000, premium: 'Ilimitado' },
      { name: 'Veterinarios', description: 'Colaboradores con acceso al sistema.', free: 1, basic: 3, professional: 8, premium: 'Ilimitado' },
      { name: 'Automatización Completa', description: 'WhatsApp y recordatorios automáticos.', free: false, basic: true, professional: true, premium: true },
      { name: 'Inventario Básico', description: 'Control de stock de productos.', free: false, basic: true, professional: true, premium: true },
      { name: 'Soporte Email', description: 'Asistencia técnica por correo.', free: false, basic: true, professional: true, premium: true },
      { name: 'Facturación Mexicana', description: 'Cumplimiento fiscal automático.', free: false, basic: true, professional: true, premium: true },
      { name: 'Multi-sucursal', description: 'Gestionar múltiples ubicaciones.', free: false, basic: false, professional: true, premium: true },
      { name: 'Reportes Avanzados', description: 'Analytics y métricas detalladas.', free: false, basic: false, professional: true, premium: true },
    ],
    recommended: true,
    isPopular: true,
  },
  {
    type: PlanType.PROFESSIONAL,
    name: 'PROFESIONAL',
    description: 'Perfecto para clínicas en crecimiento con equipos grandes.',
    pricing: { 
      monthly: 2599, 
      annual: 2079, // 20% discount
      monthlyWithDiscount: 1949, // 25% off launch discount
      annualWithDiscount: 1351 // 35% off launch discount
    },
    features: [
      { name: 'Mascotas', description: 'Pacientes registrados en el sistema.', free: 50, basic: 500, professional: 2000, premium: 'Ilimitado' },
      { name: 'Veterinarios', description: 'Colaboradores con acceso al sistema.', free: 1, basic: 3, professional: 8, premium: 'Ilimitado' },
      { name: 'Reportes Avanzados', description: 'Analytics y métricas detalladas.', free: false, basic: false, professional: true, premium: true },
      { name: 'Multi-sucursal', description: 'Gestionar múltiples ubicaciones.', free: false, basic: false, professional: true, premium: true },
      { name: 'Reportes Fiscales', description: 'Informes para contabilidad.', free: false, basic: false, professional: true, premium: true },
      { name: 'Soporte Prioritario', description: 'Atención más rápida.', free: false, basic: false, professional: true, premium: true },
      { name: 'Capacitación Incluida', description: 'Training para tu equipo.', free: false, basic: false, professional: true, premium: true },
      { name: 'API Completa', description: 'Integración con otros sistemas.', free: false, basic: false, professional: true, premium: true },
    ],
    recommended: false,
  },
];

export const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Launch Discount Banner */}
      <div className="relative overflow-hidden mb-10 md:mb-14 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10 z-10"></div>
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-pink-500 rounded-full opacity-20"></div>
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-400 rounded-full opacity-20"></div>
        <div className="relative z-20 px-6 py-8 md:py-10 text-center">
          <div className="inline-block px-4 py-1 mb-3 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            🚀 ¡OFERTA DE LANZAMIENTO!
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            El primer CRM veterinario con WhatsApp automático
          </h3>
          <p className="text-lg text-blue-100 mb-4 max-w-2xl mx-auto">
            Ahorra hasta 35% en planes anuales o 25% en pago mensual. Solo por tiempo limitado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-white text-sm">
            <div className="flex items-center">
              <span className="bg-green-500 rounded-full w-2 h-2 mr-2"></span>
              <span>35% OFF en planes anuales</span>
            </div>
            <div className="flex items-center">
              <span className="bg-yellow-400 rounded-full w-2 h-2 mr-2"></span>
              <span>25% OFF en pago mensual</span>
            </div>
            <div className="flex items-center">
              <span className="bg-blue-400 rounded-full w-2 h-2 mr-2"></span>
              <span>Sin permanencia mínima</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Planes diseñados para tu clínica
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Desde el plan gratuito hasta soluciones empresariales. <span className="font-semibold text-blue-600 dark:text-blue-400">Setup en 15 minutos</span> vs 6 semanas de la competencia.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <BillingCycleToggle
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {UPDATED_PLANS.map((plan) => (
          <PricingCard
            key={plan.type}
            plan={plan}
            billingCycle={billingCycle}
            onSelectPlan={onSelectPlan}
          />
        ))}
        
        {/* Enterprise Contact Card */}
        <div className="relative flex flex-col h-full p-6 overflow-hidden rounded-2xl border-2 border-purple-300 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:shadow-xl transition-all duration-300">
          {/* Badge */}
          <div className="absolute top-0 right-0 mt-4 mr-4 z-10">
            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
              EMPRESARIAL
            </span>
          </div>

          {/* Plan Header */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                PREMIUM
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Para clínicas grandes que necesitan todo el poder de Vetify con soluciones personalizadas.
              </p>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  Cotización
                </span>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Precio personalizado según tus necesidades
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mascotas ilimitadas</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Equipos grandes</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sin marca Vetify</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Soporte 24/7</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Manager dedicado</span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                +Desarrollo personalizado
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-auto">
            <Link
              href="/contacto"
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl text-center block"
            >
              Solicitar Cotización
            </Link>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Respuesta en 24 horas
            </p>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <FeatureComparisonTable plans={UPDATED_PLANS} />

      {/* Contact Section for Enterprise */}
      <div className="mt-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold mb-4">¿Necesitas una solución empresarial?</h3>
          <p className="text-purple-100 text-lg max-w-3xl mx-auto">
            Para clínicas con más de 8 veterinarios o necesidades específicas, creamos una solución personalizada.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/10 rounded-xl p-6">
            <Phone className="h-8 w-8 mx-auto mb-3" />
            <div className="font-semibold mb-2">Llámanos</div>
            <div className="text-sm text-purple-100">+52 55 1234 5678</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <Mail className="h-8 w-8 mx-auto mb-3" />
            <div className="font-semibold mb-2">Escríbenos</div>
            <div className="text-sm text-purple-100">ventas@vetify.mx</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <MessageCircle className="h-8 w-8 mx-auto mb-3" />
            <div className="font-semibold mb-2">WhatsApp</div>
            <div className="text-sm text-purple-100">+52 55 9876 5432</div>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <Link
            href="/contacto"
            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            Agendar llamada gratuita
          </Link>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection />
      
      {/* Trust Section */}
      <div className="mt-16 text-center">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Por qué elegir Vetify?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">50%</div>
              <div className="text-gray-600 dark:text-gray-300">Más barato que VetPraxis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">15min</div>
              <div className="text-gray-600 dark:text-gray-300">Setup vs 6 semanas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-300">Soporte en español</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 