/**
 * Unit tests for expiring localStorage utility
 */

import {
  setWithExpiry,
  getWithExpiry,
  removeItem,
  clearExpired,
  hasValidItem,
  getRemainingTTL,
  extendTTL,
  getNotificationDismissalKey,
  getWelcomeBannerKey,
  getLocationSelectionKey,
} from '@/lib/storage/expiring-storage';
import { STORAGE_TTL_DEFAULT } from '@/lib/constants';

describe('Expiring Storage', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let mockStore: Record<string, string>;

  // Mock localStorage methods
  const mockGetItem = jest.fn();
  const mockSetItem = jest.fn();
  const mockRemoveItem = jest.fn();
  const mockClear = jest.fn();
  const mockKey = jest.fn();

  beforeEach(() => {
    mockStore = {};
    jest.clearAllMocks();

    // Reset mock implementations
    mockGetItem.mockImplementation((key: string) => mockStore[key] || null);
    mockSetItem.mockImplementation((key: string, value: string) => {
      mockStore[key] = value;
    });
    mockRemoveItem.mockImplementation((key: string) => {
      delete mockStore[key];
    });
    mockClear.mockImplementation(() => {
      mockStore = {};
    });
    mockKey.mockImplementation(
      (index: number) => Object.keys(mockStore)[index] || null
    );

    // Mock localStorage on window
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        clear: mockClear,
        key: mockKey,
        get length() {
          return Object.keys(mockStore).length;
        },
      },
      writable: true,
      configurable: true,
    });

    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Reset Date.now for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('setWithExpiry', () => {
    it('should store value with expiry time', () => {
      const testValue = { name: 'test' };
      const ttl = 60000; // 1 minute

      setWithExpiry('test-key', testValue, ttl);

      expect(mockSetItem).toHaveBeenCalledWith('test-key', expect.any(String));

      const storedValue = JSON.parse(mockSetItem.mock.calls[0][1]);
      expect(storedValue.value).toEqual(testValue);
      expect(storedValue.expiry).toBe(Date.now() + ttl);
    });

    it('should use default TTL when not specified', () => {
      setWithExpiry('test-key', 'value');

      const storedValue = JSON.parse(mockSetItem.mock.calls[0][1]);
      expect(storedValue.expiry).toBe(Date.now() + STORAGE_TTL_DEFAULT);
    });

    it('should handle storage errors gracefully', () => {
      mockSetItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceeded');
      });

      // Should not throw
      setWithExpiry('test-key', 'value');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should store various data types', () => {
      setWithExpiry('string-key', 'string value', 1000);
      setWithExpiry('number-key', 42, 1000);
      setWithExpiry('boolean-key', true, 1000);
      setWithExpiry('array-key', [1, 2, 3], 1000);
      setWithExpiry('object-key', { nested: { value: 'test' } }, 1000);

      expect(mockSetItem).toHaveBeenCalledTimes(5);
    });
  });

  describe('getWithExpiry', () => {
    it('should return stored value if not expired', () => {
      const testValue = { name: 'test', count: 5 };
      const futureExpiry = Date.now() + 60000;

      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: testValue, expiry: futureExpiry })
      );

      const result = getWithExpiry<typeof testValue>('test-key');
      expect(result).toEqual(testValue);
    });

    it('should return null for expired items', () => {
      const pastExpiry = Date.now() - 1000;

      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: 'expired', expiry: pastExpiry })
      );

      const result = getWithExpiry('test-key');
      expect(result).toBeNull();
      expect(mockRemoveItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent keys', () => {
      mockGetItem.mockReturnValueOnce(null);

      const result = getWithExpiry('non-existent');
      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      mockGetItem.mockReturnValueOnce('not-valid-json');

      const result = getWithExpiry('bad-json');
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      removeItem('test-key');
      expect(mockRemoveItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle removal errors gracefully', () => {
      mockRemoveItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      removeItem('test-key');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('clearExpired', () => {
    it('should remove all expired items', () => {
      const pastExpiry = Date.now() - 1000;
      const futureExpiry = Date.now() + 60000;

      // Setup mock store with items
      mockStore = {
        'expired-1': JSON.stringify({ value: 'old', expiry: pastExpiry }),
        'valid-1': JSON.stringify({ value: 'current', expiry: futureExpiry }),
        'expired-2': JSON.stringify({
          value: 'old2',
          expiry: pastExpiry - 5000,
        }),
      };

      clearExpired();

      expect(mockRemoveItem).toHaveBeenCalledWith('expired-1');
      expect(mockRemoveItem).toHaveBeenCalledWith('expired-2');
      expect(mockRemoveItem).not.toHaveBeenCalledWith('valid-1');
    });

    it('should skip non-expiring storage items', () => {
      mockStore = {
        'regular-item': JSON.stringify({ someData: 'value' }),
        'non-json': 'plain string',
      };

      // Should not throw and should not remove regular items
      clearExpired();
      expect(mockRemoveItem).not.toHaveBeenCalled();
    });
  });

  describe('hasValidItem', () => {
    it('should return true for valid, non-expired items', () => {
      const futureExpiry = Date.now() + 60000;
      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: 'test', expiry: futureExpiry })
      );

      expect(hasValidItem('test-key')).toBe(true);
    });

    it('should return false for expired items', () => {
      const pastExpiry = Date.now() - 1000;
      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: 'test', expiry: pastExpiry })
      );

      expect(hasValidItem('test-key')).toBe(false);
    });

    it('should return false for non-existent items', () => {
      mockGetItem.mockReturnValueOnce(null);
      expect(hasValidItem('non-existent')).toBe(false);
    });
  });

  describe('getRemainingTTL', () => {
    it('should return remaining time for valid items', () => {
      const remainingMs = 30000;
      const futureExpiry = Date.now() + remainingMs;

      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: 'test', expiry: futureExpiry })
      );

      const result = getRemainingTTL('test-key');
      expect(result).toBe(remainingMs);
    });

    it('should return null and remove expired items', () => {
      const pastExpiry = Date.now() - 1000;
      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: 'test', expiry: pastExpiry })
      );

      const result = getRemainingTTL('test-key');
      expect(result).toBeNull();
      expect(mockRemoveItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent items', () => {
      mockGetItem.mockReturnValueOnce(null);
      expect(getRemainingTTL('non-existent')).toBeNull();
    });
  });

  describe('extendTTL', () => {
    it('should extend TTL for valid items', () => {
      const originalExpiry = Date.now() + 30000;
      const additionalTtl = 60000;

      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: 'test', expiry: originalExpiry })
      );

      const result = extendTTL('test-key', additionalTtl);
      expect(result).toBe(true);

      const setItemCall = mockSetItem.mock.calls[0];
      const storedValue = JSON.parse(setItemCall[1]);
      expect(storedValue.expiry).toBe(originalExpiry + additionalTtl);
    });

    it('should return false for expired items', () => {
      const pastExpiry = Date.now() - 1000;
      mockGetItem.mockReturnValueOnce(
        JSON.stringify({ value: 'test', expiry: pastExpiry })
      );

      const result = extendTTL('test-key', 60000);
      expect(result).toBe(false);
      expect(mockRemoveItem).toHaveBeenCalledWith('test-key');
    });

    it('should return false for non-existent items', () => {
      mockGetItem.mockReturnValueOnce(null);
      expect(extendTTL('non-existent', 60000)).toBe(false);
    });
  });

  describe('Key Generators', () => {
    describe('getNotificationDismissalKey', () => {
      it('should generate correct key format', () => {
        const result = getNotificationDismissalKey(
          'tenant-123',
          'trial-warning'
        );
        expect(result).toBe('notification-dismissed-trial-warning-tenant-123');
      });

      it('should handle various tenant IDs and notification types', () => {
        expect(getNotificationDismissalKey('abc', 'expiring')).toBe(
          'notification-dismissed-expiring-abc'
        );
        expect(getNotificationDismissalKey('xyz-789', 'low-usage')).toBe(
          'notification-dismissed-low-usage-xyz-789'
        );
      });
    });

    describe('getWelcomeBannerKey', () => {
      it('should generate correct key format', () => {
        const result = getWelcomeBannerKey('tenant-456');
        expect(result).toBe('welcome-banner-shown-tenant-456');
      });
    });

    describe('getLocationSelectionKey', () => {
      it('should generate correct key format', () => {
        const result = getLocationSelectionKey('tenant-789');
        expect(result).toBe('current-location-tenant-789');
      });
    });
  });
});
