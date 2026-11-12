import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickBooking } from '@/components/public/QuickBooking';
import { createMockPublicTenant, createMockPublicService } from '../../../utils/public-test-factories';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock useThemeAware hook
jest.mock('@/hooks/useThemeAware', () => ({
  useThemeAware: () => ({ isDark: false }),
}));

// Mock theme utilities
jest.mock('@/lib/themes', () => ({
  getTheme: () => ({
    id: 'modern',
    name: 'Modern',
    colors: {
      primary: '#75a99c',
      text: '#1a1a1a',
      textMuted: '#6b7280',
      cardBg: '#ffffff',
      background: '#f9fafb',
      backgroundAlt: '#f3f4f6',
      border: '#e5e7eb',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      headingWeight: 700,
    },
    layout: {
      borderRadius: '0.5rem',
    },
  }),
  getThemeClasses: () => ({
    button: 'rounded-lg',
    card: 'border',
    input: 'rounded-lg border',
  }),
}));

// Mock color-utils
jest.mock('@/lib/color-utils', () => ({
  generateDarkColors: () => ({
    text: '#f9fafb',
    textMuted: '#9ca3af',
    cardBg: '#1f2937',
    background: '#111827',
    backgroundAlt: '#1f2937',
    border: '#374151',
  }),
}));

// Mock date-format utility
jest.mock('@/lib/utils/date-format', () => ({
  formatDate: (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('QuickBooking', () => {
  const defaultTenant = createMockPublicTenant({
    slug: 'test-clinic',
    publicServices: [
      createMockPublicService({ title: 'Consulta General', description: 'General consultation', price: '$500' }),
      createMockPublicService({ title: 'Vacunación', description: 'Pet vaccinations', price: '$300' }),
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render the booking form section', () => {
      render(<QuickBooking tenant={defaultTenant} />);

      expect(screen.getByRole('heading', { name: 'Agenda tu Cita' })).toBeInTheDocument();
      expect(screen.getByText('Completa el formulario y nos contactaremos contigo para confirmar tu cita')).toBeInTheDocument();
    });

    it('should render customer contact section', () => {
      render(<QuickBooking tenant={defaultTenant} />);

      expect(screen.getByText('Información de Contacto')).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render appointment details section', () => {
      render(<QuickBooking tenant={defaultTenant} />);

      expect(screen.getByText('Detalles de la Cita')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/nombre de tu mascota/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tipo de servicio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fecha preferida/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<QuickBooking tenant={defaultTenant} />);

      expect(screen.getByRole('button', { name: 'Solicitar Cita' })).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(<QuickBooking tenant={defaultTenant} />);

      expect(screen.getByLabelText(/notas adicionales/i)).toBeInTheDocument();
    });
  });

  describe('Service Selection', () => {
    it('should display tenant services in dropdown', () => {
      render(<QuickBooking tenant={defaultTenant} />);

      const serviceSelect = screen.getByLabelText(/tipo de servicio/i);
      expect(serviceSelect).toBeInTheDocument();

      // Check options
      const options = serviceSelect.querySelectorAll('option');
      expect(options[1].textContent).toContain('Consulta General');
      expect(options[2].textContent).toContain('Vacunación');
    });

    it('should show default services when tenant has none configured', () => {
      const tenantNoServices = createMockPublicTenant({
        slug: 'test-clinic',
        publicServices: null,
      });

      render(<QuickBooking tenant={tenantNoServices} />);

      const serviceSelect = screen.getByLabelText(/tipo de servicio/i);
      const options = serviceSelect.querySelectorAll('option');

      expect(options[1].textContent).toContain('Consulta General');
      expect(options[2].textContent).toContain('Vacunación');
      expect(options[3].textContent).toContain('Emergencia');
    });

    it("should list the clinic's catalog services over the legacy config", () => {
      render(
        <QuickBooking
          tenant={defaultTenant}
          services={[
            { name: 'Consulta Felina', price: 450, publicPriceLabel: null },
            { name: 'Pensión', price: 0, publicPriceLabel: 'Consultar' },
          ]}
        />
      );

      const serviceSelect = screen.getByLabelText(/tipo de servicio/i);
      const options = Array.from(serviceSelect.querySelectorAll('option')).map((o) => o.textContent);

      expect(options).toEqual([
        'Selecciona un servicio',
        'Consulta Felina - $450.00',
        'Pensión - Consultar',
        'Otro (especificar)',
      ]);
    });

    it('should have "Otro" option in services', () => {
      render(<QuickBooking tenant={defaultTenant} />);

      const serviceSelect = screen.getByLabelText(/tipo de servicio/i);
      const options = Array.from(serviceSelect.querySelectorAll('option'));

      expect(options.some(o => o.value === 'otro')).toBe(true);
    });

    it('should show custom service input when "Otro" is selected', async () => {
      render(<QuickBooking tenant={defaultTenant} />);

      const serviceSelect = screen.getByLabelText(/tipo de servicio/i);
      await act(async () => {
        fireEvent.change(serviceSelect, { target: { value: 'otro' } });
      });

      expect(screen.getByLabelText(/describe el servicio/i)).toBeInTheDocument();
    });
  });

  describe('Customer Lookup', () => {
    const lookupResponse = (pets: Array<{ id: string; name: string }>) => ({
      ok: true,
      json: () => Promise.resolve({ success: true, pets }),
    });

    async function typeNameAndPhone(name: string, phone: string) {
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: name } });
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: phone } });
      });
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
    }

    it('should send the full phone and the name as second factor after debounce', async () => {
      mockFetch.mockResolvedValueOnce(lookupResponse([]));

      render(<QuickBooking tenant={defaultTenant} />);
      await typeNameAndPhone('Juan García', '55 1234 5678');

      expect(mockFetch).toHaveBeenCalledWith('/api/public/customer-lookup', expect.any(Object));
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        tenantSlug: 'test-clinic',
        phone: '55 1234 5678',
        customerName: 'Juan García',
      });
    });

    it('should not trigger lookup with invalid phone (less than 10 digits)', async () => {
      render(<QuickBooking tenant={defaultTenant} />);
      await typeNameAndPhone('Juan García', '12345');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not trigger lookup with a phone but no name or email', async () => {
      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '5512345678' } });
      });
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show the caller pets as selection buttons when the lookup returns them', async () => {
      mockFetch.mockResolvedValueOnce(lookupResponse([
        { id: 'pet-1', name: 'Firulais' },
        { id: 'pet-2', name: 'Luna' },
      ]));

      render(<QuickBooking tenant={defaultTenant} />);
      await typeNameAndPhone('Juan García', '5512345678');

      await waitFor(() => {
        expect(screen.getByText(/selecciona una de tus mascotas/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /firulais/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /luna/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /nueva mascota/i })).toBeInTheDocument();
      });
    });

    it('should keep the plain pet input when the lookup returns no pets', async () => {
      mockFetch.mockResolvedValueOnce(lookupResponse([]));

      render(<QuickBooking tenant={defaultTenant} />);
      await typeNameAndPhone('Juan García', '5512345678');

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nombre de tu mascota/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/te reconocemos/i)).not.toBeInTheDocument();
    });

    it('should not change the name the caller typed', async () => {
      mockFetch.mockResolvedValueOnce(lookupResponse([{ id: 'pet-1', name: 'Firulais' }]));

      render(<QuickBooking tenant={defaultTenant} />);
      await typeNameAndPhone('juan garcia', '5512345678');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /firulais/i })).toBeInTheDocument();
      });
      expect((screen.getByLabelText(/nombre completo/i) as HTMLInputElement).value).toBe('juan garcia');
    });
  });

  describe('Pet Selection', () => {
    async function showPets() {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, pets: [{ id: 'pet-1', name: 'Firulais' }] }),
      });

      render(<QuickBooking tenant={defaultTenant} />);
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan García' } });
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '5512345678' } });
      });
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /firulais/i })).toBeInTheDocument();
      });
    }

    it('should select pet when clicked', async () => {
      await showPets();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /firulais/i }));
      });

      // Button should be styled as selected (has theme color background)
      expect(screen.getByRole('button', { name: /firulais/i })).toHaveClass('text-white');
    });

    it('should show name input when "Nueva mascota" is selected', async () => {
      await showPets();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /nueva mascota/i }));
      });

      expect(screen.getByPlaceholderText(/nombre de la nueva mascota/i)).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    // Regression: min used the UTC date, so from 18:00 in Mexico City the
    // clinic's own today could no longer be picked.
    it('should set min date to today in the clinic timezone', () => {
      jest.useFakeTimers({ now: new Date('2026-11-17T03:00:00.000Z') }); // 21:00 on the 16th in CDMX
      try {
        render(<QuickBooking tenant={{ ...defaultTenant, timeZone: 'America/Mexico_City' }} />);

        const dateInput = screen.getByLabelText(/fecha preferida/i);
        expect(dateInput).toHaveAttribute('min', '2026-11-16');
      } finally {
        jest.useRealTimers();
      }
    });

    it('should fetch availability when date is selected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            date: '2025-02-15',
            workingDay: true,
            availableSlots: [
              { dateTime: '2025-02-15T10:00:00Z', time: '10:00', displayTime: '10:00 AM', period: 'morning' },
              { dateTime: '2025-02-15T14:00:00Z', time: '14:00', displayTime: '2:00 PM', period: 'afternoon' },
            ],
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      const dateInput = screen.getByLabelText(/fecha preferida/i);
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: '2025-02-15' } });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/public/availability')
      );
    });

    it('should show time slots after date selection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            date: '2025-02-15',
            workingDay: true,
            availableSlots: [
              { dateTime: '2025-02-15T10:00:00Z', time: '10:00', displayTime: '10:00 AM', period: 'morning' },
            ],
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      const dateInput = screen.getByLabelText(/fecha preferida/i);
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: '2025-02-15' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Mañana')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '10:00 AM' })).toBeInTheDocument();
      });
    });

    it('should show message for non-working day', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            date: '2025-02-16',
            workingDay: false,
            availableSlots: [],
            message: 'Día no laborable',
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      const dateInput = screen.getByLabelText(/fecha preferida/i);
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: '2025-02-16' } });
      });

      await waitFor(() => {
        // The component shows the message from availability.message or a default message
        expect(screen.getByText('Día no laborable')).toBeInTheDocument();
      });
    });

    it('should show message when no slots available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            date: '2025-02-15',
            workingDay: true,
            availableSlots: [],
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      const dateInput = screen.getByLabelText(/fecha preferida/i);
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: '2025-02-15' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/no hay horarios disponibles/i)).toBeInTheDocument();
      });
    });

    it('should group morning and afternoon slots', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            date: '2025-02-15',
            workingDay: true,
            availableSlots: [
              { dateTime: '2025-02-15T10:00:00Z', time: '10:00', displayTime: '10:00 AM', period: 'morning' },
              { dateTime: '2025-02-15T14:00:00Z', time: '14:00', displayTime: '2:00 PM', period: 'afternoon' },
            ],
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      const dateInput = screen.getByLabelText(/fecha preferida/i);
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: '2025-02-15' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Mañana')).toBeInTheDocument();
        expect(screen.getByText('Tarde')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form and show success state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            appointmentRequest: {
              id: 'appt-1',
              petName: 'Firulais',
              service: 'Consulta General',
              preferredDate: '2025-02-15',
              status: 'PENDING',
            },
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      // Fill form
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), {
          target: { value: 'Juan García' },
        });
        fireEvent.change(screen.getByLabelText(/teléfono/i), {
          target: { value: '5551234567' },
        });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), {
          target: { value: 'Firulais' },
        });
      });

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      await waitFor(() => {
        expect(screen.getByText('¡Solicitud Enviada!')).toBeInTheDocument();
      });
    });

    it('should show error state on submission failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<QuickBooking tenant={defaultTenant} />);

      // Fill minimum required fields
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), {
          target: { value: 'Juan García' },
        });
        fireEvent.change(screen.getByLabelText(/teléfono/i), {
          target: { value: '5551234567' },
        });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), {
          target: { value: 'Firulais' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      await waitFor(() => {
        expect(screen.getByText('Error al enviar solicitud')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), {
          target: { value: 'Juan' },
        });
        fireEvent.change(screen.getByLabelText(/teléfono/i), {
          target: { value: '5551234567' },
        });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), {
          target: { value: 'Firulais' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
      });
    });

    it('should reset form on retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), {
          target: { value: 'Juan' },
        });
        fireEvent.change(screen.getByLabelText(/teléfono/i), {
          target: { value: '5551234567' },
        });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), {
          target: { value: 'Firulais' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
      });

      // Should show form again
      expect(screen.getByRole('heading', { name: 'Agenda tu Cita' })).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should show a generic confirmation without identifying the caller', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Solicitud de cita recibida',
          data: {
            appointmentRequest: { id: 'appt-1', petName: 'Firulais', status: 'PENDING' },
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan' } });
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '5551234567' } });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), { target: { value: 'Firulais' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      await waitFor(() => {
        expect(screen.getByText('¡Solicitud Enviada!')).toBeInTheDocument();
      });
      expect(screen.queryByText(/te reconocemos/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /iniciar sesión/i })).not.toBeInTheDocument();
    });

    it('should show appointment summary after submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            appointmentRequest: { id: 'appt-1', petName: 'Firulais', service: 'Consulta', status: 'PENDING' },
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan García' } });
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '5551234567' } });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), { target: { value: 'Firulais' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      await waitFor(() => {
        expect(screen.getByText(/detalles de tu solicitud/i)).toBeInTheDocument();
        expect(screen.getByText('Juan García')).toBeInTheDocument();
        expect(screen.getByText('Firulais')).toBeInTheDocument();
      });
    });

    it('should show "Volver al inicio" link after success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            appointmentRequest: { id: 'appt-1', petName: 'Firulais', status: 'PENDING' },
          },
        }),
      });

      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan' } });
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '5551234567' } });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), { target: { value: 'Firulais' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /volver al inicio/i });
        expect(homeLink).toHaveAttribute('href', '/test-clinic');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: {} }),
          }), 1000)
        )
      );

      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan' } });
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '5551234567' } });
        fireEvent.change(screen.getByPlaceholderText(/nombre de tu mascota/i), { target: { value: 'Firulais' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cita' }));
      });

      expect(screen.getByRole('button', { name: /enviando solicitud/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enviando solicitud/i })).toBeDisabled();
    });

    it('should show loading spinner during customer lookup', async () => {
      // Create a never-resolving promise to keep the loading state
      let resolvePromise: ((value: unknown) => void) | undefined;
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      render(<QuickBooking tenant={defaultTenant} />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan García' } });
        fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '5512345678' } });
      });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Should show loading spinner - look for the Loader2 component with animate-spin
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Clean up - resolve the promise to avoid hanging
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ success: true, pets: [] }),
        });
      }
    });
  });
});
