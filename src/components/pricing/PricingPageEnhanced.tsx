'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useSubscription } from '../../hooks/useSubscription';
import { COMPLETE_PLANS, formatPrice } from '../../lib/pricing-config';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@prisma/client';
import type { PricingPlan, APIPlan, SubscriptionData } from './types';
import type { DowngradeValidation } from '../../lib/downgrade-validation';

interface PricingPageEnhancedProps {
  tenant?: Tenant | null;
}

// Mapeo de IDs de Stripe a IDs locales para compatibilidad
const STRIPE_TO_LOCAL_ID_MAP: Record<string, string> = {
  'prod_TCuXLEJNsZUevo': 'basico',
  'prod_TCuY69NLP7G9Xf': 'profesional',
  'prod_TCuAYal8XCdJ1g': 'corporativo' // Solo para display, cotización personalizada
};

export function PricingPageEnhanced({ tenant }: PricingPageEnhancedProps) {
  const [isYearly, setIsYearly] = useState(false);

  // Subscription state management
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  // Estados para datos dinámicos de pricing desde Stripe
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Mantenemos planName por compatibilidad pero no lo usamos directamente
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { planName } = useSubscription(tenant || null);

  // Function to load subscription data
  const loadSubscriptionData = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/current');

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);

        if (data.hasSubscription && data.planName) {
          const planKey = mapPlanNameToKey(data.planName);
          setUserPlan(planKey);
          setUpgradeOptions(getAvailableUpgrades(planKey));
        } else {
          setUserPlan(null);
          setUpgradeOptions(['basico', 'profesional', 'corporativo']);
        }
      } else {
        setUserPlan(null);
        setUpgradeOptions([]);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setUserPlan(null);
      setUpgradeOptions([]);
    }
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        const authenticated = response.ok;

        setIsAuthenticated(authenticated);

        if (authenticated) {
          await loadSubscriptionData();

          const pendingCheckout = localStorage.getItem('pendingCheckout');

          if (pendingCheckout) {
            try {
              const checkoutData = JSON.parse(pendingCheckout);
              localStorage.removeItem('pendingCheckout');

              const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  priceId: checkoutData.priceId,
                  planKey: checkoutData.planKey,
                  billingInterval: checkoutData.billingInterval
                }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.url) {
                  window.location.href = data.url;
                }
              } else {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.redirectUrl) {
                  window.location.href = errorData.redirectUrl;
                }
              }
            } catch (error) {
              console.error('Error processing pending checkout:', error);
              localStorage.removeItem('pendingCheckout');
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [loadSubscriptionData]);

  // Map Stripe plan name to local plan key
  const mapPlanNameToKey = (planName: string): string => {
    const name = planName.toLowerCase();
    if (name.includes('básico') || name.includes('basico') || name.includes('basic')) {
      return 'basico';
    } else if (name.includes('profesional') || name.includes('professional')) {
      return 'profesional';
    } else if (name.includes('corporativo') || name.includes('corporate') || name.includes('empresa') || name.includes('enterprise')) {
      return 'corporativo';
    }
    return 'basico';
  };

  // Get available upgrades based on current plan
  const getAvailableUpgrades = (currentPlan: string): string[] => {
    const planHierarchy = ['basico', 'profesional', 'corporativo'];
    const currentIndex = planHierarchy.indexOf(currentPlan);

    if (currentIndex === -1) {
      return planHierarchy;
    }

    return planHierarchy.slice(currentIndex + 1);
  };

  // Cargar datos de pricing desde la API de Stripe
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        setPricingLoading(true);
        setPricingError(null);

        const response = await fetch('/api/pricing');

        if (!response.ok) {
          throw new Error(`Failed to fetch pricing: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.plans) {
          throw new Error('Invalid pricing data received');
        }

        // Si la API devuelve vacío, usar fallback local silenciosamente
        if (data.plans.length === 0) {
          console.log('ℹ️ No plans from API, using local configuration');

          // Usar configuración local completa
          const fallbackPlans = Object.values(COMPLETE_PLANS).map(plan => ({
            id: plan.key.toLowerCase(),
            name: plan.name,
            description: plan.description,
            features: plan.features.map(f => f.name),
            prices: {
              monthly: {
                id: `price_${plan.key.toLowerCase()}_monthly`,
                unitAmount: plan.monthlyPrice * 100,
                currency: 'mxn',
                interval: 'month' as const,
                intervalCount: 1
              },
              yearly: {
                id: `price_${plan.key.toLowerCase()}_yearly`,
                unitAmount: plan.yearlyPrice * 100,
                currency: 'mxn',
                interval: 'year' as const,
                intervalCount: 1
              }
            }
          }));

          setPricingPlans(fallbackPlans);
          setPricingError(null);
          setPricingLoading(false);
          return; // Salir temprano para evitar procesamiento adicional
        }

        const transformedPlans: PricingPlan[] = data.plans.map((plan: APIPlan) => {
          const localId = STRIPE_TO_LOCAL_ID_MAP[plan.id] || plan.id.toLowerCase();

          return {
            id: localId,
            name: plan.name,
            description: plan.description || `Plan ${plan.name}`,
            features: plan.features || [],
            prices: {
              monthly: plan.prices.monthly,
              yearly: plan.prices.yearly
            }
          };
        });

        // Siempre agregar el plan Corporativo desde la configuración local (cotización personalizada)
        const corporativoConfig = COMPLETE_PLANS.CORPORATIVO;
        const corporativoPlan: PricingPlan = {
          id: 'corporativo',
          name: corporativoConfig.name,
          description: corporativoConfig.description,
          features: corporativoConfig.features.map(f => f.name),
          prices: {
            monthly: {
              id: 'price_corporativo_monthly',
              unitAmount: corporativoConfig.monthlyPrice * 100,
              currency: 'mxn',
              interval: 'month',
              intervalCount: 1
            },
            yearly: {
              id: 'price_corporativo_yearly',
              unitAmount: corporativoConfig.yearlyPrice * 100,
              currency: 'mxn',
              interval: 'year',
              intervalCount: 1
            }
          }
        };

        // Combinar planes de la API con el plan Corporativo
        const allPlans = [...transformedPlans, corporativoPlan];
        setPricingPlans(allPlans);

      } catch (error) {
        console.error('Error loading pricing data:', error);

        // Fallback a configuración local si la API falla
        const fallbackPlans = Object.values(COMPLETE_PLANS).map(plan => ({
          id: plan.key.toLowerCase(),
          name: plan.name,
          description: plan.description,
          features: plan.features.map(f => f.name),
          prices: {
            monthly: {
              id: `price_${plan.key.toLowerCase()}_monthly`,
              unitAmount: plan.monthlyPrice * 100,
              currency: 'mxn',
              interval: 'month',
              intervalCount: 1
            },
            yearly: {
              id: `price_${plan.key.toLowerCase()}_yearly`,
              unitAmount: plan.yearlyPrice * 100,
              currency: 'mxn',
              interval: 'year',
              intervalCount: 1
            }
          }
        }));

        setPricingPlans(fallbackPlans);
        setPricingError(null);
      } finally {
        setPricingLoading(false);
      }
    };

    loadPricingData();
  }, []);

  // Determinar el estado del plan para cada tarjeta
  const getPlanStatus = (productId: string) => {
    if (!isAuthenticated || !subscriptionData) {
      return { isCurrentPlan: false, isUpgrade: false, isDowngrade: false };
    }

    const hasActiveSubscription = subscriptionData.hasSubscription &&
      subscriptionData.subscriptionStatus === 'ACTIVE';

    if (!hasActiveSubscription) {
      return { isCurrentPlan: false, isUpgrade: true, isDowngrade: false };
    }

    const isCurrentPlan = userPlan === productId;
    const isUpgrade = upgradeOptions.includes(productId);

    const planHierarchy = ['basico', 'profesional', 'corporativo'];
    const currentIndex = planHierarchy.indexOf(userPlan || '');
    const targetIndex = planHierarchy.indexOf(productId);
    const isDowngrade = currentIndex > targetIndex && targetIndex !== -1;

    return { isCurrentPlan, isUpgrade, isDowngrade };
  };

  // Obtener precios para cada producto según el intervalo seleccionado
  const getProductPrice = (productId: string) => {
    const plan = pricingPlans.find(p => p.id === productId);
    if (!plan) return null;

    return isYearly ? plan.prices.yearly : plan.prices.monthly;
  };

  // Formatear precio desde centavos
  const formatPriceFromCents = (amountInCents: number) => {
    return formatPrice(Math.round(amountInCents / 100));
  };

  // Calcular descuento anual
  const calculateAnnualDiscount = (productId: string) => {
    const plan = pricingPlans.find(p => p.id === productId);
    if (!plan || !plan.prices.monthly || !plan.prices.yearly) return 0;

    const monthlyTotal = plan.prices.monthly.unitAmount * 12;
    const yearlyTotal = plan.prices.yearly.unitAmount;
    return Math.round((1 - yearlyTotal / monthlyTotal) * 100);
  };

  // Manejar registro y checkout
  const handleRegisterAndCheckout = (priceId: string, planKey: string) => {
    const checkoutData = {
      priceId,
      planKey: planKey.toUpperCase(),
      billingInterval: isYearly ? 'annual' : 'monthly'
    };

    localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
    window.location.href = `/api/auth/register?post_login_redirect_url=${encodeURIComponent('/precios')}`;
  };

  // Modal functions for downgrade handling
  const showDowngradeBlockerModal = (validation: DowngradeValidation) => {
    const blockerMessages = validation.blockers.map((blocker) => blocker.message).join('\n\n');
    const suggestions = validation.blockers.map((blocker) => blocker.suggestion).filter(Boolean).join('\n\n');

    alert(`❌ No puedes cambiar a este plan por las siguientes razones:\n\n${blockerMessages}\n\n📋 Para poder hacer este cambio:\n${suggestions}`);
  };

  const showDowngradeWarningModal = (validation: DowngradeValidation): Promise<boolean> => {
    return new Promise((resolve) => {
      const warningMessages = validation.warnings.map((warning) => `• ${warning.description}`).join('\n');
      const confirmed = confirm(`⚠️ Advertencia: Este cambio de plan resultará en pérdida de funcionalidades:\n\n${warningMessages}\n\n¿Estás seguro de que deseas continuar?`);
      resolve(confirmed);
    });
  };

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!isAuthenticated) {
      handleRegisterAndCheckout(priceId, planKey);
      return;
    }

    try {
      // Validar si es un downgrade antes de proceder
      if (subscriptionData?.hasSubscription) {
        try {
          const validationResponse = await fetch('/api/plans/validate-downgrade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetPlanKey: planKey.toUpperCase()
            }),
          });

          if (validationResponse.ok) {
            const validationData = await validationResponse.json();

            if (validationData.isDowngrade && !validationData.canProceed) {
              showDowngradeBlockerModal(validationData.validation);
              return;
            }

            if (validationData.isDowngrade && validationData.canProceed && validationData.validation.warnings.length > 0) {
              const shouldContinue = await showDowngradeWarningModal(validationData.validation);
              if (!shouldContinue) {
                return;
              }
            }
          }
        } catch (validationError) {
          console.warn('Downgrade validation failed, proceeding anyway:', validationError);
        }
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planKey: planKey.toUpperCase(),
          billingInterval: isYearly ? 'annual' : 'monthly'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.redirectUrl) {
          window.location.href = errorData.redirectUrl;
          return;
        }

        if (response.status === 401) {
          window.location.href = `/api/auth/login?post_login_redirect_url=${encodeURIComponent('/precios')}`;
          return;
        }

        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error) {
      console.error('Error en checkout:', error);

      if (error instanceof Error) {
        alert(`Error al procesar el checkout: ${error.message}`);
      } else {
        alert('Error desconocido al procesar el checkout');
      }
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Planes profesionales para veterinarias</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
              Precios simples y <span className="text-primary">transparentes</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gestiona tu clínica veterinaria de manera profesional. Todos los planes incluyen 30 días gratis.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Mensual
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isYearly ? 'bg-primary' : 'bg-input'
                }`}
                aria-label="Toggle billing period"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Anual
              </span>
              {isYearly && (
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  Ahorra hasta 20%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      {pricingLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Cargando planes...</span>
        </div>
      )}

      {pricingError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">Error al cargar los planes: {pricingError}</p>
          </div>
        </div>
      )}

      {!pricingLoading && !pricingError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16">
            {pricingPlans.map((product: PricingPlan) => {
              const price = getProductPrice(product.id);
              const { isCurrentPlan, isUpgrade, isDowngrade } = getPlanStatus(product.id);
              const planConfig = COMPLETE_PLANS[product.id.toUpperCase() as keyof typeof COMPLETE_PLANS];

              if (!price) return null;

              const isPopular = planConfig?.popular;

              return (
                <div key={product.id} className={`relative ${isPopular ? 'mt-10' : 'mt-8'}`}>
                  {/* Popular Badge - Outside the card */}
                  {planConfig?.badge && (
                    <div className={`absolute left-1/2 -translate-x-1/2 z-20 whitespace-nowrap ${isPopular ? '-top-4' : '-top-3'}`}>
                      <Badge className={`${planConfig.badgeColor} px-4 py-1 text-sm font-semibold`}>
                        {planConfig.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Pricing Card */}
                  <div
                    className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 ${
                      isPopular
                        ? 'border-primary shadow-lg shadow-primary/20 scale-105 origin-top'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    } bg-card overflow-hidden`}
                  >

                  {/* Card Header */}
                  <div className={`px-6 pt-8 pb-6 ${isPopular ? 'bg-primary/5' : ''}`}>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {product.description}
                    </p>

                    {/* Pricing */}
                    <div className="space-y-2">
                      {product.id === 'corporativo' ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-4xl font-bold text-foreground">
                            Cotización
                          </span>
                          <p className="text-sm text-muted-foreground">
                            Precio personalizado según tus necesidades
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-foreground">
                              {formatPriceFromCents(isYearly ? price.unitAmount / 12 : price.unitAmount)}
                            </span>
                            <span className="text-muted-foreground">/mes</span>
                          </div>
                          {isYearly && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Facturado anualmente: {formatPriceFromCents(price.unitAmount)}
                              </p>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                Ahorra {calculateAnnualDiscount(product.id)}% vs mensual
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="flex-1 px-6 py-6 space-y-3">
                    {product.features && Array.isArray(product.features) && product.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">
                          {typeof feature === 'string' ? feature : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="px-6 pb-6">
                    {isCurrentPlan ? (
                      <Button
                        disabled
                        className="w-full bg-muted text-muted-foreground cursor-not-allowed"
                        size="lg"
                      >
                        Plan Actual
                      </Button>
                    ) : product.id === 'corporativo' ? (
                      <Link href="/contacto">
                        <Button
                          className="w-full"
                          size="lg"
                        >
                          Contactar Ventas
                        </Button>
                      </Link>
                    ) : !isAuthenticated ? (
                      <Button
                        onClick={() => handleRegisterAndCheckout(price.id, product.id)}
                        className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        size="lg"
                      >
                        Iniciar Prueba Gratuita
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCheckout(price.id, product.id)}
                        className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        size="lg"
                      >
                        {isUpgrade ? 'Actualizar Plan' :
                         isDowngrade ? 'Cambiar Plan ⬇️' :
                         subscriptionData?.subscriptionStatus && !['ACTIVE', 'TRIALING'].includes(subscriptionData.subscriptionStatus) ? 'Suscribirse Ahora' : 'Iniciar Prueba Gratuita'}
                      </Button>
                    )}
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!isAuthenticated && (
            <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-center text-foreground font-medium">
                🚀 ¡Comienza tu prueba gratuita de 30 días! Solo necesitas crear una cuenta
              </p>
            </div>
          )}
          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p>✅ Todos los planes incluyen <strong className="text-foreground">30 días de prueba gratuita</strong></p>
            <p>✅ Cancela en cualquier momento • Sin contratos • Soporte en español</p>
            <p>
              ¿Necesitas ayuda para elegir? <Link href="/contacto" className="text-primary hover:underline">Contacta con nosotros</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
