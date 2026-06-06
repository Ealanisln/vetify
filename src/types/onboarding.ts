// Type definitions for onboarding flow

export interface ClinicInfoData {
  clinicName: string;
  slug: string;
  phone?: string;
  address?: string;
}

export interface OnboardingState {
  clinicInfo?: ClinicInfoData;
  isSubmitting: boolean;
}

// El plan es opcional: el onboarding crea el tenant con el plan por default
// (Profesional / trial) y el usuario lo elige después.
export interface OnboardingRequest extends ClinicInfoData {
  planKey?: 'BASICO' | 'PROFESIONAL' | 'CORPORATIVO';
  billingInterval?: 'monthly' | 'yearly';
}

export type OnboardingError =
  | { type: 'PLAN_NOT_FOUND'; planKey: string }
  | { type: 'SLUG_TAKEN'; slug: string }
  | { type: 'VALIDATION'; field: string; message: string }
  | { type: 'TENANT_CREATION_FAILED'; error: string }; 