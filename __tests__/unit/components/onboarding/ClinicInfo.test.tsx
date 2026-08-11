/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClinicInfo } from '@/app/onboarding/steps/ClinicInfo';

const user = { id: 'user-1', email: 'vet@example.com', name: 'Vet' };

describe('ClinicInfo — country selector', () => {
  let mockFetch: jest.Mock;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    // Slug availability check
    mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ available: true }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the country select defaulting to the detected country', () => {
    render(
      <ClinicInfo user={user} onSubmit={jest.fn()} isSubmitting={false} detectedCountry="CL" />
    );

    const select = screen.getByLabelText(/país/i) as HTMLSelectElement;
    expect(select.value).toBe('CL');
  });

  it('defaults to México when no country is detected', () => {
    render(<ClinicInfo user={user} onSubmit={jest.fn()} isSubmitting={false} />);

    const select = screen.getByLabelText(/país/i) as HTMLSelectElement;
    expect(select.value).toBe('MX');
  });

  it('includes the chosen country in the submit payload', async () => {
    const onSubmit = jest.fn();
    render(
      <ClinicInfo user={user} onSubmit={onSubmit} isSubmitting={false} detectedCountry="MX" />
    );

    fireEvent.change(screen.getByLabelText(/nombre de la clínica/i), {
      target: { value: 'Vet Andes' },
    });
    fireEvent.change(screen.getByLabelText(/país/i), { target: { value: 'CO' } });

    // Wait for the slug availability check to settle so submit is enabled
    await waitFor(() => {
      expect(screen.getByText(/URL disponible/i)).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByRole('button', { name: /empezar gratis/i }).closest('form')!);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ clinicName: 'Vet Andes', countryCode: 'CO' })
      );
    });
  });
});
