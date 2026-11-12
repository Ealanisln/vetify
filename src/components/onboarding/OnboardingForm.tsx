"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { TRIAL_PERIOD_DAYS } from '@/lib/constants';
import { UserWithTenant } from '@/types';
import { COMPLETE_PLANS } from '@/lib/pricing-config';
import { ClinicInfo } from '../../app/onboarding/steps/ClinicInfo';
import { trackCompleteRegistration, trackStartTrial } from '@/lib/analytics/meta-events';
import type { PromoInfo } from '../../app/onboarding/OnboardingPageClient';

interface OnboardingFormProps {
  user: UserWithTenant;
  promoInfo?: PromoInfo | null;
  /** ISO alpha-2 country pre-detected server-side (x-vercel-ip-country). */
  detectedCountry?: string;
}

// El plan ya no se elige en el onboarding: el usuario entra con Profesional en
// trial y elige plan después (fin de trial / Configuración → suscripción).
const DEFAULT_PLAN = COMPLETE_PLANS.PROFESIONAL;
const DEFAULT_BILLING_INTERVAL = 'monthly' as const;

interface ClinicInfoData {
  clinicName: string;
  slug: string;
  countryCode: string;
  phone?: string;
  address?: string;
}

const GENERIC_ERROR = 'No pudimos crear tu clínica. Inténtalo de nuevo en unos momentos.';
const NETWORK_ERROR = 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

/** Server messages are only shown when they look Spanish (ours are; proxies/middleware may not be). */
const looksSpanish = (text: string) => /[áéíóúñ¿¡]|\b(el|la|los|las|del|para|debe|puede)\b/i.test(text);

interface OnboardingErrorBody {
  message?: unknown;
  errors?: Array<{ message?: unknown }>;
}

function getSubmitErrorMessage(status: number, body: OnboardingErrorBody | null): string {
  if (status === 429) return 'Demasiados intentos, espera un momento e inténtalo de nuevo.';
  if (status === 401 || status === 403) {
    return 'Tu sesión expiró o no tienes permiso para continuar. Vuelve a iniciar sesión e inténtalo de nuevo.';
  }
  if (status >= 500) return GENERIC_ERROR;

  const candidates = [body?.errors?.[0]?.message, body?.message];
  const spanish = candidates.find(
    (text): text is string => typeof text === 'string' && text !== 'Datos inválidos' && looksSpanish(text)
  );
  return spanish ?? GENERIC_ERROR;
}

export function OnboardingForm({ user, promoInfo, detectedCountry }: OnboardingFormProps) {
  const trialDays = promoInfo?.trialDays ?? TRIAL_PERIOD_DAYS;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (clinicInfo: ClinicInfoData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    let response: Response;
    try {
      response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // El plan se aplica por default en el servidor (Profesional / trial).
        body: JSON.stringify(clinicInfo),
      });
    } catch (err) {
      console.error('Onboarding request failed:', err);
      setSubmitError(NETWORK_ERROR);
      setIsSubmitting(false);
      return;
    }

    try {
      if (!response.ok) {
        const errorData: OnboardingErrorBody | null = await response.json().catch(() => null);

        // Handle specific error cases
        if (
          response.status === 400 &&
          typeof errorData?.message === 'string' &&
          errorData.message.includes('ya tiene una clínica')
        ) {
          // User already has a tenant, redirect to dashboard
          router.push('/dashboard');
          router.refresh();
          return;
        }

        console.error('Onboarding error:', response.status, errorData);
        setSubmitError(getSubmitErrorMessage(response.status, errorData));
        return;
      }

      await response.json();

      // Redirect to dashboard immediately (better UX). The welcome flag lets the
      // dashboard greet the new trial and point to the first pet registration.
      router.push('/dashboard?welcome=1');
      router.refresh();

      // Track conversion events in background (fire-and-forget)
      // Don't block the redirect for tracking
      try {
        // Track CompleteRegistration event
        trackCompleteRegistration({
          plan_name: DEFAULT_PLAN.name,
          plan_key: DEFAULT_PLAN.key,
          billing_interval: DEFAULT_BILLING_INTERVAL,
          is_trial: true, // New registrations always start with trial
          clinic_name: clinicInfo.clinicName,
          currency: 'MXN',
          value: DEFAULT_PLAN.monthlyPrice,
          status: 'completed'
        });

        // Track StartTrial event for new trial periods
        trackStartTrial({
          plan_name: DEFAULT_PLAN.name,
          plan_key: DEFAULT_PLAN.key,
          trial_end_date: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
          currency: 'MXN',
          value: DEFAULT_PLAN.monthlyPrice,
          trial_duration_days: trialDays
        });
      } catch (error) {
        // Log tracking errors but don't block the user experience
        console.error('[Meta Pixel] Tracking error during onboarding:', error);
        Sentry.captureException(error, {
          tags: { category: 'meta_pixel', operation: 'onboarding_tracking' },
          contexts: {
            onboarding: {
              plan: DEFAULT_PLAN.name,
              step: 'completion'
            }
          }
        });
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setSubmitError(GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <ClinicInfo
        user={user ? {
          id: user.id,
          email: user.email,
          name: user.name || undefined
        } : null}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        detectedCountry={detectedCountry}
      />
    </div>
  );
}
