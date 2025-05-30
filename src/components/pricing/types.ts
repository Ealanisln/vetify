export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  PREMIUM = 'PREMIUM',
}

export interface PlanFeature {
  name: string;
  description?: string;
  free: string | number | boolean;
  basic: string | number | boolean;
  professional: string | number | boolean;
  premium: string | number | boolean;
}

export interface Plan {
  type: PlanType;
  name: string;
  description: string;
  pricing: {
    monthly: number;
    annual: number;
    monthlyWithDiscount?: number; // For launch discount
    annualWithDiscount?: number; // For launch discount
  };
  features: PlanFeature[];
  recommended?: boolean;
  isPopular?: boolean;
  badge?: string;
}

export interface PricingPlansProps {
  onSelectPlan: (planType: PlanType, billingCycle: 'monthly' | 'annual') => void;
}

export interface BillingCycleToggleProps {
  billingCycle: 'monthly' | 'annual';
  onBillingCycleChange: (cycle: 'monthly' | 'annual') => void;
}

export interface PricingCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  onSelectPlan: (planType: PlanType, billingCycle: 'monthly' | 'annual') => void;
}

export interface FeatureComparisonTableProps {
  plans: Plan[];
}

export interface FAQItem {
  question: string;
  answer: string;
} 