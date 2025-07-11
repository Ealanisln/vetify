'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { useState } from 'react';

interface PricingCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    features: string[];
  };
  price: {
    id: string;
    unitAmount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  };
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
  className?: string;
}

export function PricingCard({ 
  product, 
  price, 
  isPopular = false,
  isCurrentPlan = false,
  isUpgrade = false,
  isDowngrade = false,
  className = ""
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  // Determinar texto y estilo del botón
  const getButtonText = () => {
    if (isLoading) return 'Procesando...';
    if (isCurrentPlan) return 'Plan Actual';
    if (isUpgrade) return 'Hacer Upgrade';
    if (isDowngrade) return 'Cambiar Plan';
    if (price.unitAmount === 0) return 'Probar 30 días gratis';
    return 'Probar 30 días gratis';
  };

  const getButtonStyle = () => {
    if (isCurrentPlan) {
      return 'bg-vetify-accent/20 text-vetify-accent-dark cursor-not-allowed border-2 border-vetify-accent/30';
    }
    if (isUpgrade) {
      return 'bg-vetify-accent hover:bg-vetify-accent-dark text-white shadow-md hover:shadow-lg border-2 border-vetify-accent';
    }
    if (isDowngrade) {
      return 'bg-vetify-blush hover:bg-vetify-blush-dark text-white border-2 border-vetify-blush';
    }
    if (isPopular) {
      return 'bg-vetify-primary hover:bg-vetify-primary-dark text-white shadow-md hover:shadow-lg border-2 border-vetify-primary';
    }
    return 'bg-vetify-primary-100 hover:bg-vetify-primary-200 text-vetify-primary-dark border-2 border-vetify-primary-100';
  };

  const handleSubscribe = async () => {
    // No permitir acciones si es el plan actual o está cargando
    if (isCurrentPlan || isLoading) return;
    
    // Todos los planes ahora tienen trial de 30 días, proceder con checkout
    // Los planes starter tienen price 0 en el trial pero siguen usando Stripe checkout
    
    setIsLoading(true);
    try {
      console.log('PricingCard: Iniciando checkout para:', {
        priceId: price.id,
        productName: product.name,
        isUpgrade,
        isDowngrade
      });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId: price.id,
          isUpgrade,
          planName: product.name
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        console.log('PricingCard: Redirigiendo a checkout:', data.url);
        window.location.href = data.url;
      } else if (data.error) {
        console.error('PricingCard: Error en checkout:', data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('PricingCard: Error al iniciar checkout:', error);
      setIsLoading(false);
    }
  };

  const getIntervalText = (interval: string) => {
    switch (interval) {
      case 'month':
        return 'mes';
      case 'year':
        return 'año';
      default:
        return interval;
    }
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-lg ${
      isPopular ? 'border-2 border-primary shadow-lg scale-105' : 
      isCurrentPlan ? 'border-2 border-green-500 shadow-lg' :
      isUpgrade ? 'border-2 border-green-400 shadow-md' :
      'border border-border'
    } ${className}`}>
      {/* Badge de Popular o Estado */}
      {(isPopular || isCurrentPlan || isUpgrade) && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className={`px-4 py-1 flex items-center gap-1 ${
            isCurrentPlan ? 'bg-green-600 text-white border-green-600' :
            isUpgrade ? 'bg-green-500 text-white border-green-500' :
            'bg-primary text-primary-foreground border-primary'
          }`}>
            {isCurrentPlan ? (
              <>
                <Check className="h-3 w-3" />
                Plan Actual
              </>
            ) : isUpgrade ? (
              <>
                <Star className="h-3 w-3" />
                Upgrade Recomendado
              </>
            ) : (
              <>
                <Star className="h-3 w-3" />
                Más Popular
              </>
            )}
          </Badge>
        </div>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {product.name}
          </h3>
          <div className="mb-3">
            <span className="text-4xl font-bold text-foreground">
              {formatPrice(price.unitAmount, price.currency)}
            </span>
            <span className="text-muted-foreground ml-1">
              /{getIntervalText(price.interval)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {product.description}
          </p>
        </div>

        {/* Features */}
        <div className="mb-6">
          <ul className="space-y-3">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="mt-auto">
          {price.unitAmount === 0 ? (
            // Para plan gratuito, usar botón directo
            <Button
              onClick={handleSubscribe}
              disabled={isCurrentPlan || isLoading}
              className={getButtonStyle()}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </div>
              ) : (
                getButtonText()
              )}
            </Button>
          ) : (
            // Para planes de pago, usar el manejo de checkout existente
            <Button
              onClick={handleSubscribe}
              disabled={isCurrentPlan || isLoading}
              className={getButtonStyle()}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </div>
              ) : (
                getButtonText()
              )}
            </Button>
          )}
          
          {/* Texto adicional para upgrade o descuentos anuales */}
          {price.interval === 'year' && !isCurrentPlan && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Ahorra hasta 20% con facturación anual
            </p>
          )}
          
          {isUpgrade && (
            <p className="text-xs text-green-600 text-center mt-2 font-medium">
              ⬆️ Mejora tu plan actual
            </p>
          )}
          
          {isDowngrade && (
            <p className="text-xs text-orange-600 text-center mt-2 font-medium">
              ⬇️ Cambio de plan disponible
            </p>
          )}
        </div>
      </div>
    </Card>
  );
} 