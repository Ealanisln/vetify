/**
 * Unit tests for QrCodeGenerator Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QrCodeGenerator } from '@/components/settings/QrCodeGenerator';

// Mock qrcode.react
jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-svg" data-value={value}>
      <text>{value}</text>
    </svg>
  ),
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-canvas" data-value={value} />
  ),
}));

// Mock jspdf
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    addImage: jest.fn(),
    setTextColor: jest.fn(),
    save: jest.fn(),
  })),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the SEO config module
jest.mock('@/lib/seo/config', () => ({
  getBaseUrl: jest.fn(() => 'http://localhost:3000'),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('QrCodeGenerator Component', () => {
  const mockTenantId = 'tenant-123';

  const mockTenantData = {
    slug: 'mi-clinica',
    name: 'Mi Clínica Veterinaria',
    publicPageEnabled: true,
    publicThemeColor: '#75a99c',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful fetch mock
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockTenantData }),
      })
    ) as jest.Mock;
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      // Never resolve to keep loading state
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

      render(<QrCodeGenerator tenantId={mockTenantId} />);
      expect(screen.getByTestId('qr-loading')).toBeInTheDocument();
    });

    it('should show loading spinner', () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

      const { container } = render(<QrCodeGenerator tenantId={mockTenantId} />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Rendering After Load', () => {
    it('should render QR preview after loading', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      expect(screen.getByTestId('qr-svg')).toBeInTheDocument();
    });

    it('should display the generated URL', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-url-display')).toBeInTheDocument();
      });

      expect(screen.getByTestId('qr-url-display')).toHaveTextContent(
        'http://localhost:3000/mi-clinica'
      );
    });

    it('should render all download buttons', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      expect(screen.getByTestId('download-png')).toBeInTheDocument();
      expect(screen.getByTestId('download-svg')).toBeInTheDocument();
      expect(screen.getByTestId('download-pdf')).toBeInTheDocument();
    });

    it('should render the QR generator container', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-generator-container')).toBeInTheDocument();
      });
    });
  });

  describe('Public Page Warning', () => {
    it('should show warning when public page is disabled', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { ...mockTenantData, publicPageEnabled: false },
            }),
        })
      ) as jest.Mock;

      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('public-page-warning')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/página pública deshabilitada/i)
      ).toBeInTheDocument();
    });

    it('should not show warning when public page is enabled', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('public-page-warning')
      ).not.toBeInTheDocument();
    });
  });

  describe('Target Page Selection', () => {
    it('should update URL when target page changes to booking', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      // Find and click the booking option
      const bookingLabel = screen.getByText('Agendar Cita');
      fireEvent.click(bookingLabel.closest('label')!);

      await waitFor(() => {
        expect(screen.getByTestId('qr-url-display')).toHaveTextContent(
          '/agendar'
        );
      });
    });

    it('should update URL when target page changes to services', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      // Find and click the services option
      const servicesLabel = screen.getByText('Servicios');
      fireEvent.click(servicesLabel.closest('label')!);

      await waitFor(() => {
        expect(screen.getByTestId('qr-url-display')).toHaveTextContent(
          '/servicios'
        );
      });
    });

    it('should display all target page options', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      expect(screen.getByText('Página Principal')).toBeInTheDocument();
      expect(screen.getByText('Agendar Cita')).toBeInTheDocument();
      expect(screen.getByText('Servicios')).toBeInTheDocument();
    });
  });

  describe('Size Selection', () => {
    it('should have a size selector', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      expect(screen.getByTestId('size-select')).toBeInTheDocument();
    });

    it('should have all size options', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      const sizeSelect = screen.getByTestId('size-select');
      expect(sizeSelect).toHaveTextContent('Pequeño');
      expect(sizeSelect).toHaveTextContent('Mediano');
      expect(sizeSelect).toHaveTextContent('Grande');
      expect(sizeSelect).toHaveTextContent('Extra grande');
    });

    it('should update size when selection changes', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      const sizeSelect = screen.getByTestId('size-select');
      fireEvent.change(sizeSelect, { target: { value: '512' } });

      expect(sizeSelect).toHaveValue('512');
    });
  });

  describe('Color Configuration', () => {
    it('should have color input for QR foreground', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      expect(screen.getByTestId('fg-color-input')).toBeInTheDocument();
    });

    it('should use tenant theme color as default', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      const colorInput = screen.getByTestId('fg-color-input');
      expect(colorInput).toHaveValue('#75a99c');
    });

    it('should update color when input changes', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      const colorInput = screen.getByTestId('fg-color-input');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      expect(colorInput).toHaveValue('#ff0000');
    });
  });


  describe('Error Handling', () => {
    it('should show error message on fetch failure', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock;

      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(
          screen.getByText(/error al cargar la configuración/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error message on API error response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'API Error' }),
        })
      ) as jest.Mock;

      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(
          screen.getByText(/error al cargar la configuración/i)
        ).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock;

      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
    });
  });

  describe('Copy URL Functionality', () => {
    it('should copy URL to clipboard when copy button is clicked', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      // Find the copy button (it's the one with Copy icon)
      const copyButton = screen.getByTestId('qr-url-display').parentElement?.querySelector('button');
      if (copyButton) {
        fireEvent.click(copyButton);
      }

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'http://localhost:3000/mi-clinica'
        );
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should have reset button', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Restablecer valores predeterminados')
      ).toBeInTheDocument();
    });

    it('should reset values when reset button is clicked', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      // Change some values first
      const sizeSelect = screen.getByTestId('size-select');
      fireEvent.change(sizeSelect, { target: { value: '512' } });

      // Click reset
      const resetButton = screen.getByText('Restablecer valores predeterminados');
      fireEvent.click(resetButton);

      // Check that size is back to default (256)
      expect(sizeSelect).toHaveValue('256');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for size select', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      const sizeSelect = screen.getByTestId('size-select');
      expect(sizeSelect).toHaveAttribute('aria-label', 'tamaño');
    });

    it('should have proper aria labels for color input', async () => {
      render(<QrCodeGenerator tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByTestId('qr-preview')).toBeInTheDocument();
      });

      const colorInput = screen.getByTestId('fg-color-input');
      expect(colorInput).toHaveAttribute('aria-label', 'color');
    });
  });
});
