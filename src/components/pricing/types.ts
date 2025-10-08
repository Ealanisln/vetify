// Tipos para el sistema de pricing
export interface PricingPlan {
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

export interface APIPlan {
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

export interface SubscriptionData {
  hasSubscription: boolean;
  subscriptionStatus: string;
  planName?: string;
  subscriptionId?: string;
  customerId?: string;
  subscriptionEndsAt?: string;
  isTrialPeriod?: boolean;
}
