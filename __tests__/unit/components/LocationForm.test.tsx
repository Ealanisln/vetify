import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationForm from '@/components/locations/LocationForm';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock generateSlug
jest.mock('@/lib/location-utils', () => ({
  generateSlug: jest.fn((name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  ),
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('LocationForm', () => {
  const defaultProps = {
    mode: 'create' as const,
    tenantId: 'tenant-123',
  };

  const editProps = {
    mode: 'edit' as const,
    tenantId: 'tenant-123',
    initialData: {
      id: 'location-123',
      name: 'Test Location',
      slug: 'test-location',
      address: '123 Test St',
      phone: '+52 55 1234 5678',
      email: 'test@example.com',
      timezone: 'America/Mexico_City',
      isActive: true,
      isPrimary: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Form Rendering', () => {
    it('should render all three sections', () => {
      render(<LocationForm {...defaultProps} />);

      expect(screen.getByText('Información Básica')).toBeInTheDocument();
      expect(screen.getByText('Información de Contacto')).toBeInTheDocument();
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<LocationForm {...defaultProps} />);

      expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Slug/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Dirección/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Zona Horaria/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Establecer como ubicación principal/)).toBeInTheDocument();
    });

    it('should render Cancel and Submit buttons', () => {
      render(<LocationForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Ubicación' })).toBeInTheDocument();
    });

    it('should show "Guardar Cambios" button in edit mode', () => {
      render(<LocationForm {...editProps} />);

      expect(screen.getByRole('button', { name: 'Guardar Cambios' })).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should pre-populate fields from initialData', () => {
      render(<LocationForm {...editProps} />);

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('Test Location');
      expect(screen.getByLabelText(/Slug/)).toHaveValue('test-location');
      expect(screen.getByLabelText(/Dirección/)).toHaveValue('123 Test St');
      expect(screen.getByLabelText(/Teléfono/)).toHaveValue('+52 55 1234 5678');
      expect(screen.getByLabelText(/Email/)).toHaveValue('test@example.com');
    });

    it('should show isActive checkbox only in edit mode', () => {
      const { rerender } = render(<LocationForm {...defaultProps} />);
      expect(screen.queryByLabelText(/Ubicación activa/)).not.toBeInTheDocument();

      rerender(<LocationForm {...editProps} />);
      expect(screen.getByLabelText(/Ubicación activa/)).toBeInTheDocument();
    });

    it('should have isActive checkbox checked based on initialData', () => {
      render(<LocationForm {...editProps} />);

      const checkbox = screen.getByLabelText(/Ubicación activa/) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Slug Auto-Generation', () => {
    it('should auto-generate slug from name in create mode', async () => {
      render(<LocationForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/);
      fireEvent.change(nameInput, { target: { value: 'Clinica Centro' } });

      // Wait for useEffect to trigger
      await waitFor(() => {
        const slugInput = screen.getByLabelText(/Slug/) as HTMLInputElement;
        expect(slugInput.value).toBe('clinica-centro');
      });
    });

    it('should NOT auto-generate slug in edit mode', () => {
      render(<LocationForm {...editProps} />);

      const nameInput = screen.getByLabelText(/Nombre/);
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      // Slug should remain unchanged
      const slugInput = screen.getByLabelText(/Slug/) as HTMLInputElement;
      expect(slugInput.value).toBe('test-location');
    });
  });

  describe('Form Submission - Create', () => {
    it('should POST to /api/locations on create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-location' }),
      } as Response);

      render(<LocationForm {...defaultProps} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'New Location' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'new-location' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });
    });

    it('should include form data in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-location' }),
      } as Response);

      render(<LocationForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'Test Name' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'test-name' },
      });
      fireEvent.change(screen.getByLabelText(/Teléfono/), {
        target: { value: '5551234567' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
        expect(body.name).toBe('Test Name');
        expect(body.slug).toBe('test-name');
        expect(body.phone).toBe('5551234567');
      });
    });
  });

  describe('Form Submission - Edit', () => {
    it('should PUT to /api/locations/:id on edit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<LocationForm {...editProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/locations/location-123', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });
    });
  });

  describe('Success Flow', () => {
    it('should show success modal after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-location' }),
      } as Response);

      render(<LocationForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'New Location' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'new-location' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        expect(screen.getByText('Ubicación creada')).toBeInTheDocument();
      });
    });

    it('should show "Cambios guardados" message in edit mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<LocationForm {...editProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

      await waitFor(() => {
        expect(screen.getByText('Cambios guardados')).toBeInTheDocument();
      });
    });

    it('should redirect after success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-location' }),
      } as Response);

      render(<LocationForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'New Location' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'new-location' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        expect(screen.getByText('Ubicación creada')).toBeInTheDocument();
      });

      // Advance timers to trigger redirect
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/locations');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error banner on failed submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'El slug ya existe' }),
      } as Response);

      render(<LocationForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'New Location' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'existing-slug' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        expect(screen.getByText('El slug ya existe')).toBeInTheDocument();
      });
    });

    it('should show default error message when no error text provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      render(<LocationForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'New Location' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'new-location' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        expect(screen.getByText('Error al guardar ubicación')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show "Guardando..." during submission', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<LocationForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'New Location' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'new-location' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeInTheDocument();
      });
    });

    it('should disable buttons during submission', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<LocationForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Nombre/), {
        target: { value: 'New Location' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/), {
        target: { value: 'new-location' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Crear Ubicación' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
      });
    });
  });

  describe('Cancel Navigation', () => {
    it('should navigate to /dashboard/locations on cancel', () => {
      render(<LocationForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockPush).toHaveBeenCalledWith('/dashboard/locations');
    });
  });

  describe('Timezone Selection', () => {
    it('should render all timezone options', () => {
      render(<LocationForm {...defaultProps} />);

      const timezoneSelect = screen.getByLabelText(/Zona Horaria/);
      expect(timezoneSelect).toBeInTheDocument();

      // Check for some timezone options
      expect(screen.getByText('Ciudad de México (GMT-6)')).toBeInTheDocument();
      expect(screen.getByText('Tijuana (GMT-8)')).toBeInTheDocument();
      expect(screen.getByText('Cancún (GMT-5)')).toBeInTheDocument();
    });

    it('should default to America/Mexico_City', () => {
      render(<LocationForm {...defaultProps} />);

      const timezoneSelect = screen.getByLabelText(/Zona Horaria/) as HTMLSelectElement;
      expect(timezoneSelect.value).toBe('America/Mexico_City');
    });
  });

  describe('Form Field Updates', () => {
    it('should update isPrimary checkbox', () => {
      render(<LocationForm {...defaultProps} />);

      const checkbox = screen.getByLabelText(/Establecer como ubicación principal/) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('should update address textarea', () => {
      render(<LocationForm {...defaultProps} />);

      const addressInput = screen.getByLabelText(/Dirección/);
      fireEvent.change(addressInput, { target: { value: 'New Address' } });

      expect(addressInput).toHaveValue('New Address');
    });
  });
});
