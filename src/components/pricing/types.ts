export enum PlanType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
}

export interface PlanFeature {
  name: string;
  description?: string;
  basic: string | number | boolean;
  standard: string | number | boolean;
}

export interface Plan {
  type: PlanType;
  name: string;
  description: string;
  pricing: {
    monthly: number;
    annual: number;
  };
  features: PlanFeature[];
  recommended?: boolean;
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