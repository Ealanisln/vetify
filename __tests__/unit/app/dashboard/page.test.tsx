/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));
jest.mock('@/lib/dashboard', () => ({
  getDashboardStats: jest.fn(),
}));
jest.mock('@/lib/subscription/display', () => ({
  getPlanDisplay: () => ({ label: 'Prueba gratuita' }),
}));
jest.mock('@/components/dashboard', () => ({
  StatsCard: ({ title }: { title: string }) => <div data-testid="stats-card">{title}</div>,
  RecentPetsCard: () => <div data-testid="recent-pets" />,
  UpcomingAppointmentsCard: () => <div data-testid="upcoming-appointments" />,
  SubscriptionNotifications: () => null,
  WelcomeBanner: () => null,
  FirstRunCard: jest.requireActual('@/components/dashboard/FirstRunCard').FirstRunCard,
}));
jest.mock('@/components/subscription', () => ({
  PlanLimitsDisplay: () => <div data-testid="plan-limits" />,
}));

import { requireAuth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/dashboard';
import DashboardPage from '@/app/dashboard/page';

const mockRequireAuth = requireAuth as jest.Mock;
const mockGetDashboardStats = getDashboardStats as jest.Mock;

const tenant = {
  id: 'tenant-1',
  name: 'Clínica Test',
  isTrialPeriod: true,
  trialEndsAt: null,
  stripeSubscriptionId: null,
  planName: null,
  tenantSubscription: null,
};

function statsWith(totalPets: number) {
  return {
    totalPets,
    totalAppointments: 0,
    planLimits: { maxPets: 500 },
    recentPets: [],
    upcomingAppointments: [],
  };
}

async function renderPage() {
  const page = await DashboardPage();
  return render(page);
}

describe('DashboardPage first-run guidance', () => {
  beforeEach(() => {
    mockRequireAuth.mockResolvedValue({ user: { firstName: 'Ana', name: 'Ana' }, tenant });
  });

  describe('when the tenant has no pets', () => {
    beforeEach(() => {
      mockGetDashboardStats.mockResolvedValue(statsWith(0));
    });

    it('renders the first-run card above the stats grid', async () => {
      await renderPage();

      const heading = screen.getByRole('heading', { name: 'Registra tu primera mascota' });
      const firstStat = screen.getAllByTestId('stats-card')[0];
      expect(heading.compareDocumentPosition(firstStat) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.getAllByTestId('stats-card')).toHaveLength(3);
    });

    it('redirects the appointment quick action to pet registration', async () => {
      await renderPage();

      const hint = screen.getByRole('link', { name: /Registra una mascota primero/ });
      expect(hint).toHaveAttribute('href', '/dashboard/pets/new');
      expect(screen.queryByText('Nueva Cita')).not.toBeInTheDocument();
    });
  });

  describe('when the tenant already has pets', () => {
    beforeEach(() => {
      mockGetDashboardStats.mockResolvedValue(statsWith(3));
    });

    it('does not render the first-run card', async () => {
      await renderPage();

      expect(screen.queryByRole('heading', { name: 'Registra tu primera mascota' })).not.toBeInTheDocument();
    });

    it('keeps the regular appointment quick action', async () => {
      await renderPage();

      const quickAction = screen.getByRole('link', { name: /Nueva Cita/ });
      expect(quickAction).toHaveAttribute('href', '/dashboard/appointments/new');
      expect(screen.queryByText(/Registra una mascota primero/)).not.toBeInTheDocument();
    });
  });
});
