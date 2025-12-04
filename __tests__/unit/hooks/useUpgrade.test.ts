/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUpgrade, UpgradeInfo, UpgradeResponse } from '@/hooks/useUpgrade';

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: jest.fn(),
  }),
}));

// Mock sonner
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastLoading = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
    loading: (msg: string) => mockToastLoading(msg),
  },
}));

// Helper to create mock upgrade info
const createMockUpgradeInfo = (overrides: Partial<UpgradeInfo> = {}): UpgradeInfo => ({
  currentPlan: {
    key: 'PROFESIONAL',
    tier: 1,
    isTrialPeriod: false,
    subscriptionStatus: 'ACTIVE',
  },
  availableUpgrades: [
    {
      planKey: 'CLINICA',
      name: 'Clinica',
      tier: 2,
      limits: { pets: 500, users: 5 },
      pricing: { monthly: 599, annual: 5990 },
    },
    {
      planKey: 'EMPRESA',
      name: 'Empresa',
      tier: 3,
      limits: { pets: 1000, users: 10 },
      pricing: { monthly: 999, annual: 9990 },
    },
  ],
  canUpgrade: true,
  ...overrides,
});

// Helper to create mock upgrade response
const createMockUpgradeResponse = (overrides: Partial<UpgradeResponse> = {}): UpgradeResponse => ({
  success: true,
  type: 'subscription_upgrade',
  message: 'Plan actualizado exitosamente',
  subscription: {
    id: 'sub_123',
    status: 'active',
    currentPeriodEnd: new Date('2025-12-31'),
    plan: 'CLINICA',
    billingInterval: 'monthly',
  },
  ...overrides,
});

describe('useUpgrade', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useUpgrade());

      expect(result.current.isUpgrading).toBe(false);
      expect(result.current.upgradeInfo).toBeNull();
      expect(result.current.isLoadingInfo).toBe(false);
    });

    it('should provide all expected methods', () => {
      const { result } = renderHook(() => useUpgrade());

      expect(typeof result.current.upgrade).toBe('function');
      expect(typeof result.current.upgradeFromTrial).toBe('function');
      expect(typeof result.current.fetchUpgradeInfo).toBe('function');
      expect(typeof result.current.calculateAnnualSavings).toBe('function');
      expect(typeof result.current.calculateSavingsPercentage).toBe('function');
      expect(typeof result.current.formatPrice).toBe('function');
    });
  });

  describe('fetchUpgradeInfo()', () => {
    it('should fetch from GET /api/subscription/upgrade', async () => {
      const mockInfo = createMockUpgradeInfo();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.fetchUpgradeInfo();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/subscription/upgrade', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should return upgrade info on success', async () => {
      const mockInfo = createMockUpgradeInfo();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const { result } = renderHook(() => useUpgrade());

      let fetchResult: UpgradeInfo | null = null;
      await act(async () => {
        fetchResult = await result.current.fetchUpgradeInfo();
      });

      expect(fetchResult).toEqual(mockInfo);
      expect(result.current.upgradeInfo).toEqual(mockInfo);
    });

    it('should set loading state correctly', async () => {
      const mockInfo = createMockUpgradeInfo();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const { result } = renderHook(() => useUpgrade());

      act(() => {
        result.current.fetchUpgradeInfo();
      });

      expect(result.current.isLoadingInfo).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingInfo).toBe(false);
      });
    });

    it('should show toast on API error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Error fetching upgrade options' }),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.fetchUpgradeInfo();
      });

      expect(mockToastError).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return null on error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Error' }),
      });

      const { result } = renderHook(() => useUpgrade());

      let fetchResult: UpgradeInfo | null;
      await act(async () => {
        fetchResult = await result.current.fetchUpgradeInfo();
      });

      expect(fetchResult!).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.fetchUpgradeInfo();
      });

      expect(mockToastError).toHaveBeenCalled();
      expect(result.current.upgradeInfo).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('upgrade() - Trial Conversion', () => {
    it('should send correct POST body with fromTrial: true', async () => {
      const mockResponse = createMockUpgradeResponse({
        type: 'trial_conversion',
        checkoutUrl: 'https://checkout.stripe.com/c/pay_123',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
          fromTrial: true,
        });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
          fromTrial: true,
        }),
      });
    });

    it('should return checkout URL on trial conversion for redirect', async () => {
      const checkoutUrl = 'https://checkout.stripe.com/c/pay_123';
      const mockResponse = createMockUpgradeResponse({
        type: 'trial_conversion',
        checkoutUrl,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());
      let response: typeof mockResponse | null = null;

      await act(async () => {
        response = await result.current.upgrade({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
          fromTrial: true,
        });
      });

      // Verifies the response contains checkout URL for redirect
      expect(response?.checkoutUrl).toBe(checkoutUrl);
      expect(response?.type).toBe('trial_conversion');
      // Loading toast indicates redirect code path was executed
      expect(mockToastLoading).toHaveBeenCalledWith('Redirigiendo al checkout...');
    });

    it('should show loading toast during redirect', async () => {
      const mockResponse = createMockUpgradeResponse({
        type: 'trial_conversion',
        checkoutUrl: 'https://checkout.stripe.com/c/pay_123',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
          fromTrial: true,
        });
      });

      expect(mockToastLoading).toHaveBeenCalledWith('Redirigiendo al checkout...');
    });
  });

  describe('upgrade() - Subscription Upgrade', () => {
    it('should send correct POST body for upgrade', async () => {
      const mockResponse = createMockUpgradeResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'annual',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlan: 'CLINICA',
          billingInterval: 'annual',
          fromTrial: false,
        }),
      });
    });

    it('should call router.refresh() on success', async () => {
      const mockResponse = createMockUpgradeResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should show success toast on upgrade', async () => {
      const mockResponse = createMockUpgradeResponse({
        message: 'Plan actualizado a Clinica',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Plan actualizado a Clinica');
    });

    it('should return upgrade response', async () => {
      const mockResponse = createMockUpgradeResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      let upgradeResult: UpgradeResponse | null = null;
      await act(async () => {
        upgradeResult = await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(upgradeResult).toEqual(mockResponse);
    });
  });

  describe('upgrade() - Error Handling', () => {
    it('should show error toast on API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Plan upgrade failed' }),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(mockToastError).toHaveBeenCalledWith('Plan upgrade failed');
      consoleSpy.mockRestore();
    });

    it('should return null on error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Error' }),
      });

      const { result } = renderHook(() => useUpgrade());

      let upgradeResult: UpgradeResponse | null = null;
      await act(async () => {
        upgradeResult = await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(upgradeResult).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(mockToastError).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should reset isUpgrading state after error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(result.current.isUpgrading).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('upgradeFromTrial() Helper', () => {
    it('should call upgrade with correct parameters', async () => {
      const mockResponse = createMockUpgradeResponse({
        type: 'trial_conversion',
        checkoutUrl: 'https://checkout.stripe.com/c/pay_123',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgradeFromTrial('PROFESIONAL');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/subscription/upgrade', expect.objectContaining({
        body: JSON.stringify({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
          fromTrial: true,
        }),
      }));
    });

    it('should default to monthly billing', async () => {
      const mockResponse = createMockUpgradeResponse({
        type: 'trial_conversion',
        checkoutUrl: 'https://checkout.stripe.com/c/pay_123',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgradeFromTrial('CLINICA');
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.billingInterval).toBe('monthly');
    });

    it('should pass through billing interval option', async () => {
      const mockResponse = createMockUpgradeResponse({
        type: 'trial_conversion',
        checkoutUrl: 'https://checkout.stripe.com/c/pay_123',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgradeFromTrial('EMPRESA', 'annual');
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.billingInterval).toBe('annual');
    });
  });

  describe('Pricing Utilities', () => {
    it('should calculate annual savings correctly', () => {
      const { result } = renderHook(() => useUpgrade());

      // Monthly 599 * 12 = 7188, Annual 5990, Savings = 1198
      const savings = result.current.calculateAnnualSavings(599, 5990);
      expect(savings).toBe(1198);
    });

    it('should calculate savings percentage correctly', () => {
      const { result } = renderHook(() => useUpgrade());

      // Monthly 599 * 12 = 7188, Annual 5990, Savings = 1198
      // Percentage = 1198 / 7188 * 100 = ~16.67%
      const percentage = result.current.calculateSavingsPercentage(599, 5990);
      expect(percentage).toBe(17); // Rounded
    });

    it('should format price in MXN currency', () => {
      const { result } = renderHook(() => useUpgrade());

      const formatted = result.current.formatPrice(599);
      expect(formatted).toContain('599');
      // Should include currency symbol (MX$ or $)
    });

    it('should format price with custom currency', () => {
      const { result } = renderHook(() => useUpgrade());

      const formatted = result.current.formatPrice(100, 'USD');
      expect(formatted).toContain('100');
    });

    it('should handle zero in annual savings calculation', () => {
      const { result } = renderHook(() => useUpgrade());

      // Same price for monthly and annual
      const savings = result.current.calculateAnnualSavings(100, 1200);
      expect(savings).toBe(0);
    });

    it('should handle negative savings (annual more expensive)', () => {
      const { result } = renderHook(() => useUpgrade());

      // Annual more expensive than monthly*12
      const savings = result.current.calculateAnnualSavings(100, 1500);
      expect(savings).toBe(-300);
    });
  });

  describe('State Management', () => {
    it('should set isUpgrading true during upgrade', async () => {
      const mockResponse = createMockUpgradeResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      act(() => {
        result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(result.current.isUpgrading).toBe(true);

      await waitFor(() => {
        expect(result.current.isUpgrading).toBe(false);
      });
    });

    it('should set isLoadingInfo true during fetch', async () => {
      const mockInfo = createMockUpgradeInfo();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const { result } = renderHook(() => useUpgrade());

      act(() => {
        result.current.fetchUpgradeInfo();
      });

      expect(result.current.isLoadingInfo).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingInfo).toBe(false);
      });
    });

    it('should reset states after completion', async () => {
      const mockResponse = createMockUpgradeResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(result.current.isUpgrading).toBe(false);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected state properties', () => {
      const { result } = renderHook(() => useUpgrade());

      expect(result.current).toHaveProperty('isUpgrading');
      expect(result.current).toHaveProperty('upgradeInfo');
      expect(result.current).toHaveProperty('isLoadingInfo');
    });

    it('should return all expected action methods', () => {
      const { result } = renderHook(() => useUpgrade());

      expect(result.current).toHaveProperty('upgrade');
      expect(result.current).toHaveProperty('upgradeFromTrial');
      expect(result.current).toHaveProperty('fetchUpgradeInfo');
    });

    it('should return all expected utility methods', () => {
      const { result } = renderHook(() => useUpgrade());

      expect(result.current).toHaveProperty('calculateAnnualSavings');
      expect(result.current).toHaveProperty('calculateSavingsPercentage');
      expect(result.current).toHaveProperty('formatPrice');
    });
  });

  describe('Edge Cases', () => {
    it('should handle response with proration info', async () => {
      const mockResponse = createMockUpgradeResponse({
        proration: {
          amount: 150,
          currency: 'MXN',
          dueDate: new Date('2025-12-15'),
        },
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUpgrade());

      let upgradeResult: UpgradeResponse | null = null;
      await act(async () => {
        upgradeResult = await result.current.upgrade({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });
      });

      expect(upgradeResult?.proration?.amount).toBe(150);
    });

    it('should handle empty available upgrades', async () => {
      const mockInfo = createMockUpgradeInfo({
        availableUpgrades: [],
        canUpgrade: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.fetchUpgradeInfo();
      });

      expect(result.current.upgradeInfo?.availableUpgrades).toHaveLength(0);
      expect(result.current.upgradeInfo?.canUpgrade).toBe(false);
    });

    it('should handle trial period in current plan', async () => {
      const mockInfo = createMockUpgradeInfo({
        currentPlan: {
          key: null,
          tier: 0,
          isTrialPeriod: true,
          subscriptionStatus: 'TRIALING',
        },
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const { result } = renderHook(() => useUpgrade());

      await act(async () => {
        await result.current.fetchUpgradeInfo();
      });

      expect(result.current.upgradeInfo?.currentPlan.isTrialPeriod).toBe(true);
    });

    it('should format large prices correctly', () => {
      const { result } = renderHook(() => useUpgrade());

      const formatted = result.current.formatPrice(12999);
      expect(formatted).toContain('12');
      expect(formatted).toContain('999');
    });

    it('should handle zero price', () => {
      const { result } = renderHook(() => useUpgrade());

      const formatted = result.current.formatPrice(0);
      expect(formatted).toContain('0');
    });
  });
});
