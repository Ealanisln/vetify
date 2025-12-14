import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddPetForm } from '@/components/pets/AddPetForm';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
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
        <option value="location-2">Location 2</option>
      </select>
    </div>
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

describe('AddPetForm', () => {
  const mockCustomers = [
    { id: 'customer-1', name: 'Juan Pérez', phone: '+52 55 1234 5678', email: 'juan@test.com' },
    { id: 'customer-2', name: 'María García', phone: '+52 55 8765 4321', email: 'maria@test.com' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    // Default mock for customers fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCustomers,
    } as Response);
  });

  describe('Form Rendering', () => {
    it('should render owner and pet sections', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('👤 Información del Dueño')).toBeInTheDocument();
      });

      expect(screen.getByText('🐾 Información de la Mascota')).toBeInTheDocument();
    });

    it('should render all pet form fields', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ej: Firulais')).toBeInTheDocument();
      });

      // Check for labels by text (not by association)
      expect(screen.getByText('Especie *')).toBeInTheDocument();
      expect(screen.getByText('Raza')).toBeInTheDocument();
      expect(screen.getByText('Género *')).toBeInTheDocument();
      expect(screen.getByText('Fecha de nacimiento *')).toBeInTheDocument();
      expect(screen.getByText('Peso')).toBeInTheDocument();
      expect(screen.getByText('Número de microchip')).toBeInTheDocument();
      expect(screen.getByText(/Está esterilizado/)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Registrar Mascota' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('should render LocationSelector', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByTestId('location-selector')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Loading', () => {
    it('should fetch customers on mount', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/customers');
      });
    });

    it('should show loading state while fetching customers', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AddPetForm />);

      expect(screen.getByText('Cargando clientes...')).toBeInTheDocument();
    });

    it('should populate customer dropdown with fetched data', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      expect(screen.getByText('María García (+52 55 8765 4321)')).toBeInTheDocument();
    });

    it('should handle customer fetch error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AddPetForm />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading customers:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Customer Mode Toggle', () => {
    it('should show existing customer mode by default', async () => {
      render(<AddPetForm />);

      // Wait for customers to load (not just the label)
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Should show customer dropdown with loaded customers
      expect(screen.getByText('Cliente *')).toBeInTheDocument();

      // Customer dropdown should exist with the placeholder option
      const customerDropdown = screen.getAllByRole('combobox')[0];
      expect(customerDropdown).toBeInTheDocument();
      expect(customerDropdown).toHaveValue(''); // Empty value by default
    });

    it('should toggle to new customer mode when button clicked', async () => {
      render(<AddPetForm />);

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Find and click the "Nuevo Cliente" button (get all buttons and find the right one)
      const buttons = screen.getAllByRole('button');
      const newCustomerButton = buttons.find(btn => btn.textContent?.includes('Nuevo Cliente'));
      expect(newCustomerButton).toBeDefined();
      fireEvent.click(newCustomerButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ej: Juan Pérez')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Ej: +52 55 1234 5678')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ej: juan@email.com')).toBeInTheDocument();
    });

    it('should toggle back to existing customer mode', async () => {
      render(<AddPetForm />);

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Switch to new customer mode
      const buttons = screen.getAllByRole('button');
      const newCustomerButton = buttons.find(btn => btn.textContent?.includes('Nuevo Cliente'));
      fireEvent.click(newCustomerButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ej: Juan Pérez')).toBeInTheDocument();
      });

      // Switch back to existing customer mode
      const existingCustomerButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Cliente Existente')
      );
      fireEvent.click(existingCustomerButton!);

      await waitFor(() => {
        expect(screen.getByText('Cliente *')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Selection', () => {
    it('should show selected customer details', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Select a customer using the dropdown (first combobox is customer select)
      const customerSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(customerSelect, { target: { value: 'customer-1' } });

      await waitFor(() => {
        // Customer details box should appear
        expect(screen.getByText('📞 +52 55 1234 5678')).toBeInTheDocument();
        expect(screen.getByText('✉️ juan@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('Pet Form Data Binding', () => {
    it('should update pet name field', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ej: Firulais')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Ej: Firulais');
      fireEvent.change(nameInput, { target: { value: 'Max' } });

      expect(nameInput).toHaveValue('Max');
    });

    it('should update species field', async () => {
      render(<AddPetForm />);

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Get all comboboxes - the second one after customer select should be species
      const allComboboxes = screen.getAllByRole('combobox');
      // In the pet section: species, gender, weight unit. Plus customer select and location select
      // Order: customer select [0], location select (from mock), species, gender, weight unit
      // Find the one with "dog" as current value
      const speciesSelect = allComboboxes.find(cb => (cb as HTMLSelectElement).value === 'dog');
      expect(speciesSelect).toBeDefined();

      fireEvent.change(speciesSelect!, { target: { value: 'cat' } });

      expect(speciesSelect).toHaveValue('cat');
    });

    it('should update isNeutered checkbox', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText(/Está esterilizado/)).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should update weight field', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument();
      });

      const weightInput = screen.getByPlaceholderText('0.0');
      fireEvent.change(weightInput, { target: { value: '10.5' } });

      expect(weightInput).toHaveValue(10.5);
    });
  });

  describe('Form Submission - Existing Customer', () => {
    it('should submit with existing customer', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response) // Customers fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pet-123' }) } as Response); // Pet creation

      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Select customer (first combobox)
      const customerSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(customerSelect, { target: { value: 'customer-1' } });

      // Fill pet info
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });

      // Get date input by type
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"customerId":"customer-1"'),
        });
      });
    });

    it('should navigate to pets page after successful submission', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pet-123' }) } as Response);

      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Select customer (first combobox)
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'customer-1' } });

      // Fill pet info
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/pets');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should show success alert after submission', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pet-123' }) } as Response);

      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Select customer and fill form (first combobox is customer select)
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'customer-1' } });
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('¡Mascota registrada exitosamente!');
      });
    });
  });

  describe('Form Submission - New Customer', () => {
    it('should create new customer then pet', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response) // Customers fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-customer-123' }) } as Response) // Customer creation
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pet-123' }) } as Response); // Pet creation

      render(<AddPetForm />);

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Switch to new customer mode
      const buttons = screen.getAllByRole('button');
      const newCustomerButton = buttons.find(btn => btn.textContent?.includes('Nuevo Cliente'));
      fireEvent.click(newCustomerButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ej: Juan Pérez')).toBeInTheDocument();
      });

      // Fill new customer info
      fireEvent.change(screen.getByPlaceholderText('Ej: Juan Pérez'), { target: { value: 'Nuevo Cliente' } });
      fireEvent.change(screen.getByPlaceholderText('Ej: +52 55 1234 5678'), { target: { value: '5551234567' } });

      // Fill pet info
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        // First: Create customer
        expect(mockFetch).toHaveBeenCalledWith('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"name":"Nuevo Cliente"'),
        });
      });

      await waitFor(() => {
        // Then: Create pet with new customer ID
        expect(mockFetch).toHaveBeenCalledWith('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"customerId":"new-customer-123"'),
        });
      });
    });

    it('should show error if customer creation fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Email already exists' }),
        } as Response);

      render(<AddPetForm />);

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Switch to new customer mode
      const buttons = screen.getAllByRole('button');
      const newCustomerButton = buttons.find(btn => btn.textContent?.includes('Nuevo Cliente'));
      fireEvent.click(newCustomerButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ej: Juan Pérez')).toBeInTheDocument();
      });

      // Fill new customer info
      fireEvent.change(screen.getByPlaceholderText('Ej: Juan Pérez'), { target: { value: 'Test' } });

      // Fill pet info
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Email already exists');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error if no customer selected', async () => {
      render(<AddPetForm />);

      // Wait for customers to fully load first
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Fill pet info but don't select customer (leave dropdown at empty value)
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit without selecting a customer - use form submit directly
      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Debe seleccionar o crear un cliente');
      });
    });

    it('should show error when pet creation fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Microchip already registered' }),
        } as Response);

      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Select customer (first combobox)
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'customer-1' } });

      // Fill pet info
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Microchip already registered');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response)
        .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Select customer (first combobox)
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'customer-1' } });

      // Fill pet info
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Registrando...' })).toBeDisabled();
      });
    });
  });

  describe('Cancel Navigation', () => {
    it('should navigate back when cancel clicked', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Location Selection', () => {
    it('should update locationId when location selected', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockCustomers } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pet-123' }) } as Response);

      render(<AddPetForm />);

      // Wait for customers to load first
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez (+52 55 1234 5678)')).toBeInTheDocument();
      });

      // Select a location
      fireEvent.change(screen.getByTestId('location-select'), { target: { value: 'location-1' } });

      // Select customer (first combobox) and fill pet info
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'customer-1' } });
      fireEvent.change(screen.getByPlaceholderText('Ej: Firulais'), { target: { value: 'Max' } });
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Mascota' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"locationId":"location-1"'),
        });
      });
    });
  });

  describe('Species Options', () => {
    it('should render all species options', async () => {
      render(<AddPetForm />);

      await waitFor(() => {
        expect(screen.getByText('Perro')).toBeInTheDocument();
      });

      expect(screen.getByText('Gato')).toBeInTheDocument();
      expect(screen.getByText('Ave')).toBeInTheDocument();
      expect(screen.getByText('Conejo')).toBeInTheDocument();
      expect(screen.getByText('Otro')).toBeInTheDocument();
    });
  });
});
