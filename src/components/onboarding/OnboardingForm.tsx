"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithTenant } from '@/types';
import { PlanSelection } from '@/app/onboarding/steps/PlanSelection';
import { ClinicInfo } from '@/app/onboarding/steps/ClinicInfo';
import { Confirmation } from '@/app/onboarding/steps/Confirmation';
import { OnboardingProgress } from './OnboardingProgress';
import type { OnboardingState } from '@/types/onboarding';

interface OnboardingFormProps {
  user: UserWithTenant;
}

export function OnboardingForm({ user }: OnboardingFormProps) {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'plan',
    isSubmitting: false
  });

  const handlePlanSelect = (plan: OnboardingState['selectedPlan']) => {
    setState(prev => ({
      ...prev,
      selectedPlan: plan,
      currentStep: 'clinic'
    }));
  };

  const handleClinicInfo = (info: OnboardingState['clinicInfo']) => {
    setState(prev => ({
      ...prev,
      clinicInfo: info,
      currentStep: 'confirmation'
    }));
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep === 'confirmation' ? 'clinic' : 'plan'
    }));
  };

  const handleSubmit = async () => {
    if (!state.selectedPlan || !state.clinicInfo) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planKey: state.selectedPlan.key,
          billingInterval: state.selectedPlan.billingInterval,
          ...state.clinicInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 400 && errorData.message?.includes('ya tiene una clínica')) {
          // User already has a tenant, redirect to dashboard
          console.log('User already has a clinic, redirecting to dashboard');
          router.push('/dashboard');
          router.refresh();
          return;
        }
        
        throw new Error(errorData.message || 'Error al crear la clínica');
      }

      const data = await response.json();
      console.log('Onboarding successful:', data);

      // Redirect to dashboard after successful onboarding
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Onboarding error:', err);
      // You might want to show an error message here
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <OnboardingProgress currentStep={state.currentStep} />
      
      {state.currentStep === 'plan' && (
        <PlanSelection 
          onNext={handlePlanSelect}
          initialSelection={state.selectedPlan}
        />
      )}
      
      {state.currentStep === 'clinic' && (
        <ClinicInfo
          user={user ? {
            id: user.id,
            email: user.email,
            name: user.name || undefined
          } : null}
          onNext={handleClinicInfo}
          onBack={handleBack}
          initialData={state.clinicInfo}
        />
      )}
      
      {state.currentStep === 'confirmation' && (
        <Confirmation
          plan={state.selectedPlan!}
          clinicInfo={state.clinicInfo!}
          onBack={handleBack}
          isSubmitting={state.isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
} 