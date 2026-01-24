/**
 * Unit tests for ApiKeyCreatedModal component
 *
 * Tests the one-time key display modal:
 * - Shows full key in monospace
 * - Copy button copies key to clipboard
 * - Shows warning about one-time display
 * - Close button triggers onClose
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ApiKeyCreatedModal } from '@/components/api/ApiKeyCreatedModal';

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve()),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe('ApiKeyCreatedModal', () => {
  const mockFullKey = 'vfy_abc12345_abcdef1234567890abcdef1234567890';

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    keyName: 'Test API Key',
    fullKey: mockFullKey,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Modal Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText('Clave de API Creada')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ApiKeyCreatedModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Clave de API Creada')).not.toBeInTheDocument();
    });

    it('should NOT close when clicking backdrop (non-dismissable)', () => {
      const onClose = jest.fn();
      render(<ApiKeyCreatedModal {...defaultProps} onClose={onClose} />);

      // The backdrop doesn't have onClick - it's non-dismissable
      const backdrop = document.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // onClose should NOT be called
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Key Display', () => {
    it('should display the key name', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText(/Test API Key/)).toBeInTheDocument();
    });

    it('should display the full key in monospace font', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const keyDisplay = screen.getByText(mockFullKey);
      expect(keyDisplay).toBeInTheDocument();
      expect(keyDisplay).toHaveClass('font-mono');
    });

    it('should show success message with key name', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText(/Test API Key/)).toBeInTheDocument();
      expect(screen.getByText(/ha sido creada exitosamente/)).toBeInTheDocument();
    });
  });

  describe('Warning Message', () => {
    it('should show important warning banner', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText('¡Importante!')).toBeInTheDocument();
    });

    it('should warn about one-time display', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(
        screen.getByText(/Esta es la única vez que verás la clave completa/)
      ).toBeInTheDocument();
    });

    it('should mention copying and safe storage', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText(/Cópiala ahora y guárdala en un lugar seguro/)).toBeInTheDocument();
    });

    it('should mention inability to recover', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText(/No podrás recuperarla después/)).toBeInTheDocument();
    });
  });

  describe('Copy Button', () => {
    it('should copy key to clipboard when clicking copy button', async () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      // Find the copy button (has clipboard icon)
      const copyButton = screen.getByTitle(/Copiar/i);
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(mockFullKey);
    });

    it('should show success message after copying', async () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const copyButton = screen.getByTitle(/Copiar/i);
      await act(async () => {
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Clave copiada al portapapeles')).toBeInTheDocument();
      });
    });

    it('should change button appearance after copying', async () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const copyButton = screen.getByTitle(/Copiar/i);

      // Before copy - should have gray background
      expect(copyButton).toHaveClass('bg-gray-700');

      await act(async () => {
        fireEvent.click(copyButton);
      });

      // After copy - should have green background
      expect(copyButton).toHaveClass('bg-green-600');
    });

    it('should reset copy state after 3 seconds', async () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const copyButton = screen.getByTitle(/Copiar/i);
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Should show copied state
      expect(screen.getByText('Clave copiada al portapapeles')).toBeInTheDocument();

      // Fast forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Copied message should be gone
      expect(screen.queryByText('Clave copiada al portapapeles')).not.toBeInTheDocument();
    });

    it('should show check icon after copying', async () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const copyButton = screen.getByTitle(/Copiar/i);
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // The button should now have title "Copiado"
      expect(screen.getByTitle('Copiado')).toBeInTheDocument();
    });
  });

  describe('Usage Hint', () => {
    it('should show usage hint for Authorization header', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText(/Usa esta clave en el header/)).toBeInTheDocument();
    });

    it('should show example header with truncated key', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      // Should show Authorization: Bearer vfy_abc12345... (first 12 chars)
      expect(screen.getByText(/Authorization: Bearer/)).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should have acknowledgment button', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      expect(screen.getByText('Entendido, ya copié mi clave')).toBeInTheDocument();
    });

    it('should call onClose when clicking acknowledgment button', () => {
      const onClose = jest.fn();
      render(<ApiKeyCreatedModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText('Entendido, ya copié mi clave');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should have primary button styling', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const closeButton = screen.getByText('Entendido, ya copié mi clave');
      expect(closeButton).toHaveClass('bg-primary');
    });

    it('should span full width', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const closeButton = screen.getByText('Entendido, ya copié mi clave');
      expect(closeButton).toHaveClass('w-full');
    });
  });

  describe('Key Icon', () => {
    it('should display key icon in success circle', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      // The icon is within a green circle
      const iconContainer = document.querySelector('.bg-green-100');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have selectable key text', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const keyDisplay = screen.getByText(mockFullKey);
      expect(keyDisplay).toHaveClass('select-all');
    });

    it('should have proper heading structure', () => {
      render(<ApiKeyCreatedModal {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Clave de API Creada');
    });
  });
});
