import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

// Mock the usePWAInstall hook
const mockPromptInstall = jest.fn();
const mockDismiss = jest.fn();

jest.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: jest.fn(() => ({
    isInstallable: false,
    isIOS: false,
    isStandalone: false,
    isDismissed: false,
    promptInstall: mockPromptInstall,
    dismiss: mockDismiss,
  })),
}));

// Import the mock to control it
import { usePWAInstall } from '@/hooks/usePWAInstall';
const mockUsePWAInstall = usePWAInstall as jest.MockedFunction<typeof usePWAInstall>;

describe('InstallPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('should not render when not installable and not iOS', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: false,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });

      const { container } = render(<InstallPrompt />);

      // Fast-forward past the delay
      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(container.firstChild).toBeNull();
    });

    it('should not render when already installed (standalone)', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: true, // Already installed
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });

      const { container } = render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(container.firstChild).toBeNull();
    });

    it('should not render when dismissed', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: true, // User dismissed
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });

      const { container } = render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(container.firstChild).toBeNull();
    });

    it('should render after delay when installable', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });

      render(<InstallPrompt />);

      // Should not be visible immediately
      expect(screen.queryByText('Instalar Vetify')).not.toBeInTheDocument();

      // Fast-forward past the 3 second delay
      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByText('Instalar Vetify')).toBeInTheDocument();
    });
  });

  describe('Android/Chrome Variant', () => {
    beforeEach(() => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });
    });

    it('should show install button', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByRole('button', { name: /Instalar/i })).toBeInTheDocument();
    });

    it('should show "Mas tarde" button', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByRole('button', { name: /Mas tarde/i })).toBeInTheDocument();
    });

    it('should show description text', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByText(/acceso rapido y uso sin conexion/i)).toBeInTheDocument();
    });

    it('should call promptInstall when install button is clicked', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      fireEvent.click(screen.getByRole('button', { name: /^Instalar$/i }));

      await waitFor(() => {
        expect(mockPromptInstall).toHaveBeenCalled();
      });
    });

    it('should call dismiss when "Mas tarde" is clicked', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      fireEvent.click(screen.getByRole('button', { name: /Mas tarde/i }));

      expect(mockDismiss).toHaveBeenCalled();
    });

    it('should call dismiss when close button is clicked', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));

      expect(mockDismiss).toHaveBeenCalled();
    });
  });

  describe('iOS Variant', () => {
    beforeEach(() => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: false,
        isIOS: true,
        isStandalone: false,
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });
    });

    it('should show iOS instructions', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByText(/Para instalar la app en tu dispositivo/i)).toBeInTheDocument();
    });

    it('should show step 1 instruction', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByText(/Toca el boton/i)).toBeInTheDocument();
      expect(screen.getByText(/Compartir/i)).toBeInTheDocument();
    });

    it('should show step 2 instruction', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByText(/Agregar a inicio/i)).toBeInTheDocument();
    });

    it('should show "Entendido" button instead of "Instalar"', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByRole('button', { name: /Entendido/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Instalar$/i })).not.toBeInTheDocument();
    });

    it('should call dismiss when "Entendido" is clicked', async () => {
      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      fireEvent.click(screen.getByRole('button', { name: /Entendido/i }));

      expect(mockDismiss).toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should have fixed positioning', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });

      const { container } = render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      const prompt = container.firstChild as HTMLElement;
      expect(prompt).toHaveClass('fixed');
      expect(prompt).toHaveClass('bottom-20');
      expect(prompt).toHaveClass('z-50');
    });

    it('should have animation class', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });

      const { container } = render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      const prompt = container.firstChild as HTMLElement;
      expect(prompt).toHaveClass('animate-in');
    });

    it('should have close button with aria-label', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: mockPromptInstall,
        dismiss: mockDismiss,
      });

      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      const closeButton = screen.getByRole('button', { name: /Cerrar/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Cerrar');
    });
  });

  describe('Loading State', () => {
    it('should show loading state when installing', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: jest.fn(() => new Promise((resolve) => setTimeout(resolve, 1000))),
        dismiss: mockDismiss,
      });

      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      fireEvent.click(screen.getByRole('button', { name: /^Instalar$/i }));

      await waitFor(() => {
        expect(screen.getByText(/Instalando/i)).toBeInTheDocument();
      });
    });

    it('should disable install button when installing', async () => {
      mockUsePWAInstall.mockReturnValue({
        isInstallable: true,
        isIOS: false,
        isStandalone: false,
        isDismissed: false,
        promptInstall: jest.fn(() => new Promise((resolve) => setTimeout(resolve, 1000))),
        dismiss: mockDismiss,
      });

      render(<InstallPrompt />);

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      fireEvent.click(screen.getByRole('button', { name: /^Instalar$/i }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Instalando/i });
        expect(button).toBeDisabled();
      });
    });
  });
});
