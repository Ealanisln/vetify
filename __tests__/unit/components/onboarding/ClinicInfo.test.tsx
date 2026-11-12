/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

  it('does not submit a clinic name made only of spaces', () => {
    const onSubmit = jest.fn();
    render(<ClinicInfo user={user} onSubmit={onSubmit} isSubmitting={false} />);

    fireEvent.change(screen.getByLabelText(/nombre de la clínica/i), {
      target: { value: '    ' },
    });

    const button = screen.getByRole('button', { name: /empezar gratis/i });
    expect(button).toBeDisabled();
    fireEvent.submit(button.closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends the trimmed clinic name', async () => {
    const onSubmit = jest.fn();
    render(<ClinicInfo user={user} onSubmit={onSubmit} isSubmitting={false} />);

    fireEvent.change(screen.getByLabelText(/nombre de la clínica/i), {
      target: { value: '  Vet Andes  ' },
    });
    await waitFor(() => expect(screen.getByText(/URL disponible/i)).toBeInTheDocument());

    fireEvent.submit(screen.getByRole('button', { name: /empezar gratis/i }).closest('form')!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ clinicName: 'Vet Andes' }));
  });
});

describe('ClinicInfo — slug availability check', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const slugChecks = (mockFetch: jest.Mock) =>
    mockFetch.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes('/api/onboarding/check-slug'));

  it('debounces the check while the user is typing', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ available: true }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    render(<ClinicInfo user={user} onSubmit={jest.fn()} isSubmitting={false} />);

    const slugInput = screen.getByLabelText(/url de tu clínica/i);
    for (const value of ['vet', 'vet-', 'vet-n', 'vet-no', 'vet-norte']) {
      fireEvent.change(slugInput, { target: { value } });
    }

    await waitFor(() => expect(screen.getByText(/URL disponible/i)).toBeInTheDocument());
    expect(slugChecks(mockFetch)).toEqual(['/api/onboarding/check-slug?slug=vet-norte']);
  });

  it('ignores a late response for a slug the user already changed', async () => {
    let resolveOld: (value: unknown) => void = () => {};
    const mockFetch = jest.fn((url: string) => {
      if (url.endsWith('slug=vet')) {
        // Slow response for the old prefix: says taken and suggests vet-1.
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      }
      return Promise.resolve({ json: () => Promise.resolve({ available: true }) });
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const onSubmit = jest.fn();
    render(<ClinicInfo user={user} onSubmit={onSubmit} isSubmitting={false} />);

    fireEvent.change(screen.getByLabelText(/nombre de la clínica/i), { target: { value: 'Vet' } });
    await waitFor(() => expect(slugChecks(mockFetch)).toContain('/api/onboarding/check-slug?slug=vet'));

    fireEvent.change(screen.getByLabelText(/nombre de la clínica/i), { target: { value: 'Vet Norte' } });
    await waitFor(() => expect(screen.getByText(/URL disponible/i)).toBeInTheDocument());

    // The stale response arrives last.
    await act(async () => {
      resolveOld({ json: () => Promise.resolve({ available: false, suggestion: 'vet-1' }) });
    });

    expect(screen.getByText(/URL disponible/i)).toBeInTheDocument();
    expect(screen.queryByText(/vet-1/)).not.toBeInTheDocument();

    fireEvent.submit(screen.getByRole('button', { name: /empezar gratis/i }).closest('form')!);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ slug: 'vet-norte' }));
  });
});
