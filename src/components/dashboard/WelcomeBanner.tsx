'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sparkles,
  Rocket,
  Crown,
  X,
  CheckCircle,
  Gift,
  Zap,
  PawPrint
} from 'lucide-react';
import type { Tenant } from '@prisma/client';
import { ANIMATION_DURATION_SHORT } from '../../lib/constants';
import { setWithExpiry, getWithExpiry, getWelcomeBannerKey } from '../../lib/storage/expiring-storage';

interface WelcomeBannerProps {
  tenant: Tenant;
}

interface PlanConfig {
  icon: typeof Sparkles;
  title: string;
  description: string;
  bgGradient: string;
  iconColor: string;
  benefits: string[];
  emoji: string;
}

// Move PLAN_CONFIGS outside component to prevent recreation on every render
const PLAN_CONFIGS: Record<string, PlanConfig> = {
  'basico': {
    icon: Sparkles,
    title: '¡Bienvenido a Plan Básico!',
    description: 'Gracias por confiar en Vetify. Tu clínica ya está lista para comenzar.',
    bgGradient: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/40 dark:via-emerald-800/40 dark:to-teal-900/40',
    iconColor: 'text-green-600 dark:text-green-300',
    benefits: [
      'Hasta 500 mascotas',
      '3 usuarios veterinarios',
      'Historiales médicos completos'
    ],
    emoji: '🎉'
  },
  'profesional': {
    icon: Rocket,
    title: '¡Bienvenido a Plan Profesional!',
    description: 'Estás listo para llevar tu clínica al siguiente nivel con funciones avanzadas.',
    bgGradient: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/40 dark:via-amber-800/40 dark:to-yellow-900/40',
    iconColor: 'text-orange-600 dark:text-orange-300',
    benefits: [
      'Hasta 2,000 mascotas',
      '8 usuarios veterinarios',
      'Gestión multi-sucursal'
    ],
    emoji: '🚀'
  },
  'corporativo': {
    icon: Crown,
    title: '¡Bienvenido a Plan Corporativo!',
    description: 'Tienes acceso total a la solución más completa para tu organización veterinaria.',
    bgGradient: 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-900/40 dark:via-violet-800/40 dark:to-indigo-900/40',
    iconColor: 'text-purple-600 dark:text-purple-300',
    benefits: [
      'Mascotas ilimitadas',
      '20 usuarios veterinarios',
      'API personalizada'
    ],
    emoji: '👑'
  }
};

export function WelcomeBanner({ tenant }: WelcomeBannerProps) {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // `?success=subscription_created&plan=...` after checkout; `?welcome=1` after onboarding.
  const isSubscriptionWelcome =
    searchParams.get('success') === 'subscription_created' && !!searchParams.get('plan');
  const isTrialWelcome = !isSubscriptionWelcome && searchParams.get('welcome') === '1';

  // Determine if we should show the banner
  const checkShouldShow = useCallback(() => {
    if (!isSubscriptionWelcome && !isTrialWelcome) {
      return false;
    }

    // Check localStorage to ensure we only show once (with expiry support)
    const storageKey = isTrialWelcome
      ? `${getWelcomeBannerKey(tenant.id)}-trial`
      : getWelcomeBannerKey(tenant.id);
    const hasBeenShown = getWithExpiry<boolean>(storageKey);

    if (hasBeenShown) {
      return false;
    }

    // Mark as shown in localStorage (no expiry - persists until plan change)
    setWithExpiry(storageKey, true, Number.MAX_SAFE_INTEGER);
    return true;
  }, [isSubscriptionWelcome, isTrialWelcome, tenant.id]);

  // Show banner on mount if conditions are met
  useEffect(() => {
    const shouldShow = checkShouldShow();
    if (shouldShow) {
      // Small delay for smooth entrance animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, ANIMATION_DURATION_SHORT);
      return () => clearTimeout(timer);
    }
  }, [checkShouldShow]);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation before hiding
    setTimeout(() => {
      setIsVisible(false);
    }, ANIMATION_DURATION_SHORT);
  };

  if (!isVisible) {
    return null;
  }

  if (isTrialWelcome) {
    return (
      <div
        className={`transition-[opacity,transform] duration-300 ease-in-out ${
          isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        <Card className="bg-gradient-to-br from-[#f2f7f5] via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-emerald-900/30 dark:to-teal-900/30 border-2 border-[#d5e3df] dark:border-emerald-700/50 p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-white/15 backdrop-blur-sm border border-white/50 dark:border-white/30 shadow-lg text-[#75a99c] dark:text-emerald-300">
                <PawPrint className="h-8 w-8 md:h-10 md:w-10" />
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    🎉 ¡Bienvenido a Vetify!
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-200">
                    Tu periodo de prueba ya está activo: la clínica queda lista en cuanto registres a tu primer paciente.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 backdrop-blur-sm transition-colors text-gray-700 dark:text-gray-200 flex-shrink-0 border border-transparent hover:border-white/50 dark:hover:border-white/20"
                  aria-label="Cerrar banner de bienvenida"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <Link
                  href="/dashboard/pets/new"
                  className="inline-flex items-center justify-center rounded-md bg-[#75a99c] hover:bg-[#5b9788] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Registrar mi primera mascota
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Get plan configuration
  const planParam = searchParams.get('plan') || '';
  const normalizedPlan = planParam.toLowerCase();

  let planKey = 'profesional'; // default
  if (normalizedPlan.includes('básico') || normalizedPlan.includes('basico')) {
    planKey = 'basico';
  } else if (normalizedPlan.includes('corporativo') || normalizedPlan.includes('corporate')) {
    planKey = 'corporativo';
  }

  const config = PLAN_CONFIGS[planKey];
  const Icon = config.icon;

  return (
    <div
      className={`transition-[opacity,transform] duration-300 ease-in-out ${
        isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      <Card className={`${config.bgGradient} border-2 border-green-200 dark:border-green-700/50 p-6 md:p-8 shadow-xl relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 dark:bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 dark:bg-white/10 rounded-full blur-3xl translate-y-24 -translate-x-24" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Icon section */}
            <div className="flex-shrink-0">
              <div className={`p-4 rounded-2xl bg-white/90 dark:bg-white/15 backdrop-blur-sm border border-white/50 dark:border-white/30 shadow-lg ${config.iconColor}`}>
                <Icon className="h-8 w-8 md:h-10 md:w-10" />
              </div>
            </div>

            {/* Content section */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {config.emoji} {config.title}
                    </h2>
                    <Badge variant="outline" className="bg-white/70 dark:bg-white/10 border-green-600 dark:border-green-400 text-green-700 dark:text-green-300">
                      <Gift className="h-3 w-3 mr-1" />
                      Activado
                    </Badge>
                  </div>
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-200">
                    {config.description}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 backdrop-blur-sm transition-colors text-gray-700 dark:text-gray-200 flex-shrink-0 border border-transparent hover:border-white/50 dark:hover:border-white/20"
                  aria-label="Cerrar banner de bienvenida"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Benefits list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {config.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-white/50 dark:border-white/20 rounded-lg px-3 py-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300 flex-shrink-0" />
                    <span className="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-100">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA section */}
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button
                  onClick={handleClose}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg font-semibold"
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Comenzar a usar Vetify
                </Button>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Tu subscripción está activa y lista para usar
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
