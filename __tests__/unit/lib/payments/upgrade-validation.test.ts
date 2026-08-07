/**
 * @jest-environment node
 */
import {
  UpgradeRequestSchema,
  PLAN_HIERARCHY,
  isValidUpgrade,
} from '@/lib/payments/upgrade-validation';

describe('UpgradeRequestSchema', () => {
  it.each(['BASICO', 'PROFESIONAL', 'CORPORATIVO'])(
    'accepts current plan key %s',
    (plan) => {
      const result = UpgradeRequestSchema.safeParse({ targetPlan: plan });
      expect(result.success).toBe(true);
    }
  );

  it.each(['CLINICA', 'EMPRESA', 'GUARDIAN', 'INVALID'])(
    'rejects legacy/unknown plan key %s',
    (plan) => {
      const result = UpgradeRequestSchema.safeParse({ targetPlan: plan });
      expect(result.success).toBe(false);
    }
  );

  it('defaults billingInterval to monthly and fromTrial to false', () => {
    const result = UpgradeRequestSchema.parse({ targetPlan: 'BASICO' });
    expect(result.billingInterval).toBe('monthly');
    expect(result.fromTrial).toBe(false);
  });

  it('accepts annual billing interval', () => {
    const result = UpgradeRequestSchema.parse({
      targetPlan: 'PROFESIONAL',
      billingInterval: 'annual',
    });
    expect(result.billingInterval).toBe('annual');
  });
});

describe('PLAN_HIERARCHY', () => {
  it('orders current plans BASICO < PROFESIONAL < CORPORATIVO', () => {
    expect(PLAN_HIERARCHY.BASICO).toBeLessThan(PLAN_HIERARCHY.PROFESIONAL);
    expect(PLAN_HIERARCHY.PROFESIONAL).toBeLessThan(PLAN_HIERARCHY.CORPORATIVO);
  });

  it('contains no legacy plan keys', () => {
    expect(PLAN_HIERARCHY).not.toHaveProperty('CLINICA');
    expect(PLAN_HIERARCHY).not.toHaveProperty('EMPRESA');
  });
});

describe('isValidUpgrade', () => {
  it('allows moving up one tier', () => {
    expect(isValidUpgrade('BASICO', 'PROFESIONAL')).toBe(true);
    expect(isValidUpgrade('PROFESIONAL', 'CORPORATIVO')).toBe(true);
  });

  it('allows skipping tiers upward', () => {
    expect(isValidUpgrade('BASICO', 'CORPORATIVO')).toBe(true);
  });

  it('rejects downgrades and same-tier moves', () => {
    expect(isValidUpgrade('PROFESIONAL', 'BASICO')).toBe(false);
    expect(isValidUpgrade('CORPORATIVO', 'PROFESIONAL')).toBe(false);
    expect(isValidUpgrade('BASICO', 'BASICO')).toBe(false);
  });

  it('rejects unknown plan keys', () => {
    expect(isValidUpgrade('CLINICA', 'CORPORATIVO')).toBe(false);
    expect(isValidUpgrade('BASICO', 'EMPRESA')).toBe(false);
  });
});
