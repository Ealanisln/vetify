
import { getPlanKeyFromName, resolveCheckoutPlanKey } from '../pricing-config';

describe('getPlanKeyFromName', () => {
  it('maps plan names to plan keys', () => {
    expect(getPlanKeyFromName('Plan Básico')).toBe('BASICO');
    expect(getPlanKeyFromName('Plan Profesional')).toBe('PROFESIONAL');
    expect(getPlanKeyFromName('Corporativo')).toBe('CORPORATIVO');
  });

  it('falls back to PROFESIONAL when the name is missing', () => {
    expect(getPlanKeyFromName(null)).toBe('PROFESIONAL');
  });
});

describe('resolveCheckoutPlanKey', () => {
  // Regression: every prod tenant has planName = null, so an expired BASICO
  // trial was sent to the PROFESIONAL checkout.
  it('uses planType when planName is null', () => {
    expect(resolveCheckoutPlanKey({ planType: 'BASICO', planName: null })).toBe('BASICO');
    expect(resolveCheckoutPlanKey({ planType: 'CORPORATIVO', planName: null })).toBe('CORPORATIVO');
  });

  it('prefers planType over planName when both exist', () => {
    expect(resolveCheckoutPlanKey({ planType: 'BASICO', planName: 'Plan Profesional' })).toBe('BASICO');
  });

  it('falls back to planName when planType is missing', () => {
    expect(resolveCheckoutPlanKey({ planType: null, planName: 'Plan Básico' })).toBe('BASICO');
  });

  it('defaults to PROFESIONAL when nothing is known', () => {
    expect(resolveCheckoutPlanKey({ planType: null, planName: null })).toBe('PROFESIONAL');
  });
});
