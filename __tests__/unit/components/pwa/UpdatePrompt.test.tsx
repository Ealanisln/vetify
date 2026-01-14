import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';

// Mock navigator.serviceWorker
const mockServiceWorkerReady = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockPostMessage = jest.fn();

// Store event handlers for testing
let controllerChangeHandler: (() => void) | null = null;
let updateFoundHandler: (() => void) | null = null;
let stateChangeHandler: (() => void) | null = null;

const createMockRegistration = (options: {
  waiting?: ServiceWorker | null;
  installing?: ServiceWorker | null;
} = {}) => ({
  waiting: options.waiting || null,
  installing: options.installing || null,
  addEventListener: jest.fn((event: string, handler: () => void) => {
    if (event === 'updatefound') {
      updateFoundHandler = handler;
    }
  }),
  removeEventListener: jest.fn(),
});

const createMockServiceWorker = (state: string = 'installed') => ({
  state,
  postMessage: mockPostMessage,
  addEventListener: jest.fn((event: string, handler: () => void) => {
    if (event === 'statechange') {
      stateChangeHandler = handler;
    }
  }),
});

// Setup mock navigator
const setupNavigatorMock = (options: {
  hasServiceWorker?: boolean;
  registration?: ReturnType<typeof createMockRegistration>;
  controller?: ServiceWorker | null;
} = {}) => {
  const {
    hasServiceWorker = true,
    registration = createMockRegistration(),
    controller = {} as ServiceWorker,
  } = options;

  if (hasServiceWorker) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(registration),
        controller,
        addEventListener: jest.fn((event: string, handler: () => void) => {
          if (event === 'controllerchange') {
            controllerChangeHandler = handler;
          }
          mockAddEventListener(event, handler);
        }),
        removeEventListener: jest.fn((event: string, handler: () => void) => {
          if (event === 'controllerchange') {
            controllerChangeHandler = null;
          }
          mockRemoveEventListener(event, handler);
        }),
      },
      writable: true,
      configurable: true,
    });
  } else {
    // Remove serviceWorker property
    const nav = navigator as { serviceWorker?: unknown };
    delete nav.serviceWorker;
  }

  return registration;
};

// Note: window.location.reload cannot be mocked in jsdom
// We test the behavior leading up to reload, but cannot verify the actual reload call

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

describe('UpdatePrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    controllerChangeHandler = null;
    updateFoundHandler = null;
    stateChangeHandler = null;
    // Set to production for tests
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Initial Rendering', () => {
    it('should not render anything initially when no update is available', async () => {
      setupNavigatorMock();

      const { container } = render(<UpdatePrompt />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(container.firstChild).toBeNull();
    });

    it('should not render in development environment', async () => {
      process.env.NODE_ENV = 'development';
      setupNavigatorMock();

      const { container } = render(<UpdatePrompt />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(container.firstChild).toBeNull();
    });

    it('should not render when serviceWorker is not supported', async () => {
      setupNavigatorMock({ hasServiceWorker: false });

      const { container } = render(<UpdatePrompt />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Update Detection - Waiting Service Worker', () => {
    it('should show prompt when there is a waiting service worker', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });
    });

    it('should display update description text', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText(/Hay una actualizacion de Vetify disponible/)).toBeInTheDocument();
      });
    });
  });

  describe('Update Detection - Installing Service Worker', () => {
    it('should show prompt when new service worker is installed', async () => {
      const mockRegistration = createMockRegistration();
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      // Wait for component to set up listeners
      await act(async () => {
        await Promise.resolve();
      });

      // Simulate updatefound event
      const mockInstallingSW = createMockServiceWorker('installing');
      (mockRegistration as { installing: unknown }).installing = mockInstallingSW;

      await act(async () => {
        if (updateFoundHandler) {
          updateFoundHandler();
        }
      });

      // Simulate state change to installed
      mockInstallingSW.state = 'installed';

      await act(async () => {
        if (stateChangeHandler) {
          stateChangeHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });
    });
  });

  describe('Update Detection - Controller Change', () => {
    it('should show prompt on controller change event', async () => {
      setupNavigatorMock();

      render(<UpdatePrompt />);

      // Wait for component to set up listeners
      await act(async () => {
        await Promise.resolve();
      });

      // Simulate controller change
      await act(async () => {
        if (controllerChangeHandler) {
          controllerChangeHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should render "Actualizar ahora" button', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Actualizar ahora/i })).toBeInTheDocument();
      });
    });

    it('should render "Mas tarde" button', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mas tarde/i })).toBeInTheDocument();
      });
    });

    it('should render close button with aria-label', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();
      });
    });

    it('should dismiss prompt when "Mas tarde" is clicked', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Mas tarde/i }));

      await waitFor(() => {
        expect(screen.queryByText('Nueva version disponible')).not.toBeInTheDocument();
      });
    });

    it('should dismiss prompt when close button is clicked', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));

      await waitFor(() => {
        expect(screen.queryByText('Nueva version disponible')).not.toBeInTheDocument();
      });
    });
  });

  describe('Update Action', () => {
    it('should post SKIP_WAITING message when update is clicked', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Actualizar ahora/i }));

      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      });
    });

    it('should show loading state when update is in progress', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Actualizar ahora/i }));

      await waitFor(() => {
        expect(screen.getByText('Actualizando...')).toBeInTheDocument();
      });
    });

    it('should disable update button while updating', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Actualizar ahora/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        const disabledButton = screen.getByRole('button', { name: /Actualizando/i });
        expect(disabledButton).toBeDisabled();
      });
    });

    it('should trigger reload process after update (timer advances)', async () => {
      // Note: We cannot mock window.location.reload in jsdom
      // This test verifies the timer-based reload flow is set up correctly
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Actualizar ahora/i }));

      // Fast-forward timer for the reload delay
      // The component sets a 100ms timeout before reload
      await act(async () => {
        jest.advanceTimersByTime(150);
      });

      // Verify the SW message was sent and timer completed without errors
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', async () => {
      setupNavigatorMock();

      const { unmount } = render(<UpdatePrompt />);

      await act(async () => {
        await Promise.resolve();
      });

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));
    });
  });

  describe('Styling', () => {
    it('should have proper positioning classes', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      const { container } = render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      const promptContainer = container.firstChild as HTMLElement;
      expect(promptContainer).toHaveClass('fixed');
      expect(promptContainer).toHaveClass('bottom-4');
      expect(promptContainer).toHaveClass('z-50');
    });

    it('should have refresh icon', async () => {
      const mockSW = createMockServiceWorker('installed');
      const mockRegistration = createMockRegistration({ waiting: mockSW as unknown as ServiceWorker });
      setupNavigatorMock({ registration: mockRegistration, controller: {} as ServiceWorker });

      render(<UpdatePrompt />);

      await waitFor(() => {
        expect(screen.getByText('Nueva version disponible')).toBeInTheDocument();
      });

      // The RefreshCw icon should be present (SVG element)
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });
});
