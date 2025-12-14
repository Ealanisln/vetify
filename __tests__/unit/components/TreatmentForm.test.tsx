import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TreatmentForm } from '@/components/medical/TreatmentForm';

// Mock InlineVeterinarianCreator
jest.mock('@/components/medical/InlineVeterinarianCreator', () => ({
  InlineVeterinarianCreator: ({ onVeterinarianCreated, buttonText }: {
    onVeterinarianCreated: (staff: { id: string; name: string; position: string; licenseNumber: string }) => void;
    buttonText: string;
  }) => (
    <button
      type="button"
      data-testid="add-vet-button"
      onClick={() => onVeterinarianCreated({
        id: 'new-vet-id',
        name: 'Dr. Test',
        position: 'Veterinario',
        licenseNumber: 'LIC123',
      })}
    >
      {buttonText}
    </button>
  ),
}));

// Mock theme utilities
jest.mock('@/utils/theme-colors', () => ({
  getThemeClasses: () => '',
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe('TreatmentForm', () => {
  const defaultProps = {
    petId: 'pet-123',
    tenantId: 'tenant-123',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  const mockStaff = [
    { id: 'vet-1', name: 'Dr. García', position: 'Veterinario', licenseNumber: 'VET001' },
    { id: 'vet-2', name: 'Dr. López', position: 'Cirujano', licenseNumber: 'VET002' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for staff fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockStaff,
    } as Response);
  });

  describe('Form Rendering', () => {
    it('should render all form fields', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Tipo de Tratamiento/)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Nombre del medicamento/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Dosis/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Frecuencia/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Duración/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Instrucciones/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Veterinario responsable/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fecha de inicio/)).toBeInTheDocument();
    });

    it('should render treatment type options', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Vacunación')).toBeInTheDocument();
      });

      expect(screen.getByText('Desparasitación')).toBeInTheDocument();
      expect(screen.getByText('Antipulgas/Garrapatas')).toBeInTheDocument();
      expect(screen.getByText('Otro Preventivo')).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardar Tratamiento' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });
  });

  describe('Staff Loading', () => {
    it('should fetch staff members on mount', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/medical/staff?tenantId=tenant-123');
      });
    });

    it('should populate veterinarian dropdown with staff', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Dr\. García - Veterinario/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Dr\. López - Cirujano/)).toBeInTheDocument();
    });

    it('should show warning when no veterinarians registered', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/No hay veterinarios registrados/)).toBeInTheDocument();
      });
    });

    it('should handle staff fetch error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading staff:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Medication Suggestions', () => {
    it('should display common medication suggestions', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Medicamentos comunes:')).toBeInTheDocument();
      });
    });

    it('should show at least 5 medication suggestion buttons', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole('button').filter(
          btn => !['Guardar Tratamiento', 'Cancelar', '+ Agregar'].includes(btn.textContent || '')
        );
        expect(suggestionButtons.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('Inline Veterinarian Creator', () => {
    it('should show add veterinarian button', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-vet-button')).toBeInTheDocument();
      });
    });

    it('should add new veterinarian to dropdown when created', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-vet-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('add-vet-button'));

      await waitFor(() => {
        expect(screen.getByText(/Dr\. Test - Veterinario/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockStaff } as Response) // Staff fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response); // Submit

      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre del medicamento/)).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/Nombre del medicamento/), {
        target: { value: 'Amoxicilina' },
      });
      fireEvent.change(screen.getByLabelText(/Dosis/), {
        target: { value: '250mg' },
      });
      fireEvent.change(screen.getByLabelText(/Frecuencia/), {
        target: { value: 'Cada 12 horas' },
      });
      fireEvent.change(screen.getByLabelText(/Instrucciones/), {
        target: { value: 'Administrar con alimento por 7 días' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Guardar Tratamiento' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/medical/treatments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });
    });

    it('should call onSuccess after successful submission', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockStaff } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);

      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre del medicamento/)).toBeInTheDocument();
      });

      // Fill minimum required fields
      fireEvent.change(screen.getByLabelText(/Nombre del medicamento/), {
        target: { value: 'Amoxicilina' },
      });
      fireEvent.change(screen.getByLabelText(/Dosis/), {
        target: { value: '250mg' },
      });
      fireEvent.change(screen.getByLabelText(/Frecuencia/), {
        target: { value: 'Cada 12 horas' },
      });
      fireEvent.change(screen.getByLabelText(/Instrucciones/), {
        target: { value: 'Administrar con alimento por 7 días' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Guardar Tratamiento' }));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockStaff } as Response)
        .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre del medicamento/)).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/Nombre del medicamento/), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Dosis/), {
        target: { value: '10mg' },
      });
      fireEvent.change(screen.getByLabelText(/Frecuencia/), {
        target: { value: 'Cada 24 horas' },
      });
      fireEvent.change(screen.getByLabelText(/Instrucciones/), {
        target: { value: 'Test instructions here' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Guardar Tratamiento' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    const errorCases = [
      { status: 400, message: 'Datos inválidos. Por favor verifica la información del tratamiento.' },
      { status: 401, message: 'Sesión expirada. Por favor inicia sesión nuevamente.' },
      { status: 403, message: 'Sin permisos para crear tratamientos. Contacta al administrador.' },
      { status: 409, message: 'Conflicto de horario. Este tratamiento interfiere con otro existente.' },
      { status: 500, message: 'Error del servidor. Por favor intenta nuevamente.' },
    ];

    errorCases.forEach(({ status, message }) => {
      it(`should show correct error for status ${status}`, async () => {
        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockStaff } as Response)
          .mockResolvedValueOnce({ ok: false, status } as Response);

        render(<TreatmentForm {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText(/Nombre del medicamento/)).toBeInTheDocument();
        });

        // Fill form
        fireEvent.change(screen.getByLabelText(/Nombre del medicamento/), {
          target: { value: 'Test' },
        });
        fireEvent.change(screen.getByLabelText(/Dosis/), {
          target: { value: '10mg' },
        });
        fireEvent.change(screen.getByLabelText(/Frecuencia/), {
          target: { value: 'Cada 24 horas' },
        });
        fireEvent.change(screen.getByLabelText(/Instrucciones/), {
          target: { value: 'Test instructions here' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Guardar Tratamiento' }));

        await waitFor(() => {
          expect(mockAlert).toHaveBeenCalledWith(`Error: ${message}`);
        });
      });
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button clicked', async () => {
      render(<TreatmentForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('With Consultation ID', () => {
    it('should include consultationId in form data', async () => {
      const propsWithConsultation = {
        ...defaultProps,
        consultationId: 'consultation-123',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockStaff } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);

      render(<TreatmentForm {...propsWithConsultation} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre del medicamento/)).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/Nombre del medicamento/), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Dosis/), {
        target: { value: '10mg' },
      });
      fireEvent.change(screen.getByLabelText(/Frecuencia/), {
        target: { value: 'Cada 24 horas' },
      });
      fireEvent.change(screen.getByLabelText(/Instrucciones/), {
        target: { value: 'Test instructions here' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Guardar Tratamiento' }));

      await waitFor(() => {
        const body = JSON.parse(mockFetch.mock.calls[1][1]?.body as string);
        expect(body.consultation_id).toBe('consultation-123');
      });
    });
  });
});
