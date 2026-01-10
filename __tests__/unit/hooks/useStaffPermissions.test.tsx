/**
 * Unit tests for useStaffPermissions hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useStaffPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial loading state', () => {
    it('should start in loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useStaffPermissions());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.staff).toBeNull();
      expect(result.current.position).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should return false for canAccess while loading', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useStaffPermissions());

      expect(result.current.canAccess('dashboard', 'read')).toBe(false);
      expect(result.current.canAccess('medical', 'write')).toBe(false);
    });
  });

  describe('Successful staff fetch', () => {
    const mockStaffData = {
      id: 'staff-123',
      name: 'Dr. Test',
      position: 'VETERINARIAN',
      email: 'test@example.com',
      isActive: true,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockStaffData),
      });
    });

    it('should fetch and set staff data', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.staff).toEqual(mockStaffData);
      expect(result.current.position).toBe('VETERINARIAN');
      expect(result.current.error).toBeNull();
    });

    it('should set correct position booleans for VETERINARIAN', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isVeterinarian).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isReceptionist).toBe(false);
      expect(result.current.isAssistant).toBe(false);
      expect(result.current.isTechnician).toBe(false);
    });

    it('should return correct canAccess results for VETERINARIAN', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Veterinarian has full medical access
      expect(result.current.canAccess('medical', 'read')).toBe(true);
      expect(result.current.canAccess('medical', 'write')).toBe(true);

      // Veterinarian has read-only inventory access
      expect(result.current.canAccess('inventory', 'read')).toBe(true);
      expect(result.current.canAccess('inventory', 'write')).toBe(false);

      // Veterinarian cannot access settings
      expect(result.current.canAccess('settings', 'read')).toBe(false);
    });

    it('should provide accessible features list', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.accessibleFeatures).toContain('medical');
      expect(result.current.accessibleFeatures).toContain('appointments');
      expect(result.current.accessibleFeatures).toContain('staff'); // VETERINARIAN has read-only access
      expect(result.current.accessibleFeatures).not.toContain('settings');
    });
  });

  describe('MANAGER position', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          id: 'staff-456',
          name: 'Admin User',
          position: 'MANAGER',
          email: 'admin@example.com',
          isActive: true,
        }),
      });
    });

    it('should set isAdmin to true', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isVeterinarian).toBe(false);
    });

    it('should have access to all features', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canAccess('settings', 'write')).toBe(true);
      expect(result.current.canAccess('staff', 'write')).toBe(true);
      expect(result.current.canAccess('medical', 'delete')).toBe(true);
    });
  });

  describe('No staff record (tenant owner)', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'No staff record found' }),
      });
    });

    it('should default to MANAGER position for tenant owners', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.staff).toBeNull();
      expect(result.current.position).toBe('MANAGER');
      expect(result.current.isAdmin).toBe(true);
    });

    it('should have full access as tenant owner', async () => {
      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canAccess('settings', 'write')).toBe(true);
      expect(result.current.canAccess('staff', 'write')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should set error on network failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error al obtener información del staff');
      expect(result.current.staff).toBeNull();
    });

    it('should handle fetch exception', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.staff).toBeNull();
    });
  });

  describe('Refresh functionality', () => {
    it('should refresh staff data when refresh is called', async () => {
      const mockStaffData = {
        id: 'staff-123',
        name: 'Dr. Test',
        position: 'VETERINARIAN',
        email: 'test@example.com',
        isActive: true,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockStaffData),
      });

      const { result } = renderHook(() => useStaffPermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Update mock for second call
      const updatedStaffData = { ...mockStaffData, position: 'MANAGER' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updatedStaffData),
      });

      // Call refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.position).toBe('MANAGER');
    });
  });

  describe('Position-specific booleans', () => {
    const testCases = [
      { position: 'RECEPTIONIST', expected: { isReceptionist: true, isVeterinarian: false, isAdmin: false } },
      { position: 'ASSISTANT', expected: { isAssistant: true, isVeterinarian: false, isAdmin: false } },
      { position: 'VETERINARY_TECHNICIAN', expected: { isTechnician: true, isVeterinarian: false, isAdmin: false } },
    ];

    testCases.forEach(({ position, expected }) => {
      it(`should set correct booleans for ${position}`, async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'staff-test',
            name: 'Test User',
            position,
            email: 'test@example.com',
            isActive: true,
          }),
        });

        const { result } = renderHook(() => useStaffPermissions());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        Object.entries(expected).forEach(([key, value]) => {
          expect(result.current[key as keyof typeof result.current]).toBe(value);
        });
      });
    });
  });
});
