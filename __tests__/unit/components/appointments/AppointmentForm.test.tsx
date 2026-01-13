import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentForm } from '../../../../src/components/appointments/AppointmentForm';

// Mock the useAvailability hook
jest.mock('../../../../src/hooks/useCalendar', () => ({
  useAvailability: () => ({
    checkAvailability: jest.fn().mockResolvedValue({}),
    availability: {
      availableSlots: [
        { dateTime: '2024-01-15T09:00:00', time: '09:00', period: 'morning' },
        { dateTime: '2024-01-15T09:30:00', time: '09:30', period: 'morning' },
        { dateTime: '2024-01-15T10:00:00', time: '10:00', period: 'morning' },
        { dateTime: '2024-01-15T14:00:00', time: '14:00', period: 'afternoon' },
        { dateTime: '2024-01-15T14:30:00', time: '14:30', period: 'afternoon' },
      ],
      totalSlots: 16,
      availableCount: 5,
      occupiedCount: 11,
    },
    loading: false,
  }),
}));

// Mock the LocationSelector component
jest.mock('../../../../src/components/locations/LocationSelector', () => {
  return function MockLocationSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <select
        data-testid="location-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select location</option>
        <option value="loc-1">Location 1</option>
      </select>
    );
  };
});

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// Mock date-fns format to avoid locale issues
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: (date: Date, formatStr: string) => {
      if (!date) return '';
      return actual.format(date, formatStr, {});
    },
  };
});

const mockCustomers = [
  { id: 'cust-1', name: 'Juan Pérez', email: 'juan@example.com', phone: '555-1234' },
  { id: 'cust-2', name: 'María García', email: 'maria@example.com', phone: '555-5678' },
];

const mockPets = [
  { id: 'pet-1', name: 'Max', species: 'DOG', breed: 'Golden Retriever', customerId: 'cust-1' },
  { id: 'pet-2', name: 'Luna', species: 'CAT', breed: 'Siamese', customerId: 'cust-1' },
  { id: 'pet-3', name: 'Rocky', species: 'DOG', breed: 'Bulldog', customerId: 'cust-2' },
];

const mockStaff = [
  { id: 'staff-1', name: 'Dr. Smith', position: 'VETERINARIAN' },
  { id: 'staff-2', name: 'Dr. Johnson', position: 'VETERINARIAN' },
];

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  customers: mockCustomers,
  pets: mockPets,
  staff: mockStaff,
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
};

describe('AppointmentForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByTestId('appointment-customer-select')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-pet-select')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-duration-input')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-staff-select')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-reason-input')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-notes-input')).toBeInTheDocument();
    });

    it('should render form buttons', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByTestId('cancel-appointment-button')).toBeInTheDocument();
      expect(screen.getByTestId('submit-appointment-button')).toBeInTheDocument();
    });

    it('should render customer options', () => {
      render(<AppointmentForm {...defaultProps} />);

      const customerSelect = screen.getByTestId('appointment-customer-select');
      expect(customerSelect).toContainHTML('Juan Pérez');
      expect(customerSelect).toContainHTML('María García');
    });

    it('should render staff options', () => {
      render(<AppointmentForm {...defaultProps} />);

      const staffSelect = screen.getByTestId('appointment-staff-select');
      expect(staffSelect).toContainHTML('Dr. Smith');
      expect(staffSelect).toContainHTML('Dr. Johnson');
    });

    it('should show "Crear Cita" button text for new appointments', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByText('Crear Cita')).toBeInTheDocument();
    });

    it('should show "Actualizar Cita" button text for editing', () => {
      render(<AppointmentForm {...defaultProps} initialData={{ customerId: 'cust-1' }} />);

      expect(screen.getByText('Actualizar Cita')).toBeInTheDocument();
    });
  });

  describe('Pet Filtering by Customer', () => {
    it('should disable pet select when no customer is selected', () => {
      render(<AppointmentForm {...defaultProps} />);

      const petSelect = screen.getByTestId('appointment-pet-select');
      expect(petSelect).toBeDisabled();
    });

    it('should enable pet select when customer is selected', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      const customerSelect = screen.getByTestId('appointment-customer-select');
      await user.selectOptions(customerSelect, 'cust-1');

      const petSelect = screen.getByTestId('appointment-pet-select');
      expect(petSelect).not.toBeDisabled();
    });

    it('should show only pets belonging to selected customer', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      const customerSelect = screen.getByTestId('appointment-customer-select');
      await user.selectOptions(customerSelect, 'cust-1');

      const petSelect = screen.getByTestId('appointment-pet-select');

      // Should show Max and Luna (cust-1's pets)
      expect(petSelect).toContainHTML('Max');
      expect(petSelect).toContainHTML('Luna');
      // Should not show Rocky (cust-2's pet)
      expect(petSelect).not.toContainHTML('Rocky');
    });

    it('should auto-select pet when customer has only one pet', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      // Select first customer and pet
      const customerSelect = screen.getByTestId('appointment-customer-select');
      await user.selectOptions(customerSelect, 'cust-1');

      const petSelect = screen.getByTestId('appointment-pet-select');
      await user.selectOptions(petSelect, 'pet-1');

      // Change customer to cust-2 who has only one pet (Rocky)
      await user.selectOptions(customerSelect, 'cust-2');

      // Component auto-selects the only pet when there's just one
      expect(petSelect).toHaveValue('pet-3');
    });

    it('should reset pet selection when changing to customer with multiple pets', async () => {
      // Add a second pet to cust-2 to test the reset behavior
      const extendedPets = [
        ...mockPets,
        { id: 'pet-4', name: 'Buddy', species: 'DOG', breed: 'Labrador', customerId: 'cust-2' },
      ];
      render(<AppointmentForm {...defaultProps} pets={extendedPets} />);
      const user = userEvent.setup();

      // Select first customer and pet
      const customerSelect = screen.getByTestId('appointment-customer-select');
      await user.selectOptions(customerSelect, 'cust-1');

      const petSelect = screen.getByTestId('appointment-pet-select');
      await user.selectOptions(petSelect, 'pet-1');

      // Change customer to cust-2 who now has multiple pets
      await user.selectOptions(customerSelect, 'cust-2');

      // Pet selection should be reset since there are multiple pets
      expect(petSelect).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for missing customer', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      // Try to submit without selecting customer - form has dateTime by default
      const submitButton = screen.getByTestId('submit-appointment-button');
      await user.click(submitButton);

      // Should show validation message - "Cliente es requerido"
      await waitFor(() => {
        const errorMessage = screen.queryByText(/Cliente es requerido/i);
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should enable submit button when form has dateTime (defaults to now)', () => {
      // The form initializes with dateTime: new Date() as default
      // So the submit button is NOT disabled based on dateTime alone
      render(<AppointmentForm {...defaultProps} />);

      const submitButton = screen.getByTestId('submit-appointment-button');
      // The button is enabled by default because dateTime has a value
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button when loading is true', () => {
      render(<AppointmentForm {...defaultProps} loading={true} />);

      const submitButton = screen.getByTestId('submit-appointment-button');
      expect(submitButton).toBeDisabled();
    });

    it('should validate duration within range', async () => {
      render(<AppointmentForm {...defaultProps} />);

      const durationInput = screen.getByTestId('appointment-duration-input');

      // Check min and max attributes
      expect(durationInput).toHaveAttribute('min', '15');
      expect(durationInput).toHaveAttribute('max', '300');
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      const cancelButton = screen.getByTestId('cancel-appointment-button');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable buttons when loading', () => {
      render(<AppointmentForm {...defaultProps} loading={true} />);

      expect(screen.getByTestId('cancel-appointment-button')).toBeDisabled();
      expect(screen.getByTestId('submit-appointment-button')).toBeDisabled();
    });
  });

  describe('Initial Data', () => {
    it('should populate form with initial data', () => {
      const initialData = {
        customerId: 'cust-1',
        duration: 45,
        reason: 'Consulta de rutina',
        notes: 'Notas de prueba',
        staffId: 'staff-1',
      };

      render(<AppointmentForm {...defaultProps} initialData={initialData} />);

      expect(screen.getByTestId('appointment-customer-select')).toHaveValue('cust-1');
      expect(screen.getByTestId('appointment-duration-input')).toHaveValue(45);
      expect(screen.getByTestId('appointment-reason-input')).toHaveValue('Consulta de rutina');
      expect(screen.getByTestId('appointment-notes-input')).toHaveValue('Notas de prueba');
      expect(screen.getByTestId('appointment-staff-select')).toHaveValue('staff-1');
    });

    it('should use default duration of 30 when not provided', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByTestId('appointment-duration-input')).toHaveValue(30);
    });
  });

  describe('Time Slots', () => {
    it('should display time slot buttons', async () => {
      render(<AppointmentForm {...defaultProps} />);

      // Check for morning and afternoon sections
      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
        expect(screen.getByText('14:00')).toBeInTheDocument();
      });
    });

    it('should display morning slots section', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByText(/Mañana/i)).toBeInTheDocument();
    });

    it('should display afternoon slots section', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByText(/Tarde/i)).toBeInTheDocument();
    });

    it('should show availability count', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByText(/5 espacios disponibles/i)).toBeInTheDocument();
    });
  });

  describe('Staff Selection', () => {
    it('should allow selecting no staff (optional field)', () => {
      render(<AppointmentForm {...defaultProps} />);

      const staffSelect = screen.getByTestId('appointment-staff-select');
      expect(staffSelect).toHaveValue('');
    });

    it('should show staff with their positions', () => {
      render(<AppointmentForm {...defaultProps} />);

      const staffSelect = screen.getByTestId('appointment-staff-select');
      expect(staffSelect).toContainHTML('Dr. Smith - VETERINARIAN');
    });
  });

  describe('Duration Field', () => {
    it('should accept valid duration values', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      const durationInput = screen.getByTestId('appointment-duration-input');
      await user.clear(durationInput);
      await user.type(durationInput, '60');

      expect(durationInput).toHaveValue(60);
    });

    it('should have step of 5 minutes', () => {
      render(<AppointmentForm {...defaultProps} />);

      const durationInput = screen.getByTestId('appointment-duration-input');
      expect(durationInput).toHaveAttribute('step', '5');
    });
  });

  describe('Notes and Reason Fields', () => {
    it('should accept text input in reason field', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      const reasonInput = screen.getByTestId('appointment-reason-input');
      await user.type(reasonInput, 'Vacunación anual');

      expect(reasonInput).toHaveValue('Vacunación anual');
    });

    it('should accept multiline text in notes field', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      const notesInput = screen.getByTestId('appointment-notes-input');
      await user.type(notesInput, 'Línea 1\nLínea 2');

      expect(notesInput).toHaveValue('Línea 1\nLínea 2');
    });

    it('should display placeholder text for reason field', () => {
      render(<AppointmentForm {...defaultProps} />);

      const reasonInput = screen.getByTestId('appointment-reason-input');
      expect(reasonInput).toHaveAttribute('placeholder', 'Ej: Consulta general, vacunación, revisión...');
    });
  });

  describe('Edit Mode', () => {
    it('should pass appointmentId for availability exclusion', () => {
      const appointmentId = 'apt-123';
      render(<AppointmentForm {...defaultProps} appointmentId={appointmentId} />);

      // The component should handle this internally for availability checks
      // We verify it renders without errors
      expect(screen.getByTestId('appointment-customer-select')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have labels for all form fields', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByText('Cliente *')).toBeInTheDocument();
      expect(screen.getByText('Mascota *')).toBeInTheDocument();
      expect(screen.getByText('Duración (minutos) *')).toBeInTheDocument();
      expect(screen.getByText('Veterinario')).toBeInTheDocument();
      expect(screen.getByText('Motivo de la cita *')).toBeInTheDocument();
      expect(screen.getByText('Notas adicionales')).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(<AppointmentForm {...defaultProps} />);

      expect(screen.getByText('Cliente *')).toBeInTheDocument();
      expect(screen.getByText('Mascota *')).toBeInTheDocument();
      expect(screen.getByText('Motivo de la cita *')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable form submission during loading', () => {
      render(<AppointmentForm {...defaultProps} loading={true} />);

      const submitButton = screen.getByTestId('submit-appointment-button');
      expect(submitButton).toBeDisabled();
    });

    it('should show loader icon in submit button during loading', () => {
      render(<AppointmentForm {...defaultProps} loading={true} />);

      // The Loader2 icon should be present
      const submitButton = screen.getByTestId('submit-appointment-button');
      expect(submitButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle empty customers list', () => {
      render(<AppointmentForm {...defaultProps} customers={[]} />);

      const customerSelect = screen.getByTestId('appointment-customer-select');
      // Should only have the placeholder option
      expect(customerSelect.querySelectorAll('option')).toHaveLength(1);
    });

    it('should handle empty staff list', () => {
      render(<AppointmentForm {...defaultProps} staff={[]} />);

      const staffSelect = screen.getByTestId('appointment-staff-select');
      // Should only have the placeholder option
      expect(staffSelect.querySelectorAll('option')).toHaveLength(1);
    });

    it('should handle empty pets list', () => {
      render(<AppointmentForm {...defaultProps} pets={[]} />);

      // Pet select should be disabled and show placeholder
      const petSelect = screen.getByTestId('appointment-pet-select');
      expect(petSelect).toBeDisabled();
    });
  });

  describe('Customer Information Display', () => {
    it('should display customer phone in select option', () => {
      render(<AppointmentForm {...defaultProps} />);

      const customerSelect = screen.getByTestId('appointment-customer-select');
      expect(customerSelect).toContainHTML('555-1234');
    });
  });

  describe('Pet Information Display', () => {
    it('should display pet species and breed', async () => {
      render(<AppointmentForm {...defaultProps} />);
      const user = userEvent.setup();

      const customerSelect = screen.getByTestId('appointment-customer-select');
      await user.selectOptions(customerSelect, 'cust-1');

      const petSelect = screen.getByTestId('appointment-pet-select');
      expect(petSelect).toContainHTML('DOG');
      expect(petSelect).toContainHTML('Golden Retriever');
    });
  });
});
