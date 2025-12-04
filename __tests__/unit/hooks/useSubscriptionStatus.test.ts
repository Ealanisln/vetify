/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import type { SubscriptionStatus } from '@/app/actions/subscription';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock server action
const mockGetSubscriptionStatus = jest.fn();
jest.mock('@/app/actions/subscription', () => ({
  getSubscriptionStatus: () => mockGetSubscriptionStatus(),
}));

// Helper to create mock subscription status
const createMockStatus = (overrides: Partial<SubscriptionStatus> = {}): SubscriptionStatus => ({
  isActive: true,
  planType: 'PROFESIONAL',
  planName: 'Profesional',
  status: 'ACTIVE',
  renewalDate: new Date('2025-12-31'),
  isTrialPeriod: false,
  trialEndsAt: null,
  daysRemaining: 30,
  ...overrides,
});

describe('useSubscriptionStatus', () => {
  const originalReplaceState = window.history.replaceState;
  let mockReplaceState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
    mockReplaceState = jest.fn();
    window.history.replaceState = mockReplaceState;
  });

  afterEach(() => {
    window.history.replaceState = originalReplaceState;
  });

  describe('Initial Load', () => {
    it('should fetch status on mount', async () => {
      const mockStatus = createMockStatus();
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetSubscriptionStatus).toHaveBeenCalled();
      expect(result.current.status).toEqual(mockStatus);
    });

    it('should handle successful fetch with specific values', async () => {
      const mockStatus = createMockStatus({
        isActive: true,
        planName: 'Clinica',
        daysRemaining: 15,
      });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status?.planName).toBe('Clinica');
      expect(result.current.isActive).toBe(true);
      expect(result.current.daysRemaining).toBe(15);
    });

    it('should return null status when unauthenticated', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBeNull();
      expect(result.current.isActive).toBe(false);
    });

    it('should handle null status (no tenant)', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBeNull();
      expect(result.current.planName).toBeUndefined();
    });

    it('should be loading initially before fetch completes', () => {
      // Don't resolve the promise yet
      mockGetSubscriptionStatus.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionStatus());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Portal Return Detection', () => {
    it('should detect from_portal query param', async () => {
      mockGet.mockReturnValue('true');
      const mockStatus = createMockStatus();
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetSubscriptionStatus).toHaveBeenCalled();
    });

    it('should clean URL when from_portal param is present', async () => {
      mockGet.mockReturnValue('true');
      const mockStatus = createMockStatus();
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalled();
      });
    });

    it('should not clean URL when from_portal is absent', async () => {
      mockGet.mockReturnValue(null);
      const mockStatus = createMockStatus();
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // No replaceState should be called
      expect(mockReplaceState).not.toHaveBeenCalled();
    });
  });

  describe('refreshStatus() Method', () => {
    it('should be a callable function', async () => {
      const mockStatus = createMockStatus();
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refreshStatus).toBe('function');
    });

    it('should set loading state when refresh is called', async () => {
      const mockStatus = createMockStatus();
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start refresh but don't await
      act(() => {
        result.current.refreshStatus();
      });

      // Should be loading during refresh
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('requireActivePlan() Method', () => {
    it('should return true when subscription is active', async () => {
      const mockStatus = createMockStatus({ isActive: true });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const hasAccess = result.current.requireActivePlan();

      expect(hasAccess).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should return false and redirect when inactive', async () => {
      const mockStatus = createMockStatus({ isActive: false });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const hasAccess = result.current.requireActivePlan();

      expect(hasAccess).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/settings?tab=subscription');
    });

    it('should redirect to default settings page', async () => {
      const mockStatus = createMockStatus({ isActive: false });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.requireActivePlan();

      expect(mockPush).toHaveBeenCalledWith('/dashboard/settings?tab=subscription');
    });

    it('should support custom redirect URL', async () => {
      const mockStatus = createMockStatus({ isActive: false });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.requireActivePlan('/custom/upgrade');

      expect(mockPush).toHaveBeenCalledWith('/custom/upgrade');
    });

    it('should not redirect while still loading', () => {
      mockGetSubscriptionStatus.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionStatus());

      // While loading, should return true (don't block yet)
      const hasAccess = result.current.requireActivePlan();

      expect(hasAccess).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Derived Properties', () => {
    it('should compute isActive correctly when true', async () => {
      const mockStatus = createMockStatus({ isActive: true });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should compute isActive correctly when false', async () => {
      const mockStatus = createMockStatus({ isActive: false });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should compute isActive as false when status is null', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should compute isTrialPeriod correctly when true', async () => {
      const mockStatus = createMockStatus({ isTrialPeriod: true });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTrialPeriod).toBe(true);
    });

    it('should compute isTrialPeriod correctly when false', async () => {
      const mockStatus = createMockStatus({ isTrialPeriod: false });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTrialPeriod).toBe(false);
    });

    it('should compute isTrialPeriod as false when status is null', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTrialPeriod).toBe(false);
    });

    it('should extract planName correctly', async () => {
      const mockStatus = createMockStatus({ planName: 'Enterprise' });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.planName).toBe('Enterprise');
    });

    it('should extract daysRemaining correctly', async () => {
      const mockStatus = createMockStatus({ daysRemaining: 7 });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.daysRemaining).toBe(7);
    });

    it('should handle null daysRemaining', async () => {
      const mockStatus = createMockStatus({ daysRemaining: null });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.daysRemaining).toBeNull();
    });

    it('should handle zero daysRemaining', async () => {
      const mockStatus = createMockStatus({ daysRemaining: 0 });
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.daysRemaining).toBe(0);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', async () => {
      const mockStatus = createMockStatus();
      mockGetSubscriptionStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isActive');
      expect(result.current).toHaveProperty('isTrialPeriod');
      expect(result.current).toHaveProperty('planName');
      expect(result.current).toHaveProperty('daysRemaining');
      expect(result.current).toHaveProperty('requireActivePlan');
      expect(result.current).toHaveProperty('refreshStatus');
    });

    it('should have requireActivePlan as a function', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(createMockStatus());

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.requireActivePlan).toBe('function');
    });

    it('should have refreshStatus as a function', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(createMockStatus());

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refreshStatus).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle subscription with all fields populated', async () => {
      const fullStatus = createMockStatus({
        isActive: true,
        planType: 'EMPRESA',
        planName: 'Empresa',
        status: 'ACTIVE',
        renewalDate: new Date('2026-01-15'),
        isTrialPeriod: false,
        trialEndsAt: null,
        daysRemaining: 45,
      });
      mockGetSubscriptionStatus.mockResolvedValue(fullStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toEqual(fullStatus);
      expect(result.current.isActive).toBe(true);
      expect(result.current.planName).toBe('Empresa');
      expect(result.current.daysRemaining).toBe(45);
    });

    it('should handle trial subscription', async () => {
      const trialStatus = createMockStatus({
        isActive: true,
        isTrialPeriod: true,
        trialEndsAt: new Date('2025-12-15'),
        daysRemaining: 14,
      });
      mockGetSubscriptionStatus.mockResolvedValue(trialStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTrialPeriod).toBe(true);
      expect(result.current.isActive).toBe(true);
      expect(result.current.daysRemaining).toBe(14);
    });

    it('should handle expired subscription', async () => {
      const expiredStatus = createMockStatus({
        isActive: false,
        status: 'EXPIRED',
        daysRemaining: 0,
      });
      mockGetSubscriptionStatus.mockResolvedValue(expiredStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.daysRemaining).toBe(0);
    });

    it('should provide refreshStatus for status updates', async () => {
      const trialStatus = createMockStatus({ isActive: true, isTrialPeriod: true });
      mockGetSubscriptionStatus.mockResolvedValue(trialStatus);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTrialPeriod).toBe(true);
      expect(typeof result.current.refreshStatus).toBe('function');
    });
  });
});
