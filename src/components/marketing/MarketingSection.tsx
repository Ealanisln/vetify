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
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planes que se adaptan a tu clínica
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Desde clínicas pequeñas hasta grandes hospitales veterinarios.
            Todos los planes incluyen <span className="font-semibold text-primary">30 días de prueba gratis</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Plan Starter */}
          <div className="card rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-primary">$299</span>
                <span className="text-muted-foreground ml-1">/mes</span>
              </div>
              <p className="text-muted-foreground">Ideal para clínicas pequeñas</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Hasta 500 mascotas</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">WhatsApp automático</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Gestión básica</span>
              </div>
            </div>
          </div>

          {/* Plan Standard - Más Popular */}
          <div className="card rounded-xl shadow-lg p-6 border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Más Popular
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Standard</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-primary">$449</span>
                <span className="text-muted-foreground ml-1">/mes</span>
              </div>
              <p className="text-muted-foreground">Para clínicas en crecimiento</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Hasta 2,000 mascotas</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Automación avanzada</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Reportes detallados</span>
              </div>
            </div>
          </div>

          {/* Plan Professional */}
          <div className="card rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Professional</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-primary">$899</span>
                <span className="text-muted-foreground ml-1">/mes</span>
              </div>
              <p className="text-muted-foreground">Para hospitales veterinarios</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Mascotas ilimitadas</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Multi-sucursal</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-foreground">Soporte prioritario</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/precios"
            className="btn-primary inline-flex items-center px-8 py-3 rounded-lg shadow-md"
          >
            Ver todos los planes
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
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