/**
 * @jest-environment jsdom
 *
 * The onboarding promised "30 días gratis" even when a FREE_TRIAL promotion
 * gave a different trial length. The copy must show the real trial days.
 */
import { render, screen } from '@testing-library/react';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { TRIAL_PERIOD_DAYS } from '@/lib/constants';
import type { UserWithTenant } from '@/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));
jest.mock('@/lib/analytics/meta-events', () => ({
  trackCompleteRegistration: jest.fn(),
  trackStartTrial: jest.fn(),
}));

const user = { id: 'user-1', email: 'vet@example.com', name: 'Vet' } as unknown as UserWithTenant;

describe('OnboardingForm – trial length copy', () => {
  it('shows the promotion trial length when a FREE_TRIAL promo is active', () => {
    render(
      <OnboardingForm
        user={user}
        promoInfo={{ trialDays: 60, badgeText: '60 días gratis', description: 'Promo' }}
      />
    );

    expect(screen.getByText(/60 días gratis · Sin tarjeta/)).toBeInTheDocument();
    expect(screen.queryByText(/30 días gratis/)).not.toBeInTheDocument();
  });

  it('falls back to the default trial length without a promo', () => {
    render(<OnboardingForm user={user} />);

    expect(screen.getByText(new RegExp(`${TRIAL_PERIOD_DAYS} días gratis · Sin tarjeta`))).toBeInTheDocument();
  });
});
