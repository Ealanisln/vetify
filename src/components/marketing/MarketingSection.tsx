import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import FeatureShowcase from './FeatureShowcase';
import BenefitsSection from './BenefitsSection';
import HowItWorksSection from './HowItWorksSection';

interface MarketingSectionProps {
  showFeatures?: boolean;
  showBenefits?: boolean;
  showHowItWorks?: boolean;
  showPricing?: boolean;
}

// Sección de pricing simplificada
const PricingPreview: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planes que se adaptan a tu clínica
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Desde clínicas pequeñas hasta grandes hospitales veterinarios. 
            Todos los planes incluyen <span className="font-semibold text-vetify-accent-600">30 días de prueba gratis</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Plan Starter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-vetify-primary">$299</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">/mes</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Ideal para clínicas pequeñas</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Hasta 500 mascotas</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">WhatsApp automático</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Gestión básica</span>
              </div>
            </div>
          </div>

          {/* Plan Standard - Más Popular */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-vetify-accent-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-vetify-accent-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Más Popular
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Standard</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-vetify-primary">$449</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">/mes</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Para clínicas en crecimiento</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Hasta 2,000 mascotas</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Automación avanzada</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Reportes detallados</span>
              </div>
            </div>
          </div>

          {/* Plan Professional */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Professional</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-vetify-primary">$899</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">/mes</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Para hospitales veterinarios</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Mascotas ilimitadas</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Multi-sucursal</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Soporte prioritario</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/precios"
            className="inline-flex items-center px-8 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Ver todos los planes
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            ✨ Todos los planes incluyen 30 días de prueba gratis • Cancela en cualquier momento
          </p>
        </div>
      </div>
    </section>
  );
};

export const MarketingSection: React.FC<MarketingSectionProps> = ({
  showFeatures = true,
  showBenefits = true,
  showHowItWorks = true,
  showPricing = true,
}) => {
  return (
    <>
      {showFeatures && <FeatureShowcase />}
      {showBenefits && <BenefitsSection />}
      {showHowItWorks && <HowItWorksSection />}
      {showPricing && <PricingPreview />}
    </>
  );
};

export default MarketingSection; 