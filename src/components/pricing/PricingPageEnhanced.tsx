'use client';

import { useState, useEffect } from 'react';
import { PricingCard } from './PricingCard';
import { useSubscription } from '@/hooks/useSubscription';
import { Zap, Check } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@prisma/client';

interface PricingProduct {
  id: string;
  name: string;
  description: string;
  features: string[];
}

interface PricingPrice {
  id: string;
  unitAmount: number;
  currency: string;
  interval: string;
  intervalCount: number;
}

interface PricingPageEnhancedProps {
  tenant?: Tenant | null;
}

// Datos de ejemplo de precios
const mockProducts: PricingProduct[] = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Ideal para veterinarios independientes o consultorios muy pequeños',
    features: [
      'Hasta 50 mascotas',
      '1 usuario',
      'WhatsApp básico: 50 msg/mes',
      'Expedientes básicos',
      'Citas básicas',
      'Soporte comunidad'
    ]
  },
  {
    id: 'basic',
    name: 'Básico',
    description: 'Ideal para clínicas pequeñas o que recién comienzan',
    features: [
      'Hasta 300 mascotas',
      '3 usuarios',
      'WhatsApp ilimitado',
      'Automatización completa',
      'Inventario básico',
      'Expedientes completos',
      'Citas avanzadas',
      'Soporte por email'
    ]
  },
  {
    id: 'professional',
    name: 'Profesional',
    description: 'Perfecto para clínicas establecidas con múltiples veterinarios',
    features: [
      'Hasta 1,000 mascotas',
      '8 usuarios',
      'Todo del plan Básico',
      'Reportes avanzados',
      'Multi-sucursal',
      'Analytics y métricas',
      'Soporte prioritario',
      'Integraciones avanzadas'
    ]
  }
];

const mockPrices: Record<string, { monthly: PricingPrice; yearly: PricingPrice }> = {
  free: {
    monthly: {
      id: 'price_1RftdmPwxz1bHxlHvj8h32S6',
      unitAmount: 0, // $0 MXN
      currency: 'mxn',
      interval: 'month',
      intervalCount: 1
    },
    yearly: {
      id: 'price_1RftdmPwxz1bHxlHvj8h32S6',
      unitAmount: 0, // $0 MXN
      currency: 'mxn',
      interval: 'year',
      intervalCount: 1
    }
  },
  basic: {
    monthly: {
      id: 'price_1RftdkPwxz1bHxlH49ZHb4ZT',
      unitAmount: 44900, // $449 MXN
      currency: 'mxn',
      interval: 'month',
      intervalCount: 1
    },
    yearly: {
      id: 'price_1RftdlPwxz1bHxlHdr6Ia4pj',
      unitAmount: 34900, // $349 MXN
      currency: 'mxn',
      interval: 'year',
      intervalCount: 1
    }
  },
  professional: {
    monthly: {
      id: 'price_1RftdlPwxz1bHxlH4oW9dMDZ',
      unitAmount: 89900, // $899 MXN
      currency: 'mxn',
      interval: 'month',
      intervalCount: 1
    },
    yearly: {
      id: 'price_1RftdmPwxz1bHxlH2lDZ07Rw',
      unitAmount: 64900, // $649 MXN
      currency: 'mxn',
      interval: 'year',
      intervalCount: 1
    }
  }
};

export function PricingPageEnhanced({ tenant }: PricingPageEnhancedProps) {
  const [isYearly, setIsYearly] = useState(false);
  
  const { planName } = useSubscription(tenant || null);

  // Obtener precios para cada producto según el intervalo seleccionado
  const getProductPrice = (productId: string) => {
    const productPrices = mockPrices[productId];
    return isYearly ? productPrices?.yearly : productPrices?.monthly;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkout = urlParams.get('checkout');

    if (checkout && typeof window !== 'undefined') {
      // Limpiar el parámetro de la URL inmediatamente para evitar ejecuciones múltiples
      urlParams.delete('checkout');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);

      // Usar la API route para el checkout automático
      fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: checkout }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        } else if (data.error) {
          console.error('Error en checkout:', data.error);
        }
      })
      .catch(error => {
        console.error('Error en checkout automático:', error);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Zap className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">
              ¡Suscripciones Mejoradas!
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Planes que{' '}
            <span className="text-primary">impulsan</span>{' '}
            tu clínica
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Gestiona tu clínica veterinaria de forma profesional con nuestros planes 
            flexibles y funciones avanzadas de automatización.
          </p>

          {/* Features destacadas */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {[
              'Prueba gratuita de 14 días',
              'Cancela en cualquier momento',
              'Soporte técnico incluido',
              'Actualizaciones automáticas'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Toggle Mensual/Anual */}
          <div className="flex items-center justify-center gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/20">
            <span className={`text-sm font-medium transition-colors ${
              !isYearly ? 'text-primary' : 'text-muted-foreground'
            }`}>
              Mensual
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isYearly ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${
              isYearly ? 'text-primary' : 'text-muted-foreground'
            }`}>
              Anual
            </span>
            {isYearly && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                Ahorra 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {mockProducts.map((product, index) => {
            const currentPrice = getProductPrice(product.id);
            
            if (!currentPrice) return null;

            const isPopular = index === 2; // Hacer el tercer plan (Profesional) popular
            const isCurrentPlan = planName === product.name;

            return (
              <PricingCard
                key={product.id}
                product={product}
                price={currentPrice}
                isPopular={isPopular}
                isCurrentPlan={isCurrentPlan}
                className={isPopular ? 'lg:scale-105' : ''}
              />
            );
          })}
        </div>

        {/* Garantía */}
        <div className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Garantía de satisfacción
          </h3>
          <p className="text-muted-foreground mb-4">
            Prueba Vetify sin riesgo durante 14 días. Si no estás satisfecho, 
            cancela antes del período de prueba sin costo alguno.
          </p>
          <p className="text-sm text-muted-foreground">
            ¿Tienes preguntas? <Link href="/contacto" className="text-primary hover:underline">Contáctanos</Link>
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Preguntas Frecuentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: "¿Puedo cambiar de plan en cualquier momento?",
                answer: "Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu dashboard. Los cambios se aplican inmediatamente."
              },
              {
                question: "¿Qué incluye la prueba gratuita?",
                answer: "La prueba gratuita de 14 días incluye acceso completo a todas las funciones del plan que elijas, sin restricciones."
              },
              {
                question: "¿Cómo funciona la facturación anual?",
                answer: "Con la facturación anual, pagas por todo el año por adelantado y obtienes hasta 20% de descuento comparado con el pago mensual."
              },
              {
                question: "¿Incluyen los planes soporte técnico?",
                answer: "Todos nuestros planes incluyen soporte técnico por email. Los planes premium incluyen soporte prioritario y por teléfono."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 