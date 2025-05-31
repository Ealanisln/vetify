"use client";

import { useState } from 'react';
import { Check, Star, Zap, Users, Building, Crown } from 'lucide-react';
import { useTheme } from "next-themes";

interface PricingFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthlyPrice?: number;
  originalYearlyPrice?: number;
  badge?: string;
  badgeColor?: string;
  features: PricingFeature[];
  cta: string;
  popular?: boolean;
  icon: React.ReactNode;
}

const PricingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { resolvedTheme } = useTheme();

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Plan Gratis',
      description: 'Ideal para veterinarios independientes o consultorios muy pequeños.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      badge: 'GRATIS',
      badgeColor: 'bg-vetify-success',
      icon: <Star className="h-6 w-6" />,
      features: [
        { name: 'Mascotas Activas: 50', included: true, highlight: true },
        { name: 'Usuarios Veterinarios: 1', included: true },
        { name: 'WhatsApp Básico: 50 msg/mes', included: true, highlight: true },
        { name: 'Soporte: Soporte comunidad', included: true },
        { name: 'Expedientes básicos', included: true },
        { name: 'Citas básicas', included: true },
        { name: 'Automatización', included: false },
        { name: 'Inventario', included: false },
        { name: 'Reportes avanzados', included: false },
        { name: 'Multi-sucursal', included: false },
      ],
      cta: 'Comenzar Gratis',
    },
    {
      id: 'basic',
      name: 'Plan Básico',
      description: 'Ideal para clínicas pequeñas o que recién comienzan.',
      monthlyPrice: 674,
      yearlyPrice: 449,
      originalMonthlyPrice: 899,
      originalYearlyPrice: 599,
      badge: 'BÁSICO',
      badgeColor: 'bg-vetify-primary-500',
      icon: <Users className="h-6 w-6" />,
      features: [
        { name: 'Mascotas Activas: 500', included: true, highlight: true },
        { name: 'Usuarios Veterinarios: 3', included: true },
        { name: 'Automatización: Automatización completa', included: true, highlight: true },
        { name: 'Inventario: Inventario básico', included: true, highlight: true },
        { name: 'WhatsApp ilimitado', included: true },
        { name: 'Expedientes completos', included: true },
        { name: 'Citas avanzadas', included: true },
        { name: 'Soporte por email', included: true },
        { name: 'Reportes básicos', included: true },
        { name: 'Multi-sucursal', included: false },
      ],
      cta: 'Elegir Plan',
    },
    {
      id: 'professional',
      name: 'Plan Profesional',
      description: 'Perfecto para clínicas establecidas con múltiples veterinarios.',
      monthlyPrice: 1349,
      yearlyPrice: 749,
      originalMonthlyPrice: 1799,
      originalYearlyPrice: 999,
      badge: 'MÁS POPULAR',
      badgeColor: 'bg-vetify-accent-500',
      popular: true,
      icon: <Building className="h-6 w-6" />,
      features: [
        { name: 'Mascotas Activas: 2000', included: true, highlight: true },
        { name: 'Usuarios Veterinarios: 8', included: true },
        { name: 'Reportes Avanzados: Reportes avanzados', included: true, highlight: true },
        { name: 'Multi-sucursal: Multi-sucursal', included: true, highlight: true },
        { name: 'Todo del plan Básico', included: true },
        { name: 'Automatización avanzada', included: true },
        { name: 'Inventario completo', included: true },
        { name: 'Analytics y métricas', included: true },
        { name: 'Soporte prioritario', included: true },
        { name: 'Integraciones avanzadas', included: true },
      ],
      cta: 'Elegir Plan',
    },
    {
      id: 'enterprise',
      name: 'Plan Corporativo',
      description: 'Para grandes clínicas y cadenas veterinarias que necesitan máxima funcionalidad.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      badge: 'CORPORATIVO',
      badgeColor: 'bg-vetify-slate-500',
      icon: <Crown className="h-6 w-6" />,
      features: [
        { name: 'Mascotas Activas: Ilimitado', included: true, highlight: true },
        { name: 'Equipos Grandes: Equipos grandes', included: true, highlight: true },
        { name: 'API Completa: API completa', included: true, highlight: true },
        { name: 'Sin Marca: Sin marca', included: true, highlight: true },
        { name: 'Todo de planes anteriores', included: true },
        { name: 'Soporte 24/7', included: true },
        { name: 'Implementación personalizada', included: true },
        { name: 'Capacitación incluida', included: true },
        { name: 'SLA garantizado', included: true },
        { name: 'Desarrollo a medida', included: true },
      ],
      cta: 'Contactar Ventas',
    },
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      window.location.href = '/sign-up';
    } else if (planId === 'enterprise') {
      window.location.href = '/contacto';
    } else {
      window.location.href = `/sign-up?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Fondo */}
      <div
        className={`absolute inset-0 transition-colors duration-500 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-b from-vetify-primary-900/20 to-vetify-slate-900"
            : "bg-gradient-to-b from-vetify-primary-50 to-white"
        }`}
      />

      {/* Decoración de fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-vetify-accent-200 blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-vetify-blush-100 blur-3xl opacity-20 dark:opacity-5"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-vetify-primary-100 blur-3xl opacity-20 dark:opacity-5"></div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-vetify-blush-50 dark:bg-vetify-blush-900/30 rounded-full mb-6">
            <Zap className="h-4 w-4 text-vetify-blush-600 dark:text-vetify-blush-300 mr-2" />
            <span className="text-sm font-medium text-vetify-blush-600 dark:text-vetify-blush-300">¡Oferta de lanzamiento!</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Planes que se adaptan a tu <span className="text-vetify-accent-500 dark:text-vetify-accent-300">clínica</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Desde veterinarios independientes hasta grandes cadenas. Encuentra el plan perfecto para automatizar tu clínica veterinaria.
          </p>

          {/* Oferta especial */}
          <div className="bg-gradient-to-r from-vetify-blush-500 to-vetify-accent-500 text-white rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 mr-2" />
              <span className="font-bold text-lg">25% de DESCUENTO en todos los planes</span>
            </div>
            <p className="text-sm opacity-90">Aprovecha esta oferta por tiempo limitado y comienza a transformar tu clínica veterinaria</p>
            <p className="text-xs mt-2 font-medium">Termina en 30 días</p>
          </div>

          {/* Toggle anual/mensual */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Mensual
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-vetify-accent-500 focus:ring-offset-2 ${
                isYearly ? 'bg-vetify-accent-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Anual
            </span>
            {isYearly && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-vetify-success text-white">
                Ahorra 25%
              </span>
            )}
          </div>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'ring-2 ring-vetify-accent-500 shadow-2xl'
                  : 'shadow-card hover:shadow-card-hover'
              } ${
                resolvedTheme === "dark"
                  ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                  : "bg-white border border-gray-100"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                {/* Icono y nombre */}
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg ${plan.badgeColor} text-white mr-3`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">{plan.description}</p>

                {/* Precio */}
                <div className="mb-6">
                  {plan.id === 'enterprise' ? (
                    <div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">Cotización</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Personalizada</div>
                    </div>
                  ) : plan.id === 'free' ? (
                    <div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">Gratis</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Para siempre</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">MXN</span>
                      </div>
                      {(plan.originalMonthlyPrice || plan.originalYearlyPrice) && (
                        <div className="flex items-center mt-1">
                          <span className="text-lg text-gray-400 dark:text-gray-500 line-through mr-2">
                            ${isYearly ? plan.originalYearlyPrice : plan.originalMonthlyPrice} MXN
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        /mes {isYearly && 'facturado anualmente'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Características */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="flex-shrink-0">
                        {feature.included ? (
                          <Check className={`h-4 w-4 mt-0.5 ${feature.highlight ? 'text-vetify-accent-500' : 'text-vetify-success'}`} />
                        ) : (
                          <div className="h-4 w-4 mt-0.5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        )}
                      </div>
                      <span className={`ml-3 text-sm ${
                        feature.included 
                          ? feature.highlight 
                            ? 'text-gray-900 dark:text-white font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-vetify-accent-500 hover:bg-vetify-accent-600 text-white shadow-lg hover:shadow-xl'
                      : plan.id === 'free'
                      ? 'bg-vetify-success hover:bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.cta}
                </button>

                {plan.id === 'free' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    No se requiere tarjeta de crédito
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comparación detallada */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Comparación detallada de características
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Encuentra exactamente lo que necesitas para tu clínica
            </p>
          </div>

          <div className={`rounded-2xl overflow-hidden ${
            resolvedTheme === "dark"
              ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
              : "bg-white border border-gray-100"
          } shadow-card`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Características
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      Gratis
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      Básico
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      Profesional
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      Corporativo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    { feature: 'Mascotas activas', free: '50', basic: '500', pro: '2,000', enterprise: 'Ilimitado' },
                    { feature: 'Usuarios veterinarios', free: '1', basic: '3', pro: '8', enterprise: 'Ilimitado' },
                    { feature: 'WhatsApp automático', free: '50 msg/mes', basic: 'Ilimitado', pro: 'Ilimitado', enterprise: 'Ilimitado' },
                    { feature: 'Automatización completa', free: '❌', basic: '✅', pro: '✅', enterprise: '✅' },
                    { feature: 'Inventario', free: '❌', basic: 'Básico', pro: 'Completo', enterprise: 'Avanzado' },
                    { feature: 'Reportes avanzados', free: '❌', basic: '❌', pro: '✅', enterprise: '✅' },
                    { feature: 'Multi-sucursal', free: '❌', basic: '❌', pro: '✅', enterprise: '✅' },
                    { feature: 'API completa', free: '❌', basic: '❌', pro: 'Limitada', enterprise: '✅' },
                    { feature: 'Soporte', free: 'Comunidad', basic: 'Email', pro: 'Prioritario', enterprise: '24/7' },
                    { feature: 'Sin marca Vetify', free: '❌', basic: '❌', pro: '❌', enterprise: '✅' },
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 dark:text-gray-300">
                        {row.free}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 dark:text-gray-300">
                        {row.basic}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 dark:text-gray-300">
                        {row.pro}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 dark:text-gray-300">
                        {row.enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Resolvemos tus dudas sobre nuestros planes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: "¿Puedo cambiar de plan en cualquier momento?",
                answer: "Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu panel de control. Los cambios se aplican inmediatamente."
              },
              {
                question: "¿Qué incluye el soporte 24/7?",
                answer: "El soporte 24/7 incluye asistencia técnica inmediata, resolución de problemas críticos y acceso directo a nuestro equipo de especialistas."
              },
              {
                question: "¿Hay límites en el almacenamiento?",
                answer: "No, todos nuestros planes incluyen almacenamiento ilimitado para expedientes, imágenes y documentos de tus pacientes."
              },
              {
                question: "¿Puedo cancelar mi suscripción?",
                answer: "Sí, puedes cancelar tu suscripción en cualquier momento. No hay penalizaciones ni costos ocultos."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${
                  resolvedTheme === "dark"
                    ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                    : "bg-white border border-gray-100"
                } shadow-card`}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-20 text-center">
          <div className={`rounded-2xl p-12 ${
            resolvedTheme === "dark"
              ? "bg-gradient-to-r from-vetify-accent-900/50 to-vetify-primary-900/50 border border-gray-700"
              : "bg-gradient-to-r from-vetify-accent-50 to-vetify-primary-50 border border-gray-100"
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Listo para transformar tu clínica?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Únete a cientos de veterinarios que ya automatizaron sus clínicas con Vetify. 
              Comienza gratis y ve la diferencia desde el primer día.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handlePlanSelect('free')}
                className="px-8 py-3 bg-vetify-success hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Comenzar Gratis
              </button>
              <button
                onClick={() => handlePlanSelect('professional')}
                className="px-8 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Ver Plan Profesional
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;