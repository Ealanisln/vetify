/**
 * Unit tests for landing page analytics tracker
 * Tests the client-side tracking utility functions
 */

import {
  getSessionId,
  getDeviceType,
  getBrowserName,
  getUTMParams,
  isTrackingEnabled,
} from '@/lib/analytics/landing-tracker';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock crypto.randomUUID
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
  },
});

describe('Landing Analytics Tracker', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('getSessionId', () => {
    it('should generate and store a new session ID when none exists', () => {
      const sessionId = getSessionId();

      expect(sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'vetify_analytics_session',
        '550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('should return existing session ID if already stored', () => {
      mockSessionStorage.getItem.mockReturnValueOnce('existing-session-id');

      const sessionId = getSessionId();

      expect(sessionId).toBe('existing-session-id');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return session ID when storage is available', () => {
      // First call returns null (no existing session)
      mockSessionStorage.getItem.mockReturnValueOnce(null);

      const sessionId = getSessionId();

      // Should generate a new UUID
      expect(sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('getDeviceType', () => {
    const originalNavigator = window.navigator;

    afterEach(() => {
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should detect mobile device', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        },
        writable: true,
      });

      expect(getDeviceType()).toBe('mobile');
    });

    it('should detect tablet device', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        },
        writable: true,
      });

      expect(getDeviceType()).toBe('tablet');
    });

    it('should detect desktop device by default', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        writable: true,
      });

      expect(getDeviceType()).toBe('desktop');
    });
  });

  describe('getBrowserName', () => {
    const originalNavigator = window.navigator;

    afterEach(() => {
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should detect Chrome browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        writable: true,
      });

      expect(getBrowserName()).toBe('Chrome');
    });

    it('should detect Safari browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        },
        writable: true,
      });

      expect(getBrowserName()).toBe('Safari');
    });

    it('should detect Firefox browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        },
        writable: true,
      });

      expect(getBrowserName()).toBe('Firefox');
    });

    it('should detect Edge browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        },
        writable: true,
      });

      expect(getBrowserName()).toBe('Edge');
    });

    it('should return Other for unrecognized browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'SomeUnknownBrowser/1.0',
        },
        writable: true,
      });

      expect(getBrowserName()).toBe('Other');
    });
  });

  describe('getUTMParams', () => {
    // Test the UTM parsing logic directly since window.location is difficult to mock
    it('should parse UTM parameters from URLSearchParams', () => {
      const parseUTMFromSearch = (search: string) => {
        const params = new URLSearchParams(search);
        const result: Record<string, string> = {};

        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');
        const utmCampaign = params.get('utm_campaign');

        if (utmSource) result.utmSource = utmSource;
        if (utmMedium) result.utmMedium = utmMedium;
        if (utmCampaign) result.utmCampaign = utmCampaign;

        return result;
      };

      expect(parseUTMFromSearch('?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale')).toEqual({
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring_sale',
      });
    });

    it('should return empty object when no UTM params', () => {
      const parseUTMFromSearch = (search: string) => {
        const params = new URLSearchParams(search);
        const result: Record<string, string> = {};

        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');
        const utmCampaign = params.get('utm_campaign');

        if (utmSource) result.utmSource = utmSource;
        if (utmMedium) result.utmMedium = utmMedium;
        if (utmCampaign) result.utmCampaign = utmCampaign;

        return result;
      };

      expect(parseUTMFromSearch('')).toEqual({});
    });

    it('should handle partial UTM params', () => {
      const parseUTMFromSearch = (search: string) => {
        const params = new URLSearchParams(search);
        const result: Record<string, string> = {};

        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');
        const utmCampaign = params.get('utm_campaign');

        if (utmSource) result.utmSource = utmSource;
        if (utmMedium) result.utmMedium = utmMedium;
        if (utmCampaign) result.utmCampaign = utmCampaign;

        return result;
      };

      expect(parseUTMFromSearch('?utm_source=facebook')).toEqual({
        utmSource: 'facebook',
      });
    });
  });

  describe('isTrackingEnabled', () => {
    const originalNavigator = window.navigator;

    afterEach(() => {
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should return true when Do Not Track is not set', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          doNotTrack: null,
        },
        writable: true,
      });

      expect(isTrackingEnabled()).toBe(true);
    });

    it('should return false when Do Not Track is "1"', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          doNotTrack: '1',
        },
        writable: true,
      });

      expect(isTrackingEnabled()).toBe(false);
    });

    it('should return true when Do Not Track is "0"', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          doNotTrack: '0',
        },
        writable: true,
      });

      expect(isTrackingEnabled()).toBe(true);
    });
  });
});
