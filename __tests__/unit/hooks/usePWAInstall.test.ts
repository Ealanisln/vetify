/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// Mock meta-events tracking
jest.mock('@/lib/analytics/meta-events', () => ({
  trackPWAInstall: jest.fn(),
}));

import { trackPWAInstall } from '@/lib/analytics/meta-events';
const mockTrackPWAInstall = trackPWAInstall as jest.MockedFunction<typeof trackPWAInstall>;

describe('usePWAInstall', () => {
  let beforeInstallPromptHandlers: Array<(e: Event) => void> = [];
  let appInstalledHandlers: Array<() => void> = [];
  let mockLocalStorage: Record<string, string> = {};

  // Mock BeforeInstallPromptEvent
  const createMockBeforeInstallPromptEvent = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
    const mockEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome }),
    };
    return mockEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    beforeInstallPromptHandlers = [];
    appInstalledHandlers = [];
    mockLocalStorage = {};

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
      },
      writable: true,
    });

    // Mock matchMedia for standalone detection
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockReturnValue({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }),
      writable: true,
    });

    // Mock navigator
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      configurable: true,
    });

    Object.defineProperty(navigator, 'vendor', {
      value: 'Google Inc.',
      configurable: true,
    });

    // Mock addEventListener
    jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'beforeinstallprompt') {
        beforeInstallPromptHandlers.push(handler as (e: Event) => void);
      } else if (event === 'appinstalled') {
        appInstalledHandlers.push(handler as () => void);
      }
    });

    // Mock removeEventListener
    jest.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'beforeinstallprompt') {
        beforeInstallPromptHandlers = beforeInstallPromptHandlers.filter(h => h !== handler);
      } else if (event === 'appinstalled') {
        appInstalledHandlers = appInstalledHandlers.filter(h => h !== handler);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with isInstallable: false', () => {
      const { result } = renderHook(() => usePWAInstall());

      expect(result.current.isInstallable).toBe(false);
    });

    it('should initialize with isStandalone: false when not in standalone mode', async () => {
      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isStandalone).toBe(false);
      });
    });

    it('should initialize with isDismissed: true (prevents flash) then update based on localStorage', async () => {
      // Initial render should be true (default to prevent flash)
      // After useEffect runs, it becomes false when no localStorage entry exists
      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        // After effect runs and finds no dismissal in localStorage, it sets to false
        expect(result.current.isDismissed).toBe(false);
      });
    });

    it('should provide promptInstall function', () => {
      const { result } = renderHook(() => usePWAInstall());

      expect(typeof result.current.promptInstall).toBe('function');
    });

    it('should provide dismiss function', () => {
      const { result } = renderHook(() => usePWAInstall());

      expect(typeof result.current.dismiss).toBe('function');
    });
  });

  describe('iOS Detection', () => {
    it('should detect iOS devices', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      });

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isIOS).toBe(true);
      });
    });

    it('should detect iPad devices', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      });

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isIOS).toBe(true);
      });
    });

    it('should NOT detect non-iOS devices as iOS', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile',
        configurable: true,
      });

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isIOS).toBe(false);
      });
    });
  });

  describe('Standalone Detection', () => {
    it('should detect standalone mode via matchMedia', async () => {
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockReturnValue({
          matches: true,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        }),
        writable: true,
      });

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isStandalone).toBe(true);
      });
    });

    it('should detect iOS standalone mode via navigator.standalone', async () => {
      Object.defineProperty(navigator, 'standalone', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isStandalone).toBe(true);
      });
    });
  });

  describe('BeforeInstallPrompt Event', () => {
    it('should capture beforeinstallprompt event', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent();

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      await waitFor(() => {
        expect(result.current.isInstallable).toBe(true);
      });
    });

    it('should preventDefault on beforeinstallprompt event', async () => {
      renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent();

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should track pwa_prompt_shown when event fires', async () => {
      renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent();

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      expect(mockTrackPWAInstall).toHaveBeenCalledWith('pwa_prompt_shown');
    });
  });

  describe('promptInstall', () => {
    it('should do nothing if no install prompt is available', async () => {
      const { result } = renderHook(() => usePWAInstall());

      await act(async () => {
        await result.current.promptInstall();
      });

      // Should not throw
      expect(result.current.isInstallable).toBe(false);
    });

    it('should call prompt() on the stored event', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent('accepted');

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      await act(async () => {
        await result.current.promptInstall();
      });

      expect(mockEvent.prompt).toHaveBeenCalled();
    });

    it('should track pwa_install_accepted when user accepts', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent('accepted');

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      await act(async () => {
        await result.current.promptInstall();
      });

      expect(mockTrackPWAInstall).toHaveBeenCalledWith('pwa_install_accepted');
    });

    it('should track pwa_install_dismissed when user dismisses', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent('dismissed');

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      await act(async () => {
        await result.current.promptInstall();
      });

      expect(mockTrackPWAInstall).toHaveBeenCalledWith('pwa_install_dismissed');
    });

    it('should clear install prompt after user accepts', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent('accepted');

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      expect(result.current.isInstallable).toBe(true);

      await act(async () => {
        await result.current.promptInstall();
      });

      expect(result.current.isInstallable).toBe(false);
    });
  });

  describe('appinstalled Event', () => {
    it('should set isStandalone true when app is installed', async () => {
      const { result } = renderHook(() => usePWAInstall());

      act(() => {
        appInstalledHandlers.forEach(handler => handler());
      });

      expect(result.current.isStandalone).toBe(true);
    });

    it('should clear install prompt when app is installed', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockEvent = createMockBeforeInstallPromptEvent();

      act(() => {
        beforeInstallPromptHandlers.forEach(handler => handler(mockEvent as unknown as Event));
      });

      expect(result.current.isInstallable).toBe(true);

      act(() => {
        appInstalledHandlers.forEach(handler => handler());
      });

      expect(result.current.isInstallable).toBe(false);
    });

    it('should track pwa_installed when app is installed', async () => {
      renderHook(() => usePWAInstall());

      act(() => {
        appInstalledHandlers.forEach(handler => handler());
      });

      expect(mockTrackPWAInstall).toHaveBeenCalledWith('pwa_installed');
    });
  });

  describe('Dismiss Functionality', () => {
    it('should set isDismissed to true when dismiss is called', async () => {
      // Set up so isDismissed is false
      mockLocalStorage = {};

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isDismissed).toBe(false);
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.isDismissed).toBe(true);
    });

    it('should save dismiss date to localStorage', async () => {
      const { result } = renderHook(() => usePWAInstall());

      act(() => {
        result.current.dismiss();
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pwa-install-dismissed',
        expect.any(String)
      );
    });

    it('should keep isDismissed true if dismissed within 7 days', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      mockLocalStorage = {
        'pwa-install-dismissed': threeDaysAgo.toISOString(),
      };

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isDismissed).toBe(true);
      });
    });

    it('should set isDismissed false if dismissed more than 7 days ago', async () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      mockLocalStorage = {
        'pwa-install-dismissed': tenDaysAgo.toISOString(),
      };

      const { result } = renderHook(() => usePWAInstall());

      await waitFor(() => {
        expect(result.current.isDismissed).toBe(false);
      });
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => usePWAInstall());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      );
    });
  });
});
