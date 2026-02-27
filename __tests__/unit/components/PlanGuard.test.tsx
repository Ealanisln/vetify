import { renderHook, waitFor } from '@testing-library/react';

// Mock plan-limits to break the import chain (plan-limits -> auth -> kinde -> jose ESM)
jest.mock('@/lib/plan-limits', () => ({
  checkFeatureAccess: jest.fn(),
  getPlanLimits: jest.fn(),
  getPlanUsageStats: jest.fn(),
}));

import { usePlanGuard } from '@/components/PlanGuard';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPlanStatus = {
  limits: {
    maxPets: 50,
    maxUsers: 5,
    maxMonthlyWhatsApp: 100,
    maxStorageGB: 10,
    canUseAutomations: false,
    canUseAdvancedReports: true,
    canUseMultiDoctor: false,
    canUseSMSReminders: true,
  },
  usage: {
    currentPets: 10,
    currentUsers: 2,
    currentMonthlyWhatsApp: 30,
    currentStorageBytes: 1073741824, // 1GB
  },
  percentages: {
    pets: 20,
    users: 40,
    whatsapp: 30,
    storage: 10,
  },
  plan: {
    name: 'Plan Profesional',
    key: 'professional',
    isTrialPeriod: false,
  },
  warnings: {
    pets: false,
    users: false,
    whatsapp: false,
    storage: false,
  },
};

describe('usePlanGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(mockPlanStatus),
    });
  });

  it('should start in loading state', () => {
    const { result } = renderHook(() => usePlanGuard('tenant-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.planStatus).toBeNull();
  });

  it('should fetch plan status on mount', async () => {
    const { result } = renderHook(() => usePlanGuard('tenant-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tenant/plan-status?tenantId=tenant-1'
    );
    expect(result.current.planStatus).toEqual(mockPlanStatus);
  });

  it('should return plan name', async () => {
    const { result } = renderHook(() => usePlanGuard('tenant-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.planName).toBe('Plan Profesional');
  });

  it('should return isTrialPeriod', async () => {
    const { result } = renderHook(() => usePlanGuard('tenant-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isTrialPeriod).toBe(false);
  });

  describe('checkFeature', () => {
    it('should return true for enabled features', async () => {
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.checkFeature('advancedReports')).toBe(true);
      expect(result.current.checkFeature('smsReminders')).toBe(true);
    });

    it('should return false for disabled features', async () => {
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.checkFeature('automations')).toBe(false);
      expect(result.current.checkFeature('multiDoctor')).toBe(false);
    });

    it('should return false for unknown features', async () => {
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.checkFeature('unknownFeature')).toBe(false);
    });

    it('should return false when planStatus is null', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      expect(result.current.checkFeature('advancedReports')).toBe(false);
    });
  });

  describe('checkLimit', () => {
    it('should return correct pet limit info', async () => {
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const petLimit = result.current.checkLimit('pets');
      expect(petLimit.canAdd).toBe(true);
      expect(petLimit.current).toBe(10);
      expect(petLimit.limit).toBe(50);
      expect(petLimit.remaining).toBe(40);
      expect(petLimit.percentage).toBe(20);
    });

    it('should return correct user limit info', async () => {
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userLimit = result.current.checkLimit('users');
      expect(userLimit.canAdd).toBe(true);
      expect(userLimit.current).toBe(2);
      expect(userLimit.limit).toBe(5);
      expect(userLimit.remaining).toBe(3);
    });

    it('should return correct whatsapp limit info', async () => {
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const waLimit = result.current.checkLimit('whatsapp');
      expect(waLimit.canAdd).toBe(true);
      expect(waLimit.current).toBe(30);
      expect(waLimit.limit).toBe(100);
      expect(waLimit.remaining).toBe(70);
    });

    it('should report canAdd=false when limit reached', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            ...mockPlanStatus,
            usage: { ...mockPlanStatus.usage, currentPets: 50 },
          }),
      });

      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const petLimit = result.current.checkLimit('pets');
      expect(petLimit.canAdd).toBe(false);
      expect(petLimit.remaining).toBe(0);
    });

    it('should return defaults when planStatus is null', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      const limit = result.current.checkLimit('pets');
      expect(limit.canAdd).toBe(false);
      expect(limit.remaining).toBe(0);
      expect(limit.current).toBe(0);
      expect(limit.limit).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePlanGuard('tenant-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.planStatus).toBeNull();
      expect(result.current.planName).toBe('Plan Gratuito');
      consoleSpy.mockRestore();
    });
  });

  describe('Re-fetch on tenantId change', () => {
    it('should re-fetch when tenantId changes', async () => {
      const { result, rerender } = renderHook(
        ({ tenantId }) => usePlanGuard(tenantId),
        { initialProps: { tenantId: 'tenant-1' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenant/plan-status?tenantId=tenant-1'
      );

      rerender({ tenantId: 'tenant-2' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/tenant/plan-status?tenantId=tenant-2'
        );
      });
    });
  });
});
