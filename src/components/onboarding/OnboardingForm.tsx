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
}

// El plan ya no se elige en el onboarding: el usuario entra con Profesional en
// trial y elige plan después (fin de trial / Configuración → suscripción).
const DEFAULT_PLAN = COMPLETE_PLANS.PROFESIONAL;
const DEFAULT_BILLING_INTERVAL = 'monthly' as const;

interface ClinicInfoData {
  clinicName: string;
  slug: string;
  phone?: string;
  address?: string;
}

export function OnboardingForm({ user, promoInfo }: OnboardingFormProps) {
  const trialDays = promoInfo?.trialDays ?? TRIAL_PERIOD_DAYS;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (clinicInfo: ClinicInfoData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // El plan se aplica por default en el servidor (Profesional / trial).
        body: JSON.stringify(clinicInfo),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 400 && errorData.message?.includes('ya tiene una clínica')) {
          // User already has a tenant, redirect to dashboard
          router.push('/dashboard');
          router.refresh();
          return;
        }

        throw new Error(errorData.message || 'Error al crear la clínica');
      }

      await response.json();

      // Redirect to dashboard immediately (better UX)
      router.push('/dashboard');
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
      // You might want to show an error message here
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
      />
    </div>
  );
}
