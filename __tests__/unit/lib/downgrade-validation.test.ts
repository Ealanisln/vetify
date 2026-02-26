import {
  validateDowngrade,
  getDowngradeResolutionSteps,
  isPlanDowngrade,
  type DowngradeValidation,
} from '@/lib/downgrade-validation';

// Mock plan-limits module
jest.mock('@/lib/plan-limits', () => ({
  getPlanUsageStats: jest.fn(),
}));

import { getPlanUsageStats } from '@/lib/plan-limits';

const mockGetPlanUsageStats = getPlanUsageStats as jest.MockedFunction<typeof getPlanUsageStats>;

describe('downgrade-validation', () => {
  describe('validateDowngrade', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should allow downgrade when usage is within target plan limits', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 100,
        currentUsers: 2,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 1 * 1024 * 1024 * 1024, // 1 GB
      });

      const result = await validateDowngrade('tenant-1', 'BASICO');

      expect(result.canDowngrade).toBe(true);
      expect(result.blockers).toHaveLength(0);
      expect(result.targetPlan.key).toBe('BASICO');
      expect(result.targetPlan.name).toBe('Plan Básico');
    });

    it('should block downgrade when pets exceed target limit', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 700,
        currentUsers: 2,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 0,
      });

      const result = await validateDowngrade('tenant-1', 'BASICO');

      expect(result.canDowngrade).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);

      const petBlocker = result.blockers.find(b => b.resource === 'pets');
      expect(petBlocker).toBeDefined();
      expect(petBlocker!.current).toBe(700);
      expect(petBlocker!.newLimit).toBe(500);
      expect(petBlocker!.excess).toBe(200);
    });

    it('should block downgrade when users exceed target limit', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 100,
        currentUsers: 5,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 0,
      });

      const result = await validateDowngrade('tenant-1', 'BASICO');

      expect(result.canDowngrade).toBe(false);
      const userBlocker = result.blockers.find(b => b.resource === 'users');
      expect(userBlocker).toBeDefined();
      expect(userBlocker!.current).toBe(5);
      expect(userBlocker!.newLimit).toBe(3);
      expect(userBlocker!.excess).toBe(2);
    });

    it('should block downgrade when storage exceeds target limit', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 100,
        currentUsers: 2,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 10 * 1024 * 1024 * 1024, // 10 GB > 5 GB BASICO limit
      });

      const result = await validateDowngrade('tenant-1', 'BASICO');

      expect(result.canDowngrade).toBe(false);
      const storageBlocker = result.blockers.find(b => b.resource === 'storage');
      expect(storageBlocker).toBeDefined();
      expect(storageBlocker!.newLimit).toBe(5);
    });

    it('should return multiple blockers when multiple limits exceeded', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 700,
        currentUsers: 5,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 10 * 1024 * 1024 * 1024,
      });

      const result = await validateDowngrade('tenant-1', 'BASICO');

      expect(result.canDowngrade).toBe(false);
      expect(result.blockers.length).toBe(3); // pets, users, storage
    });

    it('should include feature loss warnings', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 100,
        currentUsers: 2,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 0,
      });

      const result = await validateDowngrade('tenant-1', 'PROFESIONAL');

      // PROFESIONAL plan gets warnings about losing multi-location, advanced reports, API
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.every(w => w.type === 'feature_loss')).toBe(true);
    });

    it('should throw for invalid target plan key', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 0,
        currentUsers: 1,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 0,
      });

      await expect(
        validateDowngrade('tenant-1', 'INVALID_PLAN')
      ).rejects.toThrow('Plan objetivo "INVALID_PLAN" no encontrado');
    });

    it('should handle case-insensitive plan keys', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 100,
        currentUsers: 2,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 0,
      });

      const result = await validateDowngrade('tenant-1', 'basico');

      expect(result.canDowngrade).toBe(true);
      expect(result.targetPlan.key).toBe('BASICO');
    });

    it('should not block pets for CORPORATIVO (unlimited)', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 10000,
        currentUsers: 15,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 0,
      });

      const result = await validateDowngrade('tenant-1', 'CORPORATIVO');

      const petBlocker = result.blockers.find(b => b.resource === 'pets');
      expect(petBlocker).toBeUndefined();
    });

    it('should include current usage stats in result', async () => {
      const mockUsage = {
        currentPets: 250,
        currentUsers: 3,
        currentMonthlyWhatsApp: 50,
        currentStorageBytes: 2 * 1024 * 1024 * 1024,
      };
      mockGetPlanUsageStats.mockResolvedValue(mockUsage);

      const result = await validateDowngrade('tenant-1', 'BASICO');

      expect(result.currentUsage).toEqual(mockUsage);
    });

    it('should include blocker suggestions', async () => {
      mockGetPlanUsageStats.mockResolvedValue({
        currentPets: 700,
        currentUsers: 2,
        currentMonthlyWhatsApp: 0,
        currentStorageBytes: 0,
      });

      const result = await validateDowngrade('tenant-1', 'BASICO');

      const petBlocker = result.blockers.find(b => b.resource === 'pets');
      expect(petBlocker!.suggestion).toContain('200');
    });
  });

  describe('getDowngradeResolutionSteps', () => {
    it('should return empty array when no blockers', () => {
      const validation: DowngradeValidation = {
        canDowngrade: true,
        warnings: [],
        blockers: [],
        targetPlan: { key: 'BASICO', name: 'Plan Básico', limits: {} as DowngradeValidation['targetPlan']['limits'] },
        currentUsage: { currentPets: 0, currentUsers: 0, currentMonthlyWhatsApp: 0, currentStorageBytes: 0 },
      };

      const steps = getDowngradeResolutionSteps(validation);
      expect(steps).toHaveLength(0);
    });

    it('should return suggestions from blockers', () => {
      const validation: DowngradeValidation = {
        canDowngrade: false,
        warnings: [],
        blockers: [
          {
            type: 'limit_exceeded',
            resource: 'pets',
            current: 700,
            newLimit: 500,
            excess: 200,
            message: 'Too many pets',
            suggestion: 'Remove 200 pets',
          },
          {
            type: 'limit_exceeded',
            resource: 'users',
            current: 5,
            newLimit: 3,
            excess: 2,
            message: 'Too many users',
            suggestion: 'Remove 2 users',
          },
        ],
        targetPlan: { key: 'BASICO', name: 'Plan Básico', limits: {} as DowngradeValidation['targetPlan']['limits'] },
        currentUsage: { currentPets: 700, currentUsers: 5, currentMonthlyWhatsApp: 0, currentStorageBytes: 0 },
      };

      const steps = getDowngradeResolutionSteps(validation);
      expect(steps).toContain('Remove 200 pets');
      expect(steps).toContain('Remove 2 users');
      // Should include final "proceed" step
      expect(steps[steps.length - 1]).toContain('podrás proceder');
    });

    it('should skip blockers without suggestions', () => {
      const validation: DowngradeValidation = {
        canDowngrade: false,
        warnings: [],
        blockers: [
          {
            type: 'limit_exceeded',
            resource: 'pets',
            current: 700,
            newLimit: 500,
            excess: 200,
            message: 'Too many pets',
            // no suggestion
          },
        ],
        targetPlan: { key: 'BASICO', name: 'Plan Básico', limits: {} as DowngradeValidation['targetPlan']['limits'] },
        currentUsage: { currentPets: 700, currentUsers: 1, currentMonthlyWhatsApp: 0, currentStorageBytes: 0 },
      };

      const steps = getDowngradeResolutionSteps(validation);
      // No suggestions means no steps (no final message either since steps is empty)
      expect(steps).toHaveLength(0);
    });
  });

  describe('isPlanDowngrade', () => {
    it('should detect downgrade from EMPRESA to CLINICA', () => {
      expect(isPlanDowngrade('EMPRESA', 'CLINICA')).toBe(true);
    });

    it('should detect downgrade from EMPRESA to PROFESIONAL', () => {
      expect(isPlanDowngrade('EMPRESA', 'PROFESIONAL')).toBe(true);
    });

    it('should detect downgrade from CLINICA to PROFESIONAL', () => {
      expect(isPlanDowngrade('CLINICA', 'PROFESIONAL')).toBe(true);
    });

    it('should not detect upgrade as downgrade', () => {
      expect(isPlanDowngrade('PROFESIONAL', 'CLINICA')).toBe(false);
      expect(isPlanDowngrade('PROFESIONAL', 'EMPRESA')).toBe(false);
    });

    it('should not detect same plan as downgrade', () => {
      expect(isPlanDowngrade('PROFESIONAL', 'PROFESIONAL')).toBe(false);
      expect(isPlanDowngrade('CLINICA', 'CLINICA')).toBe(false);
    });

    it('should handle case-insensitive plan keys', () => {
      expect(isPlanDowngrade('empresa', 'profesional')).toBe(true);
    });

    it('should return false when current plan is unknown', () => {
      // indexOf('UNKNOWN') = -1, indexOf('PROFESIONAL') = 0, so -1 > 0 is false
      expect(isPlanDowngrade('UNKNOWN', 'PROFESIONAL')).toBe(false);
    });

    it('should return true when target plan is unknown (indexOf -1)', () => {
      // indexOf('PROFESIONAL') = 0, indexOf('UNKNOWN') = -1, so 0 > -1 is true
      // This is the actual behavior - unknown targets appear as lowest tier
      expect(isPlanDowngrade('PROFESIONAL', 'UNKNOWN')).toBe(true);
    });
  });
});
