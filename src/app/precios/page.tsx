"use client";

import { useState } from 'react';
import { Check, Star, Zap, Users, Building, Crown } from 'lucide-react';
import { useThemeAware, getThemeClass } from "@/hooks/useThemeAware";
import { COMPLETE_PLANS, formatPrice } from '@/lib/pricing-config';

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
  const { mounted, theme } = useThemeAware();

  // Convert COMPLETE_PLANS to the expected format with proper icons
  const plans: PricingPlan[] = Object.values(COMPLETE_PLANS).map(plan => ({
    id: plan.key.toLowerCase(),
    name: plan.name,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    originalMonthlyPrice: 'originalMonthlyPrice' in plan ? plan.originalMonthlyPrice : undefined,
    originalYearlyPrice: 'originalYearlyPrice' in plan ? plan.originalYearlyPrice : undefined,
    badge: plan.badge,
    badgeColor: plan.badgeColor,
    popular: plan.popular || false,
    icon: plan.icon === 'Star' ? <Star className="h-6 w-6" /> :
          plan.icon === 'Users' ? <Users className="h-6 w-6" /> :
          plan.icon === 'Building' ? <Building className="h-6 w-6" /> :
          plan.icon === 'Crown' ? <Crown className="h-6 w-6" /> :
          <Star className="h-6 w-6" />,
    features: plan.features,
    cta: plan.cta
  }));

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      window.location.href = '/sign-up';
    } else {
      window.location.href = `/sign-up?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`;
    }
  };

  // Theme-aware class helpers
  const backgroundClass = getThemeClass(
    "bg-gradient-to-br from-vetify-accent-50 via-white to-vetify-blush-50",
    "bg-gradient-to-br from-vetify-slate-900 via-gray-900 to-vetify-primary-900",
    mounted,
    theme
  );

  const cardClass = getThemeClass(
    "bg-white border border-gray-100",
    "bg-gray-800/50 backdrop-blur-sm border border-gray-700",
    mounted,
    theme
  );

  const tableClass = getThemeClass(
    "bg-white border border-gray-100",
    "bg-gray-800/50 backdrop-blur-sm border border-gray-700",
    mounted,
    theme
  );

  const ctaClass = getThemeClass(
    "bg-gradient-to-r from-vetify-accent-50 to-vetify-primary-50 border border-gray-100",
    "bg-gradient-to-r from-vetify-accent-900/50 to-vetify-primary-900/50 border border-gray-700",
    mounted,
    theme
  );

  return (
    <div className="relative min-h-screen">
      {/* Fondo */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${backgroundClass}`}
      />

      {/* Decoración de fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-vetify-accent-300 to-vetify-accent-100 blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-gradient-to-br from-vetify-blush-300 to-vetify-blush-100 blur-3xl opacity-25 dark:opacity-8"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-vetify-primary-300 to-vetify-primary-100 blur-3xl opacity-20 dark:opacity-5"></div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-vetify-blush-50 dark:bg-vetify-blush-900/30 rounded-full mb-4">
            <Zap className="h-4 w-4 text-vetify-blush-600 dark:text-vetify-blush-300 mr-2" />
            <span className="text-sm font-medium text-vetify-blush-600 dark:text-vetify-blush-300">¡Oferta de lanzamiento!</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
            Planes que se adaptan a tu <span className="text-vetify-accent-500 dark:text-vetify-accent-300">clínica</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Desde veterinarios independientes hasta grandes cadenas. Encuentra el plan perfecto para automatizar tu clínica veterinaria.
          </p>

          {/* Oferta especial MVP */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-5 mb-6 max-w-2xl mx-auto shadow-md border border-blue-200/20">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-4 w-4 mr-2" />
              <span className="font-bold text-base">🚀 25% de DESCUENTO - Oferta MVP</span>
            </div>
            <p className="text-sm opacity-90">Precios especiales para early adopters. ¡Transforma tu clínica veterinaria con el nuevo pricing!</p>
            <p className="text-xs mt-2 font-medium opacity-80">Válida hasta agosto 2025 - Nuevos precios competitivos</p>
          </div>

          {/* Toggle anual/mensual */}
          <div className="flex items-center justify-center space-x-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-vetify-accent-600 dark:text-vetify-accent-300' : 'text-gray-500 dark:text-gray-400'}`}>
              Mensual
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-vetify-accent-500 focus:ring-offset-2 ${
                isYearly ? 'bg-gradient-to-r from-vetify-accent-500 to-vetify-primary-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-vetify-accent-600 dark:text-vetify-accent-300' : 'text-gray-500 dark:text-gray-400'}`}>
              Anual
            </span>
            {isYearly && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-vetify-success to-emerald-500 text-white shadow-sm">
                Ahorra 25%
              </span>
            )}
          </div>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'ring-2 ring-vetify-accent-500 shadow-2xl'
                  : 'shadow-card hover:shadow-card-hover'
              } ${cardClass}`}
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
                          {formatPrice(isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                        </span>
                      </div>
                      {(plan.originalMonthlyPrice || plan.originalYearlyPrice) && (
                        <div className="flex items-center mt-1">
                          <span className="text-lg text-gray-400 dark:text-gray-500 line-through mr-2">
                            {formatPrice(isYearly ? plan.originalYearlyPrice || 0 : plan.originalMonthlyPrice || 0)}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            25% OFF
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
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-vetify-blush-400 to-vetify-blush-500 hover:from-vetify-blush-500 hover:to-vetify-blush-600 text-white shadow-lg hover:shadow-xl'
                      : plan.id === 'free'
                      ? 'bg-gradient-to-r from-vetify-accent-500 to-vetify-accent-600 hover:from-vetify-accent-600 hover:to-vetify-accent-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-vetify-slate-500 to-vetify-slate-600 hover:from-vetify-slate-600 hover:to-vetify-slate-700 text-white shadow-md hover:shadow-lg'
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
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Comparación detallada de características
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Encuentra exactamente lo que necesitas para tu clínica
            </p>
          </div>

          <div className={`rounded-2xl overflow-hidden ${tableClass} shadow-card`}>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    { feature: 'Mascotas activas', free: '50', basic: '300', pro: '1,000' },
                    { feature: 'Usuarios veterinarios', free: '1', basic: '3', pro: '8' },
                    { feature: 'WhatsApp automático', free: '50 msg/mes', basic: 'Ilimitado', pro: 'Ilimitado' },
                    { feature: 'Automatización completa', free: '❌', basic: '✅', pro: '✅' },
                    { feature: 'Inventario', free: '❌', basic: 'Básico', pro: 'Completo' },
                    { feature: 'Reportes avanzados', free: '❌', basic: '❌', pro: '✅' },
                    { feature: 'Multi-sucursal', free: '❌', basic: '❌', pro: '✅' },
                    { feature: 'API completa', free: '❌', basic: '❌', pro: 'Limitada' },
                    { feature: 'Soporte', free: 'Comunidad', basic: 'Email', pro: 'Prioritario' },
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
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
                className={`p-6 rounded-xl ${cardClass} shadow-card`}
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
        <div className="mt-16 text-center">
          <div className={`rounded-2xl p-8 ${ctaClass}`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Listo para transformar tu clínica?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Únete a cientos de veterinarios que ya automatizaron sus clínicas con Vetify. 
              Comienza gratis y ve la diferencia desde el primer día.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handlePlanSelect('free')}
                className="px-8 py-3 bg-gradient-to-r from-vetify-accent-500 to-vetify-accent-600 hover:from-vetify-accent-600 hover:to-vetify-accent-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Comenzar Gratis
              </button>
              <button
                onClick={() => handlePlanSelect('professional')}
                className="px-8 py-3 bg-gradient-to-r from-vetify-blush-400 to-vetify-blush-500 hover:from-vetify-blush-500 hover:to-vetify-blush-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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