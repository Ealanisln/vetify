'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { COMPLETE_PLANS, formatPrice } from '@/lib/pricing-config';
import { CheckIcon } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@prisma/client';

interface PricingPageEnhancedProps {
  tenant?: Tenant | null;
}

// Interface for subscription data
interface SubscriptionData {
  hasSubscription: boolean;
  subscriptionStatus: string;
  planName?: string;
  subscriptionId?: string;
  customerId?: string;
  subscriptionEndsAt?: string;
  isTrialPeriod?: boolean;
}

// Estado para datos dinámicos de pricing desde Stripe
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  prices: {
    monthly: {
      id: string;
      unitAmount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    } | null;
    yearly: {
      id: string;
      unitAmount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    } | null;
  };
}

// Tipo para los datos que vienen de la API
interface APIPlan {
  id: string;
  name: string;
  description?: string;
  features?: string[];
  prices: {
    monthly: {
      id: string;
      unitAmount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    } | null;
    yearly: {
      id: string;
      unitAmount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    } | null;
  };
}

// Mapeo de IDs de Stripe a IDs locales para compatibilidad
const STRIPE_TO_LOCAL_ID_MAP: Record<string, string> = {
  'prod_Seq8I3438TwbPQ': 'profesional',
  'prod_Seq84VFkBvXUhI': 'clinica', 
  'prod_Seq8KU7nw8WucQ': 'empresa'
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

  console.log('PricingPageEnhanced render:', { 
    isAuthenticated, 
    isCheckingAuth, 
    userPlan, 
    upgradeOptions: upgradeOptions.length 
  });

  // Function to load subscription data - moved to useCallback to fix dependency issue
  const loadSubscriptionData = useCallback(async () => {
    try {
      console.log('Loading subscription data...');
      const response = await fetch('/api/subscription/current');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription data loaded:', data);
        setSubscriptionData(data);
        
        // Determine current plan from subscription
        if (data.hasSubscription && data.planName) {
          const planKey = mapPlanNameToKey(data.planName);
          setUserPlan(planKey);
          setUpgradeOptions(getAvailableUpgrades(planKey));
        } else {
          // No active subscription
          setUserPlan(null);
          setUpgradeOptions(['profesional', 'clinica', 'empresa']);
        }
      } else {
        console.log('No subscription data or user not authenticated');
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
        console.log('Checking authentication...');
        const response = await fetch('/api/user');
        const authenticated = response.ok;
        console.log('Authentication check result:', authenticated, 'Status:', response.status);
        
        setIsAuthenticated(authenticated);
        
        // Si está autenticado, cargar datos de suscripción
        if (authenticated) {
          await loadSubscriptionData();
          
          // Después verificar checkout pendiente
          console.log('User authenticated, checking for pending checkout...');
          const pendingCheckout = localStorage.getItem('pendingCheckout');
          console.log('Pending checkout found:', !!pendingCheckout);
          
          if (pendingCheckout) {
            try {
              const checkoutData = JSON.parse(pendingCheckout);
              console.log('Processing pending checkout:', checkoutData);
              localStorage.removeItem('pendingCheckout');
              
              // Proceder con el checkout usando POST
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

              console.log('Pending checkout response:', response.status);

              if (response.ok) {
                const data = await response.json();
                console.log('Pending checkout success:', data);
                if (data.url) {
                  console.log('Redirecting to Stripe checkout from pending:', data.url);
                  window.location.href = data.url;
                } else {
                  console.error('No checkout URL received');
                }
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Pending checkout failed:', response.status, errorData);
                
                // Si necesita onboarding, redirigir
                if (errorData.redirectUrl) {
                  console.log('Redirecting to onboarding from pending checkout:', errorData.redirectUrl);
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
    if (name.includes('profesional') || name.includes('professional')) {
      return 'profesional';
    } else if (name.includes('clínica') || name.includes('clinica')) {
      return 'clinica';
    } else if (name.includes('empresa') || name.includes('enterprise')) {
      return 'empresa';
    }
    return 'profesional'; // default
  };

  // Get available upgrades based on current plan
  const getAvailableUpgrades = (currentPlan: string): string[] => {
    const planHierarchy = ['profesional', 'clinica', 'empresa'];
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
        
        console.log('Loading pricing data from API...');
        const response = await fetch('/api/pricing');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pricing: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.plans) {
          throw new Error('Invalid pricing data received');
        }
        
        // Transformar datos de la API al formato esperado por el componente
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
        
        console.log('Pricing data loaded successfully:', transformedPlans.length, 'plans');
        setPricingPlans(transformedPlans);
        
      } catch (error) {
        console.error('Error loading pricing data:', error);
        setPricingError(error instanceof Error ? error.message : 'Failed to load pricing');
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

    // Check if user has an active subscription
    const hasActiveSubscription = subscriptionData.hasSubscription && 
      ['ACTIVE', 'TRIALING'].includes(subscriptionData.subscriptionStatus);

    if (!hasActiveSubscription) {
      // No active subscription - all plans are available
      return { isCurrentPlan: false, isUpgrade: true, isDowngrade: false };
    }

    const isCurrentPlan = userPlan === productId;
    const isUpgrade = upgradeOptions.includes(productId);
    const isDowngrade = !isCurrentPlan && !isUpgrade;

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
    return formatPrice(amountInCents / 100);
  };

  // Calcular descuento anual
  const calculateAnnualDiscount = (productId: string) => {
    const plan = pricingPlans.find(p => p.id === productId);
    if (!plan || !plan.prices.monthly || !plan.prices.yearly) return 0;
    
    const monthlyTotal = plan.prices.monthly.unitAmount * 12;
    const yearlyTotal = plan.prices.yearly.unitAmount * 12;
    return Math.round((1 - yearlyTotal / monthlyTotal) * 100);
  };

  // Manejar registro y checkout
  const handleRegisterAndCheckout = (priceId: string, planKey: string) => {
    // Guardar la información del plan en localStorage para después del login
    const checkoutData = {
      priceId,
      planKey: planKey.toUpperCase(),
      billingInterval: isYearly ? 'annual' : 'monthly'
    };
    
    console.log('Saving checkout data for after registration:', checkoutData);
    localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
    
    // Redirigir al registro
    console.log('Redirecting to registration...');
    window.location.href = `/api/auth/register?post_login_redirect_url=${encodeURIComponent('/precios')}`;
  };

  // Manejar checkout
  const handleCheckout = async (priceId: string, planKey: string) => {
    // Si el usuario no está autenticado, iniciar el flujo de registro
    if (!isAuthenticated) {
      console.log('User not authenticated, starting registration flow');
      handleRegisterAndCheckout(priceId, planKey);
      return;
    }

    try {
      console.log('Starting checkout for authenticated user:', { priceId, planKey });
      
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

      console.log('Checkout response:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Checkout error response:', errorData);
        
        // Si necesita onboarding, redirigir
        if (errorData.redirectUrl) {
          console.log('Redirecting to onboarding:', errorData.redirectUrl);
          window.location.href = errorData.redirectUrl;
          return;
        }
        
        if (response.status === 401) {
          // Usuario no autenticado, redirigir a login
          console.log('401 error, redirecting to login');
          window.location.href = `/api/auth/login?post_login_redirect_url=${encodeURIComponent('/precios')}`;
          return;
        }
        
        // Intentar obtener el mensaje de error del servidor
        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Obtener la URL de redirección
      const data = await response.json();
      console.log('Checkout success response:', data);
      
      if (data.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error) {
      console.error('Error en checkout:', error);
      
      // Mostrar mensaje de error al usuario
      if (error instanceof Error) {
        alert(`Error al procesar el checkout: ${error.message}`);
      } else {
        alert('Error desconocido al procesar el checkout');
      }
    }
  };

  // Renderizar loading state si está verificando autenticación
  if (isCheckingAuth) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vetify-accent-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Precios Profesionales B2B
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Soluciones completas para clínicas veterinarias profesionales
        </p>
        
        {/* Toggle facturación */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-6 py-3 shadow-lg border border-gray-200 dark:border-gray-700">
            <span className={`text-sm transition-colors ${!isYearly ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Mensual
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-vetify-accent-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm transition-colors ${isYearly ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Anual
            </span>
          </div>
          {isYearly && (
            <Badge className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Ahorra hasta 20%
            </Badge>
          )}
        </div>
      </div>

      {/* Estado de carga y error */}
      {pricingLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vetify-accent-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando planes...</span>
        </div>
      )}
      
      {pricingError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">Error al cargar los planes: {pricingError}</p>
        </div>
      )}

      {/* Tarjetas de precios */}
      {!pricingLoading && !pricingError && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {pricingPlans.map((product: PricingPlan) => {
          const price = getProductPrice(product.id);
          const { isCurrentPlan, isUpgrade } = getPlanStatus(product.id);
          const planConfig = COMPLETE_PLANS[product.id.toUpperCase() as keyof typeof COMPLETE_PLANS];
          
          if (!price) return null;

          return (
            <div
              key={product.id}
              className={`relative rounded-2xl border-2 p-6 shadow-lg transition-all duration-200 hover:shadow-xl ${
                planConfig?.popular
                  ? 'border-vetify-accent-500 bg-vetify-accent-50 dark:bg-vetify-accent-900/20 dark:border-vetify-accent-400'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Badge */}
              {planConfig?.badge && typeof planConfig.badge === 'string' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className={`${planConfig.badgeColor || 'bg-blue-600 text-white'} dark:bg-blue-900 dark:text-blue-200`}>
                    {planConfig.badge}
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {product.description}
                </p>
                
                {/* Precio */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPriceFromCents(price.unitAmount)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    /{isYearly ? 'año' : 'mes'}
                  </span>
                  {isYearly && (
                    <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Ahorra {calculateAnnualDiscount(product.id)}% al año
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {product.features && Array.isArray(product.features) && product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckIcon className="h-4 w-4 text-vetify-accent-500 dark:text-vetify-accent-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{typeof feature === 'string' ? feature : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                {isCurrentPlan ? (
                  <Button 
                    disabled 
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  >
                    Plan Actual
                  </Button>
                ) : !isAuthenticated ? (
                  <Button
                    onClick={() => handleRegisterAndCheckout(price.id, product.id)}
                    className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
                      planConfig?.popular
                        ? 'bg-vetify-accent-600 hover:bg-vetify-accent-700 dark:bg-vetify-accent-500 dark:hover:bg-vetify-accent-600'
                        : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
                    } text-white`}
                  >
                    Iniciar Prueba Gratuita
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(price.id, product.id)}
                    className={`w-full ${
                      planConfig?.popular
                        ? 'bg-vetify-accent-600 hover:bg-vetify-accent-700 dark:bg-vetify-accent-500 dark:hover:bg-vetify-accent-600'
                        : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
                    } text-white transition-colors`}
                  >
                    {isUpgrade ? 'Actualizar Plan' : 
                     product.id === 'empresa' ? 'Contactar Ventas' : 'Iniciar Prueba Gratuita'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Información adicional */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        {!isAuthenticated && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              🚀 ¡Comienza tu prueba gratuita de 30 días! Solo necesitas crear una cuenta
            </p>
          </div>
        )}
        <p className="mb-2">
          ✅ Todos los planes incluyen <strong className="text-gray-900 dark:text-white">30 días de prueba gratuita</strong>
        </p>
        <p className="mb-2">
          ✅ Cancela en cualquier momento • Sin contratos • Soporte en español
        </p>
        <p>
          ¿Necesitas ayuda para elegir? <Link href="/contacto" className="text-vetify-accent-600 dark:text-vetify-accent-400 hover:underline">Contacta con nosotros</Link>
        </p>
      </div>
    </div>
  );
} 