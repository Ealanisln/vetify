/**
 * @jest-environment node
 */

// Regression: validatePlanAction treated -1 (unlimited) as exhausted for
// WhatsApp and cash registers, and the built-in trial kept WhatsApp's raw -1
// as the limit, so it could never send. Unlimited must behave the same way
// for every limit. See docs/PENDIENTES.md ("Siguiente tanda").

import { prismaMock } from '../../mocks/prisma';
import {
  validatePlanAction,
  checkWhatsAppLimit,
  checkUserLimit,
  PlanLimitError,
} from '@/lib/plan-limits';

const FUTURE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

function paidTenant(plan: Record<string, unknown>) {
  return {
    id: 'tenant-1',
    subscriptionStatus: 'ACTIVE',
    isTrialPeriod: false,
    trialEndsAt: null,
    subscriptionEndsAt: FUTURE,
    tenantSubscription: {
      plan: {
        maxPets: 500,
        maxUsers: 3,
        storageGB: 5,
        maxCashRegisters: 1,
        features: { whatsappMessages: 100 },
        ...plan,
      },
    },
  };
}

const trialTenant = {
  id: 'tenant-1',
  subscriptionStatus: 'TRIALING',
  isTrialPeriod: true,
  trialEndsAt: FUTURE,
  subscriptionEndsAt: null,
  tenantSubscription: null,
};

function useTenant(tenant: unknown, usage: { pets?: number; users?: number; whatsapp?: number; drawers?: number } = {}) {
  prismaMock.tenant.findUnique.mockResolvedValue(tenant as never);
  prismaMock.pet.count.mockResolvedValue(usage.pets ?? 0);
  prismaMock.user.count.mockResolvedValue(usage.users ?? 0);
  prismaMock.automationLog.count.mockResolvedValue(usage.whatsapp ?? 0);
  prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);
  prismaMock.cashDrawer.count.mockResolvedValue(usage.drawers ?? 0);
}

describe('validatePlanAction with unlimited (-1) limits', () => {
  it('allows sending WhatsApp on a plan with unlimited messages', async () => {
    useTenant(paidTenant({ features: { whatsappMessages: -1 } }), { whatsapp: 5000 });

    await expect(validatePlanAction('tenant-1', 'sendWhatsApp')).resolves.toBeUndefined();
  });

  it('allows adding a cash register on a plan with unlimited registers', async () => {
    useTenant(paidTenant({ maxCashRegisters: -1 }), { drawers: 4 });

    await expect(validatePlanAction('tenant-1', 'addCashRegister', 2)).resolves.toBeUndefined();
  });

  it('allows adding users on a plan with unlimited users', async () => {
    useTenant(paidTenant({ maxUsers: -1 }), { users: 50 });

    await expect(validatePlanAction('tenant-1', 'addUser')).resolves.toBeUndefined();
  });

  it('allows adding pets on a plan with unlimited pets', async () => {
    useTenant(paidTenant({ maxPets: -1 }), { pets: 10000 });

    await expect(validatePlanAction('tenant-1', 'addPet')).resolves.toBeUndefined();
  });

  it('allows sending WhatsApp during the built-in trial (unlimited by default)', async () => {
    useTenant(trialTenant, { whatsapp: 3 });

    await expect(validatePlanAction('tenant-1', 'sendWhatsApp')).resolves.toBeUndefined();
  });

  it('still blocks a finite limit that is used up', async () => {
    useTenant(paidTenant({ maxCashRegisters: 1 }), { drawers: 1 });

    await expect(validatePlanAction('tenant-1', 'addCashRegister')).rejects.toBeInstanceOf(PlanLimitError);
  });

  it('still blocks a finite WhatsApp quota smaller than the requested quantity', async () => {
    useTenant(paidTenant({ features: { whatsappMessages: 100 } }), { whatsapp: 99 });

    await expect(validatePlanAction('tenant-1', 'sendWhatsApp', 2)).rejects.toBeInstanceOf(PlanLimitError);
  });
});

describe('limit checks report unlimited as -1', () => {
  it('reports trial WhatsApp as unlimited', async () => {
    useTenant(trialTenant, { whatsapp: 3 });

    await expect(checkWhatsAppLimit('tenant-1')).resolves.toEqual({
      canSend: true,
      current: 3,
      limit: -1,
      remaining: -1,
    });
  });

  it('reports unlimited users as -1', async () => {
    useTenant(paidTenant({ maxUsers: -1 }), { users: 7 });

    await expect(checkUserLimit('tenant-1')).resolves.toEqual({
      canAdd: true,
      current: 7,
      limit: -1,
      remaining: -1,
    });
  });
});
