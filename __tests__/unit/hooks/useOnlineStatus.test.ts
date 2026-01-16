/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  // Store original navigator.onLine value
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    // Reset navigator.onLine to true before each test
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original value
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  describe('Initial State', () => {
    it('should return isOnline as true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(true);
    });

    it('should return isOnline as false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(false);
    });

    it('should initialize wasOffline as false', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.wasOffline).toBe(false);
    });

    it('should initialize lastOnlineAt as null', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.lastOnlineAt).toBeNull();
    });
  });

  describe('Online Event', () => {
    it('should update isOnline to true when online event fires', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('should set wasOffline to true when coming back online', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.wasOffline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.wasOffline).toBe(true);
    });

    it('should set lastOnlineAt when coming back online', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const beforeOnline = new Date();
      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.lastOnlineAt).not.toBeNull();
      expect(result.current.lastOnlineAt!.getTime()).toBeGreaterThanOrEqual(beforeOnline.getTime());
    });

    it('should not change wasOffline if already online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.wasOffline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      // wasOffline should still be false since we weren't offline
      expect(result.current.wasOffline).toBe(false);
    });
  });

  describe('Offline Event', () => {
    it('should update isOnline to false when offline event fires', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(true);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should preserve wasOffline state when going offline', () => {
      const { result } = renderHook(() => useOnlineStatus());

      // Simulate: start online -> go offline -> come online -> go offline again
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.wasOffline).toBe(true);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // wasOffline should still be true
      expect(result.current.wasOffline).toBe(true);
    });
  });

  describe('resetWasOffline()', () => {
    it('should reset wasOffline to false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      // Trigger online event to set wasOffline
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.wasOffline).toBe(true);

      act(() => {
        result.current.resetWasOffline();
      });

      expect(result.current.wasOffline).toBe(false);
    });

    it('should preserve other state when resetting', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      const lastOnlineAtBefore = result.current.lastOnlineAt;

      act(() => {
        result.current.resetWasOffline();
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.lastOnlineAt).toBe(lastOnlineAtBefore);
    });

    it('should be callable multiple times', () => {
      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        result.current.resetWasOffline();
        result.current.resetWasOffline();
        result.current.resetWasOffline();
      });

      expect(result.current.wasOffline).toBe(false);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should add event listeners on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useOnlineStatus());

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useOnlineStatus());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current).toHaveProperty('isOnline');
      expect(result.current).toHaveProperty('wasOffline');
      expect(result.current).toHaveProperty('lastOnlineAt');
      expect(result.current).toHaveProperty('resetWasOffline');
    });

    it('should have resetWasOffline as a function', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(typeof result.current.resetWasOffline).toBe('function');
    });
  });

  describe('Full Offline/Online Cycle', () => {
    it('should handle a complete offline to online cycle', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      const { result } = renderHook(() => useOnlineStatus());

      // Initial state
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);
      expect(result.current.lastOnlineAt).toBeNull();

      // Go offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.wasOffline).toBe(false); // Not yet set until we come back

      // Come back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(true);
      expect(result.current.lastOnlineAt).not.toBeNull();

      // Reset the flag
      act(() => {
        result.current.resetWasOffline();
      });

      expect(result.current.wasOffline).toBe(false);
    });
  });
});
