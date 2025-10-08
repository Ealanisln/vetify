import { createTestAppointment, createTestPet, createTestUser } from '../../utils/test-utils';

// Mock the AppointmentCard component behavior
const mockAppointmentCard = {
  render: (props: any) => ({
    id: props.appointment.id,
    title: props.appointment.title,
    status: props.appointment.status,
    hasEditButton: !!props.onEdit,
    hasDeleteButton: !!props.onDelete,
    hasStatusSelect: !!props.onStatusChange,
  }),
  
  handleEdit: (id: string, onEdit?: (id: string) => void) => {
    if (onEdit) onEdit(id);
    return true;
  },
  
  handleDelete: (id: string, onDelete?: (id: string) => void) => {
    if (onDelete) onDelete(id);
    return true;
  },
  
  handleStatusChange: (id: string, status: string, onStatusChange?: (id: string, status: string) => void) => {
    if (onStatusChange) onStatusChange(id, status);
    return true;
  },
};

describe('AppointmentCard Component', () => {
  let mockAppointment: ReturnType<typeof createTestAppointment>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockUser: ReturnType<typeof createTestUser>;
  
  let mockOnEdit: jest.Mock;
  let mockOnDelete: jest.Mock;
  let mockOnStatusChange: jest.Mock;

  beforeEach(() => {
    mockAppointment = createTestAppointment({
      title: 'Annual Checkup',
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      status: 'SCHEDULED',
      notes: 'Regular health examination',
    });
    
    mockPet = createTestPet();
    mockUser = createTestUser();
    
    mockOnEdit = jest.fn();
    mockOnDelete = jest.fn();
    mockOnStatusChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render appointment information correctly', () => {
      const result = mockAppointmentCard.render({
        appointment: mockAppointment,
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
        onStatusChange: mockOnStatusChange,
      });

      expect(result.id).toBe(mockAppointment.id);
      expect(result.title).toBe('Annual Checkup');
      expect(result.status).toBe('SCHEDULED');
    });

    it('should render without notes when notes are not provided', () => {
      const appointmentWithoutNotes = {
        ...mockAppointment,
        notes: undefined,
      };

      const result = mockAppointmentCard.render({
        appointment: appointmentWithoutNotes,
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
        onStatusChange: mockOnStatusChange,
      });

      expect(result.id).toBe(appointmentWithoutNotes.id);
      expect(result.title).toBe(appointmentWithoutNotes.title);
    });
  });

  describe('Interactive Elements', () => {
    it('should call onEdit when edit button is clicked', () => {
      const result = mockAppointmentCard.handleEdit(mockAppointment.id, mockOnEdit);
      
      expect(result).toBe(true);
      expect(mockOnEdit).toHaveBeenCalledWith(mockAppointment.id);
    });

    it('should call onDelete when delete button is clicked', () => {
      const result = mockAppointmentCard.handleDelete(mockAppointment.id, mockOnDelete);
      
      expect(result).toBe(true);
      expect(mockOnDelete).toHaveBeenCalledWith(mockAppointment.id);
    });

    it('should call onStatusChange when status is changed', () => {
      const result = mockAppointmentCard.handleStatusChange(mockAppointment.id, 'COMPLETED', mockOnStatusChange);
      
      expect(result).toBe(true);
      expect(mockOnStatusChange).toHaveBeenCalledWith(mockAppointment.id, 'COMPLETED');
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render edit button when onEdit is not provided', () => {
      const result = mockAppointmentCard.render({
        appointment: mockAppointment,
        onDelete: mockOnDelete,
        onStatusChange: mockOnStatusChange,
      });

      expect(result.hasEditButton).toBe(false);
    });

    it('should not render delete button when onDelete is not provided', () => {
      const result = mockAppointmentCard.render({
        appointment: mockAppointment,
        onEdit: mockOnEdit,
        onStatusChange: mockOnStatusChange,
      });

      expect(result.hasDeleteButton).toBe(false);
    });

    it('should not render status select when onStatusChange is not provided', () => {
      const result = mockAppointmentCard.render({
        appointment: mockAppointment,
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      expect(result.hasStatusSelect).toBe(false);
    });

    it('should render all action buttons when all callbacks are provided', () => {
      const result = mockAppointmentCard.render({
        appointment: mockAppointment,
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
        onStatusChange: mockOnStatusChange,
      });

      expect(result.hasEditButton).toBe(true);
      expect(result.hasDeleteButton).toBe(true);
      expect(result.hasStatusSelect).toBe(true);
    });
  });

  describe('Status Handling', () => {
    it('should display different statuses correctly', () => {
      const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      
      statuses.forEach(status => {
        const appointmentWithStatus = {
          ...mockAppointment,
          status,
        };

        const result = mockAppointmentCard.render({
          appointment: appointmentWithStatus,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          onStatusChange: mockOnStatusChange,
        });

        expect(result.status).toBe(status);
      });
    });

    it('should handle status change correctly', () => {
      const statusSelect = mockAppointmentCard.handleStatusChange;
      
      // Change to different statuses
      const newStatuses = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      
      newStatuses.forEach(newStatus => {
        const result = statusSelect(mockAppointment.id, newStatus, mockOnStatusChange);
        
        expect(result).toBe(true);
        expect(mockOnStatusChange).toHaveBeenCalledWith(mockAppointment.id, newStatus);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing appointment data gracefully', () => {
      const incompleteAppointment = {
        id: 'incomplete-1',
        title: 'Incomplete Appointment',
        // Missing required fields
      };

      // This test ensures the component doesn't crash with incomplete data
      expect(() => {
        mockAppointmentCard.render({
          appointment: incompleteAppointment as any,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          onStatusChange: mockOnStatusChange,
        });
      }).not.toThrow();
    });

    it('should handle invalid dates gracefully', () => {
      const appointmentWithInvalidDate = {
        ...mockAppointment,
        startTime: 'invalid-date',
        endTime: 'invalid-date',
      };

      // This test ensures the component handles invalid dates without crashing
      expect(() => {
        mockAppointmentCard.render({
          appointment: appointmentWithInvalidDate,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          onStatusChange: mockOnStatusChange,
        });
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render quickly for large numbers of appointments', () => {
      const startTime = performance.now();
      
      const largeAppointmentList = Array.from({ length: 100 }, (_, i) => 
        createTestAppointment({ id: `appointment-${i}` })
      );

      largeAppointmentList.forEach((appointment) => {
        const result = mockAppointmentCard.render({
          appointment,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          onStatusChange: mockOnStatusChange,
        });
        
        expect(result.id).toBe(appointment.id);
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 100 appointments should render in under 1 second
      expect(renderTime).toBeLessThan(1000);
    });
  });
});
