import { z } from 'zod';
import type { Tenant } from '@prisma/client';

// Extend existing Tenant type with trial calculations
export interface TenantWithTrialInfo extends Tenant {
  daysRemaining: number;
  isExpired: boolean;
  isInGracePeriod: boolean;
  trialMessage: string;
  restrictedFeatures: string[];
}

// Trial status calculation result
export interface TrialStatus {
  status: 'active' | 'ending_soon' | 'expired' | 'grace_period' | 'converted';
  daysRemaining: number;
  displayMessage: string;
  bannerType: 'success' | 'warning' | 'danger' | 'info';
  showUpgradePrompt: boolean;
  blockedFeatures: FeatureAccess[];
}

// Feature access control
// Note: 'automations' kept for backward compatibility but not actively used
export interface FeatureAccess {
  feature: 'pets' | 'appointments' | 'inventory' | 'reports' | 'automations';
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
}

// Access check request schema
// Note: 'automations' removed as it's a future feature
export const TrialAccessSchema = z.object({
  tenantId: z.string().uuid().optional(), // Optional since it can be inferred from user
  feature: z.enum(['pets', 'appointments', 'inventory', 'reports']).optional(),
  action: z.enum(['view', 'create', 'update', 'delete']).optional().default('view')
});

export type TrialAccessCheck = z.infer<typeof TrialAccessSchema>;

// Result type for trial access checks
export interface TrialAccessResult {
  allowed: boolean;
  trialStatus?: TrialStatus;
  reason?: string;
  error?: string;
  redirectTo?: string;
  remainingQuota?: {
    feature: string;
    used: number;
    limit: number;
  };
}

// Result type for trial operations
export type TrialResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; redirectTo?: string };

// Trial extension request (for admin use)
export const TrialExtensionSchema = z.object({
  tenantId: z.string().uuid(),
  extensionDays: z.number().min(1).max(30),
  reason: z.string().min(1).max(500),
  extendedBy: z.string().uuid() // Admin user ID
});

export type TrialExtensionRequest = z.infer<typeof TrialExtensionSchema>;

// Trial access log entry
export interface TrialAccessLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  feature: string;
  action: string;
  allowed: boolean;
  denialReason?: string;
  requestPath?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

// Feature usage limits for trial accounts
export const TRIAL_LIMITS = {
  pets: 5,           // Max 5 pets during trial
  appointments: 20,  // Max 20 appointments during trial
  inventory: false,  // No inventory access during trial
  reports: false,    // No reports access during trial
  // FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
  // automations: false // No automations during trial
} as const;

// Grace period configuration
export const GRACE_PERIOD_DAYS = 3;

// Features that require paid subscription
// FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
export const PREMIUM_FEATURES = [
  'inventory',
  'reports'
  // 'automations' // Commented out - future feature
] as const;

// Features available during trial with limits
export const TRIAL_FEATURES = [
  'pets',
  'appointments'
] as const;

// Export feature type
// Note: 'automations' kept in type for backward compatibility but not used
export type Feature = 'pets' | 'appointments' | 'inventory' | 'reports' | 'automations';
export type TrialFeature = typeof TRIAL_FEATURES[number];
export type PremiumFeature = typeof PREMIUM_FEATURES[number];
