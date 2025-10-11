// Type definitions for onboarding flow

export interface OnboardingState {
  currentStep: 'plan' | 'clinic' | 'confirmation';
  selectedPlan?: {
    key: 'BASICO' | 'PROFESIONAL' | 'CORPORATIVO';
    billingInterval: 'monthly' | 'yearly';
  };
  clinicInfo?: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  };
  isSubmitting: boolean;
}

export interface OnboardingRequest {
  planKey: 'BASICO' | 'PROFESIONAL' | 'CORPORATIVO';
  billingInterval: 'monthly' | 'yearly';
  clinicInfo: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  };
}

export type OnboardingError =
  | { type: 'PLAN_NOT_FOUND'; planKey: string }
  | { type: 'SLUG_TAKEN'; slug: string }
  | { type: 'VALIDATION'; field: string; message: string }
  | { type: 'TENANT_CREATION_FAILED'; error: string }; 