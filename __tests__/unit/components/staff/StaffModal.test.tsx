/**
 * Unit Tests for StaffModal Component
 *
 * Tests that the modal shows photo uploader in both create and edit modes
 */

import { render, screen } from '@testing-library/react';
import StaffModal from '@/components/staff/StaffModal';

// Mock the StaffPhotoUploader component
jest.mock('@/components/staff/StaffPhotoUploader', () => ({
  StaffPhotoUploader: ({
    staffId,
    staffName,
    currentImage,
  }: {
    staffId?: string;
    staffName: string;
    currentImage?: string | null;
    onUpdate?: (url: string | null) => void;
  }) => (
    <div data-testid="staff-photo-uploader">
      <span data-testid="photo-staff-id">{staffId || 'no-staff-id'}</span>
      <span data-testid="photo-staff-name">{staffName}</span>
      <span data-testid="photo-current-image">{currentImage || 'no-image'}</span>
    </div>
  ),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => '1 ene 2026'),
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

describe('StaffModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onStaffSaved: jest.fn(),
  };

  describe('Photo Uploader in Create Mode', () => {
    it('should show photo uploader when creating new staff', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      // Photo uploader should be present in create mode
      expect(screen.getByTestId('staff-photo-uploader')).toBeInTheDocument();
    });

    it('should not pass staffId to photo uploader in create mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      // staffId should be undefined in create mode
      expect(screen.getByTestId('photo-staff-id')).toHaveTextContent('no-staff-id');
    });

    it('should use default staff name for photo uploader in create mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      // Should use 'Personal' as default name
      expect(screen.getByTestId('photo-staff-name')).toHaveTextContent('Personal');
    });
  });

  describe('Photo Uploader in Edit Mode', () => {
    const mockStaff = {
      id: 'staff-123',
      name: 'Dr. Juan Pérez',
      position: 'VETERINARIAN',
      email: 'juan@test.com',
      phone: '555-1234',
      licenseNumber: 'LIC-001',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-10'),
      publicBio: 'Bio del veterinario',
      publicPhoto: 'https://example.com/photo.jpg',
      specialties: ['Cirugía'],
      showOnPublicPage: true,
    };

    it('should show photo uploader when editing staff', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="edit"
          staff={mockStaff}
        />
      );

      expect(screen.getByTestId('staff-photo-uploader')).toBeInTheDocument();
    });

    it('should pass staffId to photo uploader in edit mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="edit"
          staff={mockStaff}
        />
      );

      expect(screen.getByTestId('photo-staff-id')).toHaveTextContent('staff-123');
    });

    it('should pass staff name to photo uploader in edit mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="edit"
          staff={mockStaff}
        />
      );

      expect(screen.getByTestId('photo-staff-name')).toHaveTextContent('Dr. Juan Pérez');
    });

    it('should pass current photo to photo uploader in edit mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="edit"
          staff={mockStaff}
        />
      );

      expect(screen.getByTestId('photo-current-image')).toHaveTextContent('https://example.com/photo.jpg');
    });
  });

  describe('Modal Display', () => {
    it('should not render when isOpen is false', () => {
      render(
        <StaffModal
          {...defaultProps}
          isOpen={false}
          mode="create"
          staff={null}
        />
      );

      expect(screen.queryByTestId('staff-photo-uploader')).not.toBeInTheDocument();
    });

    it('should show "Agregar Personal" title in create mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      // Use getAllByText since both title and button have "Agregar Personal"
      const elements = screen.getAllByText('Agregar Personal');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show "Editar Personal" title in edit mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="edit"
          staff={{
            id: 'staff-1',
            name: 'Test',
            position: 'VETERINARIAN',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
        />
      );

      expect(screen.getByText('Editar Personal')).toBeInTheDocument();
    });

    it('should show public profile section in form modes', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      expect(screen.getByText('Perfil Público')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should show all required form fields in create mode', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      expect(screen.getByText('Nombre completo *')).toBeInTheDocument();
      expect(screen.getByText('Posición *')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('Número de Licencia')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });

    it('should show biography field', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      expect(screen.getByText('Biografía')).toBeInTheDocument();
    });

    it('should show specialties field', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      expect(screen.getByText('Especialidades')).toBeInTheDocument();
    });

    it('should show "Mostrar en página pública" checkbox', () => {
      render(
        <StaffModal
          {...defaultProps}
          mode="create"
          staff={null}
        />
      );

      expect(screen.getByText('Mostrar en página pública')).toBeInTheDocument();
    });
  });
});
