import { z } from 'zod';

/**
 * Current subscription plan keys. Legacy B2B keys (CLINICA, EMPRESA) were
 * retired with the BASICO/PROFESIONAL/CORPORATIVO restructure.
 */
export const PLAN_KEYS = ['BASICO', 'PROFESIONAL', 'CORPORATIVO'] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const PLAN_HIERARCHY: Record<PlanKey, number> = {
  BASICO: 1,
  PROFESIONAL: 2,
  CORPORATIVO: 3,
};

export const UpgradeRequestSchema = z.object({
  targetPlan: z.enum(PLAN_KEYS),
  billingInterval: z.enum(['monthly', 'annual']).default('monthly'),
  fromTrial: z.boolean().default(false),
});

export type UpgradeRequest = z.infer<typeof UpgradeRequestSchema>;

/**
 * An upgrade is only valid toward a strictly higher tier of a known plan.
 */
export function isValidUpgrade(currentPlan: string, targetPlan: string): boolean {
  const currentTier = PLAN_HIERARCHY[currentPlan as PlanKey];
  const targetTier = PLAN_HIERARCHY[targetPlan as PlanKey];
  if (!currentTier || !targetTier) return false;
  return targetTier > currentTier;
}
