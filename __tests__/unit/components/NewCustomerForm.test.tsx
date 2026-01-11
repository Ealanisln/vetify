import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewCustomerForm } from '@/components/customers/NewCustomerForm';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock LocationSelector
jest.mock('@/components/locations/LocationSelector', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
    <div data-testid="location-selector">
      <select
        data-testid="location-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seleccionar ubicación</option>
        <option value="location-1">Location 1</option>
      </select>
    </div>
  ),
}));

// Mock theme utilities
jest.mock('@/utils/theme-colors', () => ({
  getThemeClasses: () => '',
}));

// Mock toast - define inline to avoid hoisting issues
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Get reference to mocked toast for assertions
import { toast as mockToast } from 'sonner';
const mockedToast = mockToast as jest.Mocked<typeof mockToast>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('NewCustomerForm', () => {
  const defaultProps = {
    tenantId: 'tenant-123',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render customer information section', () => {
      render(<NewCustomerForm {...defaultProps} />);

      expect(screen.getByText('Información del Cliente')).toBeInTheDocument();
    });

    it('should render all customer form fields', () => {
      render(<NewCustomerForm {...defaultProps} />);

      expect(screen.getByText('Nombre Completo *')).toBeInTheDocument();
      // Email and Teléfono appear as both labels and options, so look for the labels specifically
      expect(screen.getAllByText('Email').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Teléfono').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Método de Contacto Preferido')).toBeInTheDocument();
      expect(screen.getByText('Dirección')).toBeInTheDocument();
      expect(screen.getByText('Notas')).toBeInTheDocument();
    });

    it('should render pets section with empty state', () => {
      render(<NewCustomerForm {...defaultProps} />);

      expect(screen.getByText('Mascotas del Cliente')).toBeInTheDocument();
      expect(screen.getByText('No hay mascotas agregadas')).toBeInTheDocument();
      expect(screen.getByText('Puedes agregar mascotas después de crear el cliente')).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<NewCustomerForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Crear Cliente' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('should render add pet button', () => {
      render(<NewCustomerForm {...defaultProps} />);

      // Button has different text for desktop/mobile
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      expect(addPetButton).toBeDefined();
    });

    it('should render LocationSelector', () => {
      render(<NewCustomerForm {...defaultProps} />);

      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });
  });

  describe('Customer Form Field Updates', () => {
    it('should update name field', () => {
      render(<NewCustomerForm {...defaultProps} />);

      const inputs = document.querySelectorAll('input[type="text"]');
      const nameInput = inputs[0]; // First text input is name

      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      expect(nameInput).toHaveValue('Juan Pérez');
    });

    it('should update email field', () => {
      render(<NewCustomerForm {...defaultProps} />);

      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'juan@test.com' } });

      expect(emailInput).toHaveValue('juan@test.com');
    });

    it('should update phone field', () => {
      render(<NewCustomerForm {...defaultProps} />);

      const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '+52 55 1234 5678' } });

      expect(phoneInput).toHaveValue('+52 55 1234 5678');
    });

    it('should update contact method', () => {
      render(<NewCustomerForm {...defaultProps} />);

      const contactMethodSelect = screen.getAllByRole('combobox')[0];

      fireEvent.change(contactMethodSelect, { target: { value: 'email' } });

      expect(contactMethodSelect).toHaveValue('email');
    });

    it('should update notes textarea', () => {
      render(<NewCustomerForm {...defaultProps} />);

      const notesTextarea = document.querySelector('textarea') as HTMLTextAreaElement;

      fireEvent.change(notesTextarea, { target: { value: 'Cliente frecuente' } });

      expect(notesTextarea).toHaveValue('Cliente frecuente');
    });
  });

  describe('Pet Management', () => {
    it('should add pet when add button clicked', () => {
      render(<NewCustomerForm {...defaultProps} />);

      // Find and click add pet button
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      // Should show pet form
      expect(screen.getByText('Mascota #1')).toBeInTheDocument();
      expect(screen.queryByText('No hay mascotas agregadas')).not.toBeInTheDocument();
    });

    it('should add multiple pets', () => {
      render(<NewCustomerForm {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );

      // Add two pets
      fireEvent.click(addPetButton!);
      fireEvent.click(addPetButton!);

      expect(screen.getByText('Mascota #1')).toBeInTheDocument();
      expect(screen.getByText('Mascota #2')).toBeInTheDocument();
    });

    it('should remove pet when remove button clicked', () => {
      render(<NewCustomerForm {...defaultProps} />);

      // Add a pet first
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      expect(screen.getByText('Mascota #1')).toBeInTheDocument();

      // Find and click remove button (trash icon button)
      const allButtons = screen.getAllByRole('button');
      const removeButton = allButtons.find(btn =>
        btn.querySelector('svg')?.classList.contains('h-4') &&
        btn.textContent === ''
      );

      if (removeButton) {
        fireEvent.click(removeButton);
      }

      // Empty state should be back
      expect(screen.getByText('No hay mascotas agregadas')).toBeInTheDocument();
    });

    it('should update pet form fields', () => {
      render(<NewCustomerForm {...defaultProps} />);

      // Add a pet
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      // Find pet name input (the one after customer form inputs)
      const textInputs = document.querySelectorAll('input[type="text"]');
      // First text input is customer name, skip to pet inputs
      const petNameInput = Array.from(textInputs).find(input =>
        input.closest('.space-y-6 > div:last-of-type')
      ) || textInputs[textInputs.length - 3]; // Pet name, breed, microchip

      fireEvent.change(petNameInput, { target: { value: 'Max' } });

      expect(petNameInput).toHaveValue('Max');
    });

    it('should show pet form fields', () => {
      render(<NewCustomerForm {...defaultProps} />);

      // Add a pet
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      // Check for pet form labels
      expect(screen.getByText('Nombre *')).toBeInTheDocument();
      expect(screen.getByText('Especie *')).toBeInTheDocument();
      expect(screen.getByText('Raza *')).toBeInTheDocument();
      expect(screen.getByText('Fecha de Nacimiento *')).toBeInTheDocument();
      expect(screen.getByText('Género *')).toBeInTheDocument();
      expect(screen.getByText('Peso')).toBeInTheDocument();
      expect(screen.getByText('Microchip')).toBeInTheDocument();
      expect(screen.getByText('Esterilizado/Castrado')).toBeInTheDocument();
    });

    it('should show species options in pet form', () => {
      render(<NewCustomerForm {...defaultProps} />);

      // Add a pet
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      // Check species options
      expect(screen.getByText('Perro')).toBeInTheDocument();
      expect(screen.getByText('Gato')).toBeInTheDocument();
      expect(screen.getByText('Ave')).toBeInTheDocument();
      expect(screen.getByText('Conejo')).toBeInTheDocument();
      expect(screen.getByText('Reptil')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit customer without pets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      // Fill customer name (required)
      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      // Submit
      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"name":"Juan Pérez"'),
        });
      });
    });

    it('should submit customer with pets', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'customer-123' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pet: { id: 'pet-123', name: 'Max' } }),
        } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      // Fill customer name
      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      // Add a pet
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      // Fill pet info (name, breed, date)
      const textInputs = document.querySelectorAll('input[type="text"]');
      const petNameInput = textInputs[1]; // Second text input is pet name
      const breedInput = textInputs[2]; // Third is breed

      fireEvent.change(petNameInput, { target: { value: 'Max' } });
      fireEvent.change(breedInput, { target: { value: 'Labrador' } });

      const dateInput = document.querySelectorAll('input[type="date"]')[0];
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        // First: Create customer
        expect(mockFetch).toHaveBeenCalledWith('/api/customers', expect.any(Object));
      });

      await waitFor(() => {
        // Then: Create pet
        expect(mockFetch).toHaveBeenCalledWith('/api/pets', expect.any(Object));
      });
    });

    it('should include tenantId in submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"tenantId":"tenant-123"'),
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
      });
    });
  });

  describe('Success Modal', () => {
    it('should show success modal after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('¡Cliente creado exitosamente!')).toBeInTheDocument();
      });
    });

    it('should display customer name in modal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
      });
    });

    it('should display pet info in modal when pets created', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'customer-123' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pet: { id: 'pet-123', name: 'Max' } }),
        } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      // Fill customer name
      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      // Add a pet with required fields
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      const textInputs = document.querySelectorAll('input[type="text"]');
      fireEvent.change(textInputs[1], { target: { value: 'Max' } }); // Pet name
      fireEvent.change(textInputs[2], { target: { value: 'Labrador' } }); // Breed

      const dateInput = document.querySelectorAll('input[type="date"]')[0];
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Se agregó la mascota: Max/)).toBeInTheDocument();
      });
    });

    it('should navigate to appointments when button clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('¡Cliente creado exitosamente!')).toBeInTheDocument();
      });

      // Click create appointment button
      const appointmentButton = screen.getByRole('button', { name: /Crear Cita/ });
      fireEvent.click(appointmentButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/dashboard/appointments/new')
      );
    });

    it('should navigate to customers when view list button clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('¡Cliente creado exitosamente!')).toBeInTheDocument();
      });

      // Click view customers button
      const viewButton = screen.getByRole('button', { name: /Ver Lista de Clientes/ });
      fireEvent.click(viewButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/customers');
    });
  });

  describe('Error Handling', () => {
    it('should show toast error on customer creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email already exists' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Email already exists');
      });
    });

    it('should show default error message when no message provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Error al crear cliente');
      });
    });

    it('should continue with customer creation when pet creation fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'customer-123' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          text: async () => 'Pet creation failed',
        } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      // Fill customer name
      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      // Add a pet with required fields
      const buttons = screen.getAllByRole('button');
      const addPetButton = buttons.find(btn =>
        btn.textContent?.includes('Agregar Mascota') || btn.textContent?.includes('Agregar')
      );
      fireEvent.click(addPetButton!);

      const textInputs = document.querySelectorAll('input[type="text"]');
      fireEvent.change(textInputs[1], { target: { value: 'Max' } });
      fireEvent.change(textInputs[2], { target: { value: 'Labrador' } });

      const dateInput = document.querySelectorAll('input[type="date"]')[0];
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      // Should still show success (customer was created)
      await waitFor(() => {
        expect(screen.getByText('¡Cliente creado exitosamente!')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create pet'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cancel Navigation', () => {
    it('should navigate back when cancel clicked', () => {
      render(<NewCustomerForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Double Submit Prevention', () => {
    it('should prevent multiple submissions on rapid clicks', async () => {
      // Create a delayed mock that we can control
      let resolveFirst: (value: Response) => void;
      const firstCallPromise = new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      });

      mockFetch.mockReturnValueOnce(firstCallPromise);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      const form = document.querySelector('form') as HTMLFormElement;

      // Submit the form multiple times rapidly (simulating double-click)
      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);

      // Should only have called fetch once despite multiple submits
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Resolve the promise to clean up
      resolveFirst!({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      await waitFor(() => {
        expect(screen.getByText('¡Cliente creado exitosamente!')).toBeInTheDocument();
      });
    });

    it('should allow new submission after previous submission completes with error', async () => {
      // First submission fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      } as Response);

      // Second submission succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      const form = document.querySelector('form') as HTMLFormElement;

      // First submission
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Server error');
      });

      // Second submission should be allowed after error
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should disable submit button while submitting', async () => {
      // Never-resolving promise to keep loading state
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<NewCustomerForm {...defaultProps} />);

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

      const submitButton = screen.getByRole('button', { name: 'Crear Cliente' });
      expect(submitButton).not.toBeDisabled();

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: 'Guardando...' });
        expect(loadingButton).toBeDisabled();
      });
    });
  });

  describe('Location Selection', () => {
    it('should include locationId in submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'customer-123' }),
      } as Response);

      render(<NewCustomerForm {...defaultProps} />);

      // Select location
      fireEvent.change(screen.getByTestId('location-select'), {
        target: { value: 'location-1' },
      });

      const nameInput = document.querySelectorAll('input[type="text"]')[0];
      fireEvent.change(nameInput, { target: { value: 'Juan' } });

      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"locationId":"location-1"'),
        });
      });
    });
  });

  describe('Contact Method Options', () => {
    it('should render all contact method options', () => {
      render(<NewCustomerForm {...defaultProps} />);

      // Find the contact method dropdown (first combobox)
      const contactMethodSelect = screen.getAllByRole('combobox')[0];

      // Check options exist in the select
      expect(contactMethodSelect.querySelector('option[value="phone"]')).toBeTruthy();
      expect(contactMethodSelect.querySelector('option[value="email"]')).toBeTruthy();
      expect(contactMethodSelect.querySelector('option[value="whatsapp"]')).toBeTruthy();
    });

    it('should default to phone contact method', () => {
      render(<NewCustomerForm {...defaultProps} />);

      const contactMethodSelect = screen.getAllByRole('combobox')[0];
      expect(contactMethodSelect).toHaveValue('phone');
    });
  });
});
