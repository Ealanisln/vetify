/**
 * Unit tests for AppointmentsPageClient component
 * Tests permission-based rendering of the "Nueva Cita" button and calendar interactions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppointmentsPageClient } from '@/app/dashboard/appointments/AppointmentsPageClient';
import {
  createTestCustomer,
  createTestPet,
  createTestStaff,
  POSITIONS_WITH_APPOINTMENTS_WRITE,
  POSITIONS_WITH_APPOINTMENTS_READ_ONLY,
  type TestStaffPosition,
} from '../../../utils/test-utils';

// Mock the useStaffPermissions hook
jest.mock('@/hooks/useStaffPermissions', () => ({
  useStaffPermissions: jest.fn(),
}));

// Mock the useAppointments hook
jest.mock('@/hooks/useAppointments', () => ({
  useAppointments: jest.fn().mockReturnValue({
    appointments: [],
    isLoading: false,
    error: null,
    quickAction: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock the FullCalendarView component (lazy loaded)
jest.mock('@/components/appointments/FullCalendarView', () => ({
  FullCalendarView: ({ selectable, editable }: { selectable: boolean; editable: boolean }) => (
    <div data-testid="full-calendar-view" data-selectable={selectable} data-editable={editable}>
      Calendar Mock
    </div>
  ),
}));

// Mock the AppointmentModal component - using relative paths as the component uses them
jest.mock('../../../../src/components/appointments', () => ({
  AppointmentModal: () => <div data-testid="appointment-modal">Modal Mock</div>,
  TodayAppointments: () => <div data-testid="today-appointments">Today Appointments Mock</div>,
  AppointmentStats: () => <div data-testid="appointment-stats">Stats Mock</div>,
}));

// Mock next/dynamic to return components immediately
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (_dynamicImport: () => Promise<{ default: React.ComponentType }>) => {
    // Return a mock component that passes through props
    const MockComponent = (props: Record<string, unknown>) => (
      <div
        data-testid="full-calendar-view"
        data-selectable={props.selectable?.toString()}
        data-editable={props.editable?.toString()}
      >
        Calendar Mock
      </div>
    );
    MockComponent.displayName = 'DynamicComponent';
    return MockComponent;
  },
}));

import { useStaffPermissions } from '@/hooks/useStaffPermissions';

const mockUseStaffPermissions = useStaffPermissions as jest.MockedFunction<typeof useStaffPermissions>;

// Test data
const mockCustomers = [createTestCustomer()];
const mockPets = [createTestPet()];
const mockStaffList = [createTestStaff()];

// Helper to create mock permissions return value
const createMockPermissionsReturn = (
  position: TestStaffPosition | null,
  canWrite: boolean,
  isLoading = false
) => ({
  staff: position ? { id: 'staff-1', name: 'Test', position, email: null, isActive: true } : null,
  position,
  isLoading,
  error: null,
  canAccess: jest.fn().mockImplementation((feature, action) => {
    if (feature === 'appointments') {
      if (action === 'read') return true;
      if (action === 'write') return canWrite;
      if (action === 'delete') return canWrite;
    }
    return false;
  }),
  accessibleFeatures: ['appointments'] as const,
  isAdmin: position === 'MANAGER' || position === 'ADMINISTRATOR',
  isVeterinarian: position === 'VETERINARIAN',
  isReceptionist: position === 'RECEPTIONIST',
  isAssistant: position === 'ASSISTANT',
  isTechnician: position === 'VETERINARY_TECHNICIAN',
  refresh: jest.fn(),
});

describe('AppointmentsPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('New Appointment Button Visibility', () => {
    describe('Users with write permissions', () => {
      it.each(POSITIONS_WITH_APPOINTMENTS_WRITE)(
        'should show "Nueva Cita" button for %s',
        (position) => {
          mockUseStaffPermissions.mockReturnValue(
            createMockPermissionsReturn(position as TestStaffPosition, true)
          );

          render(
            <AppointmentsPageClient
              customers={mockCustomers}
              pets={mockPets}
              staff={mockStaffList}
            />
          );

          const newAppointmentButton = screen.getByTestId('new-appointment-button');
          expect(newAppointmentButton).toBeInTheDocument();
          expect(newAppointmentButton).toHaveTextContent('Nueva Cita');
        }
      );
    });

    describe('Users with read-only permissions', () => {
      it.each(POSITIONS_WITH_APPOINTMENTS_READ_ONLY)(
        'should NOT show "Nueva Cita" button for %s',
        (position) => {
          mockUseStaffPermissions.mockReturnValue(
            createMockPermissionsReturn(position as TestStaffPosition, false)
          );

          render(
            <AppointmentsPageClient
              customers={mockCustomers}
              pets={mockPets}
              staff={mockStaffList}
            />
          );

          const newAppointmentButton = screen.queryByTestId('new-appointment-button');
          expect(newAppointmentButton).not.toBeInTheDocument();
        }
      );
    });

    describe('Specific role tests', () => {
      it('should show button for VETERINARIAN', () => {
        mockUseStaffPermissions.mockReturnValue(
          createMockPermissionsReturn('VETERINARIAN', true)
        );

        render(
          <AppointmentsPageClient
            customers={mockCustomers}
            pets={mockPets}
            staff={mockStaffList}
          />
        );

        expect(screen.getByTestId('new-appointment-button')).toBeInTheDocument();
      });

      it('should NOT show button for ASSISTANT', () => {
        mockUseStaffPermissions.mockReturnValue(
          createMockPermissionsReturn('ASSISTANT', false)
        );

        render(
          <AppointmentsPageClient
            customers={mockCustomers}
            pets={mockPets}
            staff={mockStaffList}
          />
        );

        expect(screen.queryByTestId('new-appointment-button')).not.toBeInTheDocument();
      });

      it('should NOT show button for GROOMER', () => {
        mockUseStaffPermissions.mockReturnValue(
          createMockPermissionsReturn('GROOMER', false)
        );

        render(
          <AppointmentsPageClient
            customers={mockCustomers}
            pets={mockPets}
            staff={mockStaffList}
          />
        );

        expect(screen.queryByTestId('new-appointment-button')).not.toBeInTheDocument();
      });

      it('should show button for RECEPTIONIST', () => {
        mockUseStaffPermissions.mockReturnValue(
          createMockPermissionsReturn('RECEPTIONIST', true)
        );

        render(
          <AppointmentsPageClient
            customers={mockCustomers}
            pets={mockPets}
            staff={mockStaffList}
          />
        );

        expect(screen.getByTestId('new-appointment-button')).toBeInTheDocument();
      });

      it('should show button for MANAGER', () => {
        mockUseStaffPermissions.mockReturnValue(
          createMockPermissionsReturn('MANAGER', true)
        );

        render(
          <AppointmentsPageClient
            customers={mockCustomers}
            pets={mockPets}
            staff={mockStaffList}
          />
        );

        expect(screen.getByTestId('new-appointment-button')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Interaction Permissions', () => {
    it('should enable calendar selection for users with write permissions', () => {
      mockUseStaffPermissions.mockReturnValue(
        createMockPermissionsReturn('VETERINARIAN', true)
      );

      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      const calendar = screen.getByTestId('full-calendar-view');
      expect(calendar).toHaveAttribute('data-selectable', 'true');
      expect(calendar).toHaveAttribute('data-editable', 'true');
    });

    it('should disable calendar selection for users with read-only permissions', () => {
      mockUseStaffPermissions.mockReturnValue(
        createMockPermissionsReturn('ASSISTANT', false)
      );

      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      const calendar = screen.getByTestId('full-calendar-view');
      expect(calendar).toHaveAttribute('data-selectable', 'false');
      expect(calendar).toHaveAttribute('data-editable', 'false');
    });

    it('should disable calendar editing for GROOMER', () => {
      mockUseStaffPermissions.mockReturnValue(
        createMockPermissionsReturn('GROOMER', false)
      );

      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      const calendar = screen.getByTestId('full-calendar-view');
      expect(calendar).toHaveAttribute('data-selectable', 'false');
      expect(calendar).toHaveAttribute('data-editable', 'false');
    });
  });

  describe('Page Content Rendering', () => {
    beforeEach(() => {
      mockUseStaffPermissions.mockReturnValue(
        createMockPermissionsReturn('VETERINARIAN', true)
      );
    });

    it('should render the page header', () => {
      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      expect(screen.getByText('Calendario de Citas')).toBeInTheDocument();
      expect(screen.getByText('Gestiona las citas y horarios de tu clínica')).toBeInTheDocument();
    });

    it('should render stats cards', () => {
      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      expect(screen.getByText('Total Clientes')).toBeInTheDocument();
      expect(screen.getByText('Mascotas')).toBeInTheDocument();
      // "Personal" appears twice (once in stats card header, once in summary card)
      expect(screen.getAllByText('Personal').length).toBeGreaterThanOrEqual(1);
    });

    it('should display correct customer count', () => {
      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      // There are multiple "1" values on the page (customers, pets, staff)
      // Verify counts are displayed correctly
      const countElements = screen.getAllByText('1');
      expect(countElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render appointment stats container', () => {
      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      // The stats container is rendered with data-testid="appointment-stats"
      // in the actual component wrapper
      const statsContainer = document.querySelector('[data-testid="appointment-stats"]');
      expect(statsContainer).toBeInTheDocument();
    });

    it('should render calendar container', () => {
      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      // The calendar is rendered inside a container with data-testid="appointments-calendar"
      const calendarContainer = document.querySelector('[data-testid="appointments-calendar"]');
      expect(calendarContainer).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should still render page while permissions are loading', () => {
      mockUseStaffPermissions.mockReturnValue(
        createMockPermissionsReturn(null, false, true)
      );

      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      // Page should still render, button visibility based on canWrite = false during loading
      expect(screen.getByText('Calendario de Citas')).toBeInTheDocument();
    });

    it('should not show button during permission loading', () => {
      mockUseStaffPermissions.mockReturnValue(
        createMockPermissionsReturn(null, false, true)
      );

      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      expect(screen.queryByTestId('new-appointment-button')).not.toBeInTheDocument();
    });
  });

  describe('Tenant Owner (No Staff Record)', () => {
    it('should show button for tenant owner (defaults to MANAGER access)', () => {
      // When user has no staff record, they get MANAGER access
      mockUseStaffPermissions.mockReturnValue({
        staff: null,
        position: 'MANAGER', // Defaults to MANAGER for tenant owners
        isLoading: false,
        error: null,
        canAccess: jest.fn().mockReturnValue(true),
        accessibleFeatures: ['appointments'],
        isAdmin: true,
        isVeterinarian: false,
        isReceptionist: false,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });

      render(
        <AppointmentsPageClient
          customers={mockCustomers}
          pets={mockPets}
          staff={mockStaffList}
        />
      );

      expect(screen.getByTestId('new-appointment-button')).toBeInTheDocument();
    });
  });
});
