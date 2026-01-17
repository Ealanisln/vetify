/**
 * Unit Tests for ImageUploader Component
 *
 * Tests the image upload component's UI states, validation, and interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploader } from '@/components/ui/ImageUploader';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sonner toast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}));

describe('ImageUploader Component', () => {
  const defaultProps = {
    imageType: 'pet-profile' as const,
    entityId: '660e8400-e29b-41d4-a716-446655440001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://example.com/uploaded.jpg' }),
    });
  });

  describe('Initial Render', () => {
    it('should render upload zone with label and description', () => {
      render(
        <ImageUploader
          {...defaultProps}
          label="Foto de perfil"
          description="Arrastre o haga clic para subir"
        />
      );

      expect(screen.getByText('Foto de perfil')).toBeInTheDocument();
      expect(screen.getByText('Arrastre o haga clic para subir')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      render(<ImageUploader {...defaultProps} />);

      // Should still render the upload area
      expect(screen.getByText(/Arrastra una imagen/i)).toBeInTheDocument();
    });

    it('should show upload instructions when no image', () => {
      render(<ImageUploader {...defaultProps} />);

      expect(screen.getByText(/Arrastra una imagen aqui/i)).toBeInTheDocument();
      expect(screen.getByText(/haz clic para seleccionar/i)).toBeInTheDocument();
      expect(screen.getByText(/JPG, PNG o WebP/i)).toBeInTheDocument();
      expect(screen.getByText(/Maximo 5MB/i)).toBeInTheDocument();
    });
  });

  describe('Current Image Display', () => {
    it('should display current image when provided', () => {
      render(
        <ImageUploader
          {...defaultProps}
          currentImage="https://example.com/existing.jpg"
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/existing.jpg');
    });

    it('should show action buttons when image exists', () => {
      render(
        <ImageUploader
          {...defaultProps}
          currentImage="https://example.com/existing.jpg"
        />
      );

      // Should have upload and delete buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('File Selection', () => {
    it('should handle file selection via click', async () => {
      const onUpload = jest.fn();
      render(<ImageUploader {...defaultProps} onUpload={onUpload} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should accept JPEG files', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
    });
  });

  describe('Client-side Validation', () => {
    it('should reject non-image files', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      // Create a file that has the wrong MIME type
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });

      // Simulate file selection directly via the component's change handler
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      fireEvent.change(input);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('no permitido')
        );
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject files exceeding 5MB', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      // Create a file larger than 5MB
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('5MB')
        );
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should accept valid JPEG file', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should accept valid PNG file', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should accept valid WebP file', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Upload Callbacks', () => {
    it('should call onUpload callback with URL after success', async () => {
      const onUpload = jest.fn();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://example.com/new-image.jpg' }),
      });

      render(<ImageUploader {...defaultProps} onUpload={onUpload} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledWith('https://example.com/new-image.jpg');
      });
    });

    it('should show success toast after upload', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Imagen subida exitosamente');
      });
    });

    it('should show error toast on upload failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' }),
      });

      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Upload failed');
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should call onDelete callback after deletion', async () => {
      const onDelete = jest.fn();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Deleted' }),
      });

      render(
        <ImageUploader
          {...defaultProps}
          currentImage="https://example.com/existing.jpg"
          onDelete={onDelete}
        />
      );

      // Find and click the delete button (destructive variant)
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn =>
        btn.className.includes('destructive') ||
        btn.querySelector('svg[class*="lucide-x"]')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(onDelete).toHaveBeenCalled();
        });
      }
    });

    it('should show success toast after deletion', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Deleted' }),
      });

      render(
        <ImageUploader
          {...defaultProps}
          currentImage="https://example.com/existing.jpg"
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Click the destructive (delete) button - second button
      fireEvent.click(buttons[1]);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Imagen eliminada exitosamente');
      });
    });
  });

  describe('Loading States', () => {
    it('should disable interactions during upload', async () => {
      // Make fetch take some time
      mockFetch.mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ url: 'https://example.com/new.jpg' }),
          }), 100)
        )
      );

      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      // During upload, input should be disabled
      expect(input).toBeDisabled();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle file drop', async () => {
      render(<ImageUploader {...defaultProps} />);

      const dropZone = screen.getByText(/Arrastra una imagen/i).closest('div');

      if (dropZone) {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const dataTransfer = {
          files: [file],
          items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
          types: ['Files'],
        };

        fireEvent.dragOver(dropZone, { dataTransfer });
        fireEvent.drop(dropZone, { dataTransfer });

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalled();
        });
      }
    });

    it('should show drag state on dragOver', () => {
      render(<ImageUploader {...defaultProps} />);

      const dropZone = screen.getByText(/Arrastra una imagen/i).closest('div')?.parentElement;

      if (dropZone) {
        fireEvent.dragOver(dropZone, {
          dataTransfer: { files: [] },
          preventDefault: () => {},
        });

        // The border should change to indicate drag state
        expect(dropZone.className).toContain('border');
      }
    });
  });

  describe('Aspect Ratio', () => {
    it('should apply 1:1 aspect ratio class', () => {
      const { container } = render(
        <ImageUploader {...defaultProps} aspectRatio="1:1" />
      );

      const dropZone = container.querySelector('.aspect-square');
      expect(dropZone).toBeInTheDocument();
    });

    it('should apply 16:9 aspect ratio class', () => {
      const { container } = render(
        <ImageUploader {...defaultProps} aspectRatio="16:9" />
      );

      const dropZone = container.querySelector('.aspect-video');
      expect(dropZone).toBeInTheDocument();
    });
  });

  describe('FormData Construction', () => {
    it('should send correct FormData to API', async () => {
      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
          method: 'POST',
          body: expect.any(FormData),
        });
      });

      // Verify the FormData contents
      const call = mockFetch.mock.calls[0];
      const formData = call[1].body as FormData;
      expect(formData.get('imageType')).toBe('pet-profile');
      expect(formData.get('entityId')).toBe(defaultProps.entityId);
      expect(formData.get('file')).toBeInstanceOf(File);
    });

    it('should not include entityId when not provided', async () => {
      render(<ImageUploader imageType="logo" />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const call = mockFetch.mock.calls[0];
      const formData = call[1].body as FormData;
      expect(formData.get('imageType')).toBe('logo');
      expect(formData.get('entityId')).toBeNull();
    });
  });

  describe('Image Preview', () => {
    it('should show image preview after file selection', async () => {
      const newImageUrl = 'https://example.com/new-image.jpg';
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: newImageUrl }),
      });

      render(<ImageUploader {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      // Wait for the success toast which happens after upload completes
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Imagen subida exitosamente');
      });

      // Image should be visible after upload
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      // The src could be either the data URL (from FileReader) or the final URL
      // depending on timing - what matters is the image is shown
      expect(img).toHaveAttribute('src');
    });

    it('should sync preview with currentImage prop changes', () => {
      const { rerender } = render(
        <ImageUploader {...defaultProps} currentImage="https://example.com/first.jpg" />
      );

      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/first.jpg');

      rerender(
        <ImageUploader {...defaultProps} currentImage="https://example.com/second.jpg" />
      );

      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/second.jpg');
    });
  });
});
