// /dashboard/pets and /dashboard/pets/new used `plan.maxPets || 50`: an
// unlimited plan (-1) was always "at the limit", trials were capped at 50,
// deceased pets counted, and "Mejorar Plan" linked to a 404. Both pages now
// go through checkPetLimit (real code here, prisma mocked).
// Found by the flows audit (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { prismaMock } from '../../mocks/prisma';

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({ getKindeServerSession: jest.fn() }));

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  requireAuth: jest.fn(),
  requireActiveSubscription: jest.fn(),
}));

jest.mock('@/components/pets/AddPetForm', () => ({
  AddPetForm: ({ initialCustomerId }: { initialCustomerId?: string }) => (
    <div data-testid="add-pet-form">{initialCustomerId ?? 'none'}</div>
  ),
}));

jest.mock('@/app/dashboard/pets/PetsPageClient', () => ({
  PetsPageClient: () => null,
}));

import { requireAuth, requireActiveSubscription } from '@/lib/auth';
import AddPetPage from '@/app/dashboard/pets/new/page';
import PetsPage from '@/app/dashboard/pets/page';

const DAY = 24 * 60 * 60 * 1000;

const tenantWith = (maxPets: number | null) => ({
  id: 'tenant-1',
  subscriptionStatus: maxPets === null ? 'TRIALING' : 'ACTIVE',
  isTrialPeriod: maxPets === null,
  trialEndsAt: maxPets === null ? new Date(Date.now() + 10 * DAY) : null,
  subscriptionEndsAt: maxPets === null ? null : new Date(Date.now() + 20 * DAY),
  tenantSubscription:
    maxPets === null
      ? null
      : { plan: { maxPets, maxUsers: 10, storageGB: 5, maxCashRegisters: 1, features: {} } },
});

function setup(maxPets: number | null, alive: number, deceased = 0) {
  const tenant = tenantWith(maxPets);
  (requireAuth as jest.Mock).mockResolvedValue({ tenant, user: { id: 'u1' } });
  (requireActiveSubscription as jest.Mock).mockResolvedValue({ tenant, user: { id: 'u1' } });
  prismaMock.tenant.findUnique.mockResolvedValue(tenant as never);
  prismaMock.pet.count.mockImplementation((async (args?: { where?: { isDeceased?: boolean } }) =>
    args?.where?.isDeceased === false ? alive : alive + deceased) as never);
  prismaMock.user.count.mockResolvedValue(1);
  prismaMock.automationLog.count.mockResolvedValue(0);
  prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);
}

const renderNewPage = async (customerId?: string) =>
  render(await AddPetPage({ searchParams: Promise.resolve(customerId ? { customerId } : {}) }));

describe('/dashboard/pets/new', () => {
  it('shows the form on an unlimited plan', async () => {
    setup(-1, 800);
    await renderNewPage();
    expect(screen.getByTestId('add-pet-form')).toBeInTheDocument();
  });

  it('shows the form to a trial past 50 pets', async () => {
    setup(null, 60);
    await renderNewPage();
    expect(screen.getByTestId('add-pet-form')).toBeInTheDocument();
  });

  it('does not count deceased pets', async () => {
    setup(500, 499, 40);
    await renderNewPage();
    expect(screen.getByTestId('add-pet-form')).toBeInTheDocument();
  });

  it('at the limit, links "Mejorar Plan" to the subscription settings tab', async () => {
    setup(500, 500);
    await renderNewPage();

    expect(screen.queryByTestId('add-pet-form')).not.toBeInTheDocument();
    expect(screen.getByText(/límite de 500 mascotas/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mejorar Plan' })).toHaveAttribute(
      'href',
      '/dashboard/settings?tab=subscription'
    );
  });

  it('passes ?customerId= to the form', async () => {
    setup(500, 1);
    await renderNewPage('customer-7');
    expect(screen.getByTestId('add-pet-form')).toHaveTextContent('customer-7');
  });
});

describe('/dashboard/pets', () => {
  const petLimitProp = async () => {
    const element = (await PetsPage()) as ReactElement<{ petLimit: { canAdd: boolean; limit: number } }>;
    return element.props.petLimit;
  };

  it('lets an unlimited plan add pets', async () => {
    setup(-1, 800);
    expect(await petLimitProp()).toEqual(expect.objectContaining({ canAdd: true, limit: -1 }));
  });

  it('uses the default trial limit instead of 50', async () => {
    setup(null, 60);
    expect(await petLimitProp()).toEqual(expect.objectContaining({ canAdd: true, limit: 300 }));
  });

  it('blocks adding at the limit', async () => {
    setup(500, 500, 10);
    expect(await petLimitProp()).toEqual(expect.objectContaining({ canAdd: false, current: 500, limit: 500 }));
  });
});
