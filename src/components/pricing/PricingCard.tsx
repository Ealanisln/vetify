'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

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
  className?: string;
}

export function PricingCard({ 
  product, 
  price, 
  isPopular = false,
  isCurrentPlan = false,
  className = ""
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const handleSubscribe = async () => {
    if (isCurrentPlan || isLoading) return;
    
    // Para el plan gratuito, no hacer nada ya que usaremos RegisterLink directamente
    if (price.unitAmount === 0) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: price.id }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error('Error en checkout:', data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error al iniciar checkout:', error);
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
      isPopular ? 'border-2 border-primary shadow-lg scale-105' : 'border border-border'
    } ${className}`}>
      {/* Badge de Popular */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 flex items-center gap-1">
            <Star className="h-3 w-3" />
            Más Popular
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
            // Para plan gratuito, usar link directo al registro de Kinde
            <Link 
              href="/api/auth/register"
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-center inline-block transition-colors duration-200"
            >
              Comenzar Gratis
            </Link>
          ) : (
            // Para planes de pago, usar el manejo de checkout existente
            <Button
              onClick={handleSubscribe}
              disabled={isCurrentPlan || isLoading}
              className={`w-full transition-all duration-200 ${
                isCurrentPlan 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : isPopular 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg' 
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              }`}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </div>
              ) : isCurrentPlan ? (
                'Plan Actual'
              ) : (
                'Suscribirse Ahora'
              )}
            </Button>
          )}
          
          {price.interval === 'year' && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Ahorra hasta 20% con facturación anual
            </p>
          )}
        </div>
      </div>
    </Card>
  );
} 