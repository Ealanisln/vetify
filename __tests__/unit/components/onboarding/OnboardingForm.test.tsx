/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import type { UserWithTenant } from '@/types';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));
jest.mock('@/lib/analytics/meta-events', () => ({
  trackCompleteRegistration: jest.fn(),
  trackStartTrial: jest.fn(),
}));
jest.mock('@/app/onboarding/steps/ClinicInfo', () => ({
  ClinicInfo: ({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
    <button
      type="button"
      onClick={() => onSubmit({ clinicName: 'Vet Test', slug: 'vet-test', countryCode: 'MX' })}
    >
      Empezar gratis
    </button>
  ),
}));

const user = { id: 'user-1', email: 'vet@example.com', name: 'Vet' } as unknown as UserWithTenant;

describe('OnboardingForm redirect', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends the new tenant to the dashboard with the welcome flag', async () => {
    render(<OnboardingForm user={user} />);

    fireEvent.click(screen.getByRole('button', { name: 'Empezar gratis' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard?welcome=1');
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('sends an already-onboarded user to the plain dashboard', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'El usuario ya tiene una clínica' }),
    }) as unknown as typeof fetch;

    render(<OnboardingForm user={user} />);

    fireEvent.click(screen.getByRole('button', { name: 'Empezar gratis' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
