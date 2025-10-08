'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckIcon } from 'lucide-react';
import type { PricingPlan } from './types';

interface PricingComparisonTableProps {
  pricingPlans: PricingPlan[];
  isYearly: boolean;
  isAuthenticated: boolean;
  getProductPrice: (productId: string) => {
    id: string;
    unitAmount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  } | null;
  getPlanStatus: (productId: string) => { isCurrentPlan: boolean; isUpgrade: boolean; isDowngrade: boolean };
  handleRegisterAndCheckout: (priceId: string, planKey: string) => void;
  handleCheckout: (priceId: string, planKey: string) => void;
  formatPriceFromCents: (amountInCents: number) => string;
  calculateAnnualDiscount: (productId: string) => number;
}

export function PricingComparisonTable({
  pricingPlans,
  isYearly,
  isAuthenticated,
  getProductPrice,
  getPlanStatus,
  handleRegisterAndCheckout,
  handleCheckout,
  formatPriceFromCents,
  calculateAnnualDiscount
}: PricingComparisonTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
      {/* Header de la tabla */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h4 className="text-xs font-medium text-gray-900 dark:text-white text-center">
          Comparación de Planes
        </h4>
      </div>
      
      {/* Contenido de la tabla */}
      <div className="divide-y divide-gray-200 dark:divide-gray-600">
        {pricingPlans.map((product: PricingPlan) => {
          const price = getProductPrice(product.id);
          const { isCurrentPlan, isUpgrade, isDowngrade } = getPlanStatus(product.id);
          
          if (!price) return null;

          return (
            <div key={product.id} className="p-3">
              {/* Fila superior: Nombre del plan y precio */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-xs font-semibold text-gray-900 dark:text-white">
                    {product.name}
                  </h5>
                  {/* Badge para plan popular */}
                  {product.id === 'clinica' && (
                    <Badge className="bg-vetify-accent-100 dark:bg-vetify-accent-900 text-vetify-accent-800 dark:text-vetify-accent-200 text-xs px-1.5 py-0.5">
                      POPULAR
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatPriceFromCents(isYearly ? price.unitAmount / 12 : price.unitAmount)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    /mes
                  </div>
                  {isYearly && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Total: {formatPriceFromCents(price.unitAmount)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Descripción del plan */}
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-tight">
                {product.description}
              </p>
              
              {/* Características principales (limitado a 2) */}
              <div className="mb-3">
                <ul className="space-y-1">
                  {product.features && Array.isArray(product.features) && 
                   product.features.slice(0, 2).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <CheckIcon className="h-3 w-3 text-vetify-accent-500 dark:text-vetify-accent-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                        {typeof feature === 'string' ? feature : ''}
                      </span>
                    </li>
                  ))}
                  {product.features && product.features.length > 2 && (
                    <li className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{product.features.length - 2} características más
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Descuento anual si aplica */}
              {isYearly && (
                <div className="text-xs text-green-600 dark:text-green-400 text-center mb-2">
                  💰 Ahorra {calculateAnnualDiscount(product.id)}% vs mensual
                </div>
              )}
              
              {/* Botón de acción */}
              <div className="flex justify-center">
                {isCurrentPlan ? (
                  <Button 
                    disabled 
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-xs py-1.5"
                  >
                    Plan Actual
                  </Button>
                ) : !isAuthenticated ? (
                  <Button
                    onClick={() => handleRegisterAndCheckout(price.id, product.id)}
                    className={`w-full text-xs py-1.5 ${
                      product.id === 'clinica'
                        ? 'bg-vetify-accent-600 hover:bg-vetify-accent-700 dark:bg-vetify-accent-500 dark:hover:bg-vetify-accent-600'
                        : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
                    } text-white`}
                  >
                    Empezar
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(price.id, product.id)}
                    className={`w-full text-xs py-1.5 ${
                      product.id === 'clinica'
                        ? 'bg-vetify-accent-600 hover:bg-vetify-accent-700 dark:bg-vetify-accent-500 dark:hover:bg-vetify-accent-600'
                        : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
                    } text-white`}
                  >
                    {isUpgrade ? 'Actualizar' : 
                     isDowngrade ? 'Cambiar ⬇️' :
                     product.id === 'empresa' ? 'Contactar' : 'Suscribirse'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
