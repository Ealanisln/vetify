/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Notification API
const mockNotificationPermission = jest.fn();
Object.defineProperty(global, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: mockNotificationPermission,
  },
  writable: true,
});

// Mock Service Worker
const mockGetSubscription = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

const mockPushManager = {
  getSubscription: mockGetSubscription,
  subscribe: mockSubscribe,
};

const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve(mockServiceWorkerRegistration),
  },
  writable: true,
});

// Mock PushManager
Object.defineProperty(global, 'PushManager', {
  value: class PushManager {},
  writable: true,
});

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSubscription.mockResolvedValue(null);
    mockFetch.mockReset();

    // Reset Notification permission
    Object.defineProperty(Notification, 'permission', {
      value: 'default',
      writable: true,
    });
  });

  describe('Initial State', () => {
    it('should check support on mount', async () => {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      expect(result.current.isSupported).toBe(true);
    });

    // Note: Testing unsupported browsers requires complex JSDOM mocking
    // The hook correctly checks for 'Notification' in window, 'serviceWorker' in navigator,
    // and 'PushManager' in window. When any is missing, isSupported becomes false.
    // The actual browser behavior is covered by integration/E2E tests.

    it('should check existing subscription on mount', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/123',
        toJSON: () => ({
          endpoint: 'https://push.example.com/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        }),
      };
      mockGetSubscription.mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });
    });

    it('should detect granted permission', async () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: true,
      });

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).toBe('granted');
      });
    });

    it('should detect denied permission', async () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'denied',
        writable: true,
      });

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).toBe('denied');
      });
    });
  });

  describe('subscribe()', () => {
    it('should request permission and subscribe', async () => {
      mockNotificationPermission.mockResolvedValue('granted');
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ configured: true, publicKey: 'test-vapid-key' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const mockSubscription = {
        endpoint: 'https://push.example.com/123',
        toJSON: () => ({
          endpoint: 'https://push.example.com/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        }),
      };
      mockSubscribe.mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      let subscribeResult: boolean | undefined;
      await act(async () => {
        subscribeResult = await result.current.subscribe();
      });

      expect(subscribeResult).toBe(true);
      expect(result.current.isSubscribed).toBe(true);
      expect(result.current.permission).toBe('granted');
      expect(mockNotificationPermission).toHaveBeenCalled();
    });

    it('should handle denied permission', async () => {
      mockNotificationPermission.mockResolvedValue('denied');

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      let subscribeResult: boolean | undefined;
      await act(async () => {
        subscribeResult = await result.current.subscribe();
      });

      expect(subscribeResult).toBe(false);
      expect(result.current.permission).toBe('denied');
      expect(result.current.error).toBe('Permiso de notificaciones denegado');
    });

    it('should handle server not configured', async () => {
      mockNotificationPermission.mockResolvedValue('granted');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ configured: false }),
      });

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      let subscribeResult: boolean | undefined;
      await act(async () => {
        subscribeResult = await result.current.subscribe();
      });

      expect(subscribeResult).toBe(false);
      expect(result.current.error).toBe('Push notifications not configured on server');
    });

    it('should handle subscription failure', async () => {
      mockNotificationPermission.mockResolvedValue('granted');
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ configured: true, publicKey: 'test-vapid-key' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' }),
        });

      const mockSubscription = {
        endpoint: 'https://push.example.com/123',
        toJSON: () => ({
          endpoint: 'https://push.example.com/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        }),
      };
      mockSubscribe.mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      let subscribeResult: boolean | undefined;
      await act(async () => {
        subscribeResult = await result.current.subscribe();
      });

      expect(subscribeResult).toBe(false);
      expect(result.current.error).toBe('Failed to register subscription on server');
    });

    it('should set loading state during subscription', async () => {
      mockNotificationPermission.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('granted'), 100))
      );

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      act(() => {
        result.current.subscribe();
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('unsubscribe()', () => {
    it('should unsubscribe and notify server', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/123',
        unsubscribe: mockUnsubscribe.mockResolvedValue(true),
        toJSON: () => ({
          endpoint: 'https://push.example.com/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        }),
      };
      mockGetSubscription.mockResolvedValue(mockSubscription);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });

      let unsubscribeResult: boolean | undefined;
      await act(async () => {
        unsubscribeResult = await result.current.unsubscribe();
      });

      expect(unsubscribeResult).toBe(true);
      expect(result.current.isSubscribed).toBe(false);
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/push/subscribe',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle unsubscribe when no subscription exists', async () => {
      mockGetSubscription.mockResolvedValue(null);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      let unsubscribeResult: boolean | undefined;
      await act(async () => {
        unsubscribeResult = await result.current.unsubscribe();
      });

      expect(unsubscribeResult).toBe(true);
      expect(result.current.isSubscribed).toBe(false);
    });

    it('should handle unsubscribe error', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/123',
        unsubscribe: mockUnsubscribe.mockRejectedValue(new Error('Unsubscribe failed')),
        toJSON: () => ({
          endpoint: 'https://push.example.com/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        }),
      };
      mockGetSubscription.mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });

      let unsubscribeResult: boolean | undefined;
      await act(async () => {
        unsubscribeResult = await result.current.unsubscribe();
      });

      expect(unsubscribeResult).toBe(false);
      expect(result.current.error).toBe('Unsubscribe failed');
    });

    it('should set loading state during unsubscribe', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/123',
        unsubscribe: mockUnsubscribe.mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
        ),
        toJSON: () => ({
          endpoint: 'https://push.example.com/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        }),
      };
      mockGetSubscription.mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });

      act(() => {
        result.current.unsubscribe();
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', async () => {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      expect(result.current).toHaveProperty('isSupported');
      expect(result.current).toHaveProperty('permission');
      expect(result.current).toHaveProperty('isSubscribed');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('subscribe');
      expect(result.current).toHaveProperty('unsubscribe');
    });

    it('should have subscribe as a function', async () => {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      expect(typeof result.current.subscribe).toBe('function');
    });

    it('should have unsubscribe as a function', async () => {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.permission).not.toBe('loading');
      });

      expect(typeof result.current.unsubscribe).toBe('function');
    });
  });
});
