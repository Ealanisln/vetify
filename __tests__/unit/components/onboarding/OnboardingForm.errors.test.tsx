/**
 * @jest-environment jsdom
 *
 * A failed POST /api/onboarding used to only console.error: the spinner
 * stopped and nothing told the user what happened. The form must show a
 * Spanish error in a role="alert", keep what the user typed, and let them retry.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import type { UserWithTenant } from '@/types';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
}));
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));
jest.mock('@/lib/analytics/meta-events', () => ({
  trackCompleteRegistration: jest.fn(),
  trackStartTrial: jest.fn(),
}));

const user = { id: 'user-1', email: 'vet@example.com', name: 'Vet' } as unknown as UserWithTenant;

type OnboardingResponse = { status: number; body?: unknown; invalidJson?: boolean } | 'network-error';

let onboardingResponses: OnboardingResponse[];

function mockFetch() {
  global.fetch = jest.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/onboarding/check-slug')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ available: true }) });
    }
    const next = onboardingResponses.shift();
    if (!next) return new Promise(() => {}); // pending: the request is in flight
    if (next === 'network-error') return Promise.reject(new TypeError('Failed to fetch'));
    return Promise.resolve({
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: () => (next.invalidJson ? Promise.reject(new SyntaxError('Unexpected token <')) : Promise.resolve(next.body)),
    });
  }) as unknown as typeof fetch;
}

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/nombre de la clínica/i), {
    target: { value: 'Clínica Norte' },
  });
  await waitFor(() => expect(screen.getByText(/URL disponible/i)).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /empezar gratis/i }));
}

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  onboardingResponses = [];
  mockFetch();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('OnboardingForm – submit errors', () => {
  it('shows a generic Spanish error on a 500 and keeps the form filled', async () => {
    onboardingResponses = [{ status: 500, body: { message: 'Error interno del servidor' } }];
    render(<OnboardingForm user={user} />);

    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/no pudimos crear tu clínica/i);
    expect(screen.getByLabelText(/nombre de la clínica/i)).toHaveValue('Clínica Norte');
    expect(screen.getByRole('button', { name: /empezar gratis/i })).toBeEnabled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('asks the user to wait on a 429', async () => {
    onboardingResponses = [{ status: 429, body: { error: 'Too many requests' } }];
    render(<OnboardingForm user={user} />);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos, espera un momento');
  });

  it('points to the session on a 403', async () => {
    onboardingResponses = [{ status: 403, body: { error: 'Forbidden' } }];
    render(<OnboardingForm user={user} />);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/sesión/i);
  });

  it('shows the Spanish validation message the server returns on a 400', async () => {
    onboardingResponses = [
      {
        status: 400,
        body: {
          message: 'Datos inválidos',
          errors: [{ message: 'El nombre de la clínica no puede pasar de 100 caracteres' }],
        },
      },
    ];
    render(<OnboardingForm user={user} />);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El nombre de la clínica no puede pasar de 100 caracteres'
    );
  });

  it('never shows an English server message', async () => {
    onboardingResponses = [{ status: 400, body: { message: 'Invalid CSRF token' } }];
    render(<OnboardingForm user={user} />);

    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/CSRF/);
    expect(alert).toHaveTextContent(/no pudimos crear tu clínica/i);
  });

  it('handles a non-JSON error body and a network failure', async () => {
    onboardingResponses = [{ status: 502, invalidJson: true }, 'network-error'];
    render(<OnboardingForm user={user} />);

    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos crear tu clínica/i);

    fireEvent.click(screen.getByRole('button', { name: /empezar gratis/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/conexión/i);
  });

  it('clears the error when the user retries', async () => {
    onboardingResponses = [{ status: 500, body: { message: 'Error interno del servidor' } }];
    render(<OnboardingForm user={user} />);

    await fillAndSubmit();
    await screen.findByRole('alert');

    // Second attempt stays in flight: the stale error must be gone meanwhile.
    fireEvent.click(screen.getByRole('button', { name: /empezar gratis/i }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByText(/creando tu clínica/i)).toBeInTheDocument();
  });
});
