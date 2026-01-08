/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BugReportModal } from '@/components/bug-report/BugReportModal';
import { toast } from 'sonner';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockedToast = jest.mocked(toast);

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('BugReportModal', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<BugReportModal open={false} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render modal title', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText('Reportar un error')).toBeInTheDocument();
      expect(screen.getByText('Ayúdanos a mejorar Vetify')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByLabelText(/descripción del error/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pasos para reproducir/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/comportamiento esperado/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole('button', { name: /enviar reporte/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when description is empty', async () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Por favor describe el error');
      });
    });

    it('should show error when steps are empty', async () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      // Fill description
      const descriptionInput = screen.getByLabelText(/descripción del error/i);
      await userEvent.type(descriptionInput, 'Test error description');

      const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Por favor indica los pasos para reproducir el error');
      });
    });

    it('should show error when expected behavior is empty', async () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      // Fill description and steps
      const descriptionInput = screen.getByLabelText(/descripción del error/i);
      await userEvent.type(descriptionInput, 'Test error description');

      const stepsInput = screen.getByLabelText(/pasos para reproducir/i);
      await userEvent.type(stepsInput, '1. Do this\n2. Do that');

      const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Por favor indica el comportamiento esperado');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      // Fill all required fields
      await userEvent.type(
        screen.getByLabelText(/descripción del error/i),
        'Test error description'
      );
      await userEvent.type(
        screen.getByLabelText(/pasos para reproducir/i),
        '1. Do this\n2. Do that'
      );
      await userEvent.type(
        screen.getByLabelText(/comportamiento esperado/i),
        'It should work correctly'
      );

      const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/bug-report', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('should show success message after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      // Fill all required fields
      await userEvent.type(
        screen.getByLabelText(/descripción del error/i),
        'Test error description'
      );
      await userEvent.type(
        screen.getByLabelText(/pasos para reproducir/i),
        '1. Do this\n2. Do that'
      );
      await userEvent.type(
        screen.getByLabelText(/comportamiento esperado/i),
        'It should work correctly'
      );

      const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalled();
      });
    });

    it('should show error message on submission failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      // Fill all required fields
      await userEvent.type(
        screen.getByLabelText(/descripción del error/i),
        'Test error description'
      );
      await userEvent.type(
        screen.getByLabelText(/pasos para reproducir/i),
        '1. Do this\n2. Do that'
      );
      await userEvent.type(
        screen.getByLabelText(/comportamiento esperado/i),
        'It should work correctly'
      );

      const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Server error');
      });
    });
  });

  describe('Close Behavior', () => {
    it('should call onOpenChange when close button is clicked', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      fireEvent.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when cancel button is clicked', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close when submitting', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      // Fill all required fields
      await userEvent.type(
        screen.getByLabelText(/descripción del error/i),
        'Test error description'
      );
      await userEvent.type(
        screen.getByLabelText(/pasos para reproducir/i),
        '1. Do this\n2. Do that'
      );
      await userEvent.type(
        screen.getByLabelText(/comportamiento esperado/i),
        'It should work correctly'
      );

      const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
      fireEvent.click(submitButton);

      // Wait for submitting state to be active (button shows "Enviando...")
      await waitFor(() => {
        expect(screen.getByText(/enviando/i)).toBeInTheDocument();
      });

      // Try to close while submitting
      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      fireEvent.click(closeButton);

      // Should not close while submitting (button is disabled)
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Screenshot Upload', () => {
    it('should show file upload area', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/capturas de pantalla/i)).toBeInTheDocument();
      expect(screen.getByText(/subir imagen/i)).toBeInTheDocument();
    });

    it('should accept image files', () => {
      render(<BugReportModal open={true} onOpenChange={mockOnOpenChange} />);

      const fileInput = document.getElementById('screenshot-upload') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });
});
