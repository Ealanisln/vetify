/**
 * Unit Tests for StaffPhotoUploader Component
 *
 * Tests that the photo uploader works with optional staffId (for create mode)
 */

import { render, screen } from '@testing-library/react';
import { StaffPhotoUploader } from '@/components/staff/StaffPhotoUploader';

// Mock the ImageUploader component
jest.mock('@/components/ui/ImageUploader', () => ({
  ImageUploader: ({
    imageType,
    entityId,
    currentImage,
    label,
    description,
    aspectRatio,
  }: {
    imageType: string;
    entityId?: string;
    currentImage?: string | null;
    label?: string;
    description?: string;
    aspectRatio?: string;
  }) => (
    <div data-testid="image-uploader">
      <span data-testid="image-type">{imageType}</span>
      <span data-testid="entity-id">{entityId || 'no-entity-id'}</span>
      <span data-testid="current-image">{currentImage || 'no-image'}</span>
      <span data-testid="label">{label}</span>
      <span data-testid="description">{description}</span>
      <span data-testid="aspect-ratio">{aspectRatio}</span>
    </div>
  ),
}));

describe('StaffPhotoUploader Component', () => {
  describe('staffId prop', () => {
    it('should render without staffId (create mode)', () => {
      render(
        <StaffPhotoUploader
          staffName="Nuevo Personal"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
      expect(screen.getByTestId('entity-id')).toHaveTextContent('no-entity-id');
    });

    it('should render with staffId (edit mode)', () => {
      render(
        <StaffPhotoUploader
          staffId="staff-123"
          staffName="Dr. Juan Pérez"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
      expect(screen.getByTestId('entity-id')).toHaveTextContent('staff-123');
    });

    it('should pass undefined entityId when staffId is not provided', () => {
      render(
        <StaffPhotoUploader
          staffName="Test Staff"
          onUpdate={jest.fn()}
        />
      );

      // entityId should be undefined (displayed as 'no-entity-id' by our mock)
      expect(screen.getByTestId('entity-id')).toHaveTextContent('no-entity-id');
    });

    it('should pass staffId as entityId when provided', () => {
      const staffId = 'uuid-staff-456';
      render(
        <StaffPhotoUploader
          staffId={staffId}
          staffName="Test Staff"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('entity-id')).toHaveTextContent(staffId);
    });
  });

  describe('imageType', () => {
    it('should always use staff-profile as imageType', () => {
      render(
        <StaffPhotoUploader
          staffName="Test Staff"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('image-type')).toHaveTextContent('staff-profile');
    });
  });

  describe('label generation', () => {
    it('should include staff name in label', () => {
      render(
        <StaffPhotoUploader
          staffName="Dr. María García"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('label')).toHaveTextContent('Foto de Dr. María García');
    });

    it('should handle empty staff name gracefully', () => {
      render(
        <StaffPhotoUploader
          staffName=""
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('label')).toHaveTextContent('Foto de');
    });
  });

  describe('currentImage prop', () => {
    it('should pass currentImage to ImageUploader', () => {
      const imageUrl = 'https://example.com/photo.jpg';
      render(
        <StaffPhotoUploader
          staffName="Test Staff"
          currentImage={imageUrl}
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('current-image')).toHaveTextContent(imageUrl);
    });

    it('should handle null currentImage', () => {
      render(
        <StaffPhotoUploader
          staffName="Test Staff"
          currentImage={null}
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('current-image')).toHaveTextContent('no-image');
    });

    it('should handle undefined currentImage', () => {
      render(
        <StaffPhotoUploader
          staffName="Test Staff"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('current-image')).toHaveTextContent('no-image');
    });
  });

  describe('aspectRatio', () => {
    it('should use 1:1 aspect ratio for staff photos', () => {
      render(
        <StaffPhotoUploader
          staffName="Test Staff"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('aspect-ratio')).toHaveTextContent('1:1');
    });
  });

  describe('description', () => {
    it('should have description for public page photo', () => {
      render(
        <StaffPhotoUploader
          staffName="Test Staff"
          onUpdate={jest.fn()}
        />
      );

      expect(screen.getByTestId('description')).toHaveTextContent('Foto de perfil para la página pública');
    });
  });
});
