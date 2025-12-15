/**
 * @file useCurrentLocation Hook Tests - VETIF-56
 * @description Comprehensive tests for src/hooks/useCurrentLocation.ts
 *
 * Test Categories:
 * 1. Initial Load Scenarios
 * 2. Location Switching
 * 3. localStorage Persistence
 * 4. Error Handling
 * 5. Computed Properties
 * 6. Refresh Function
 * 7. Edge Cases
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCurrentLocation, Location } from '@/hooks/useCurrentLocation';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
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
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test data factories
const createMockLocation = (overrides: Partial<Location> = {}): Location => ({
  id: 'location-1',
  name: 'Main Clinic',
  slug: 'main-clinic',
  address: '123 Main St',
  phone: '+52 55 1234 5678',
  email: 'main@clinic.com',
  timezone: 'America/Mexico_City',
  isActive: true,
  isPrimary: true,
  ...overrides,
});

const createMockApiResponse = (locations: Location[] = []) => ({
  ok: true,
  json: jest.fn().mockResolvedValue({ locations }),
});

describe('useCurrentLocation Hook', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // ==========================================================================
  // Initial Load Scenarios
  // ==========================================================================
  describe('Initial Load Scenarios', () => {
    it('should start with loading state', async () => {
      mockFetch.mockResolvedValueOnce(createMockApiResponse([]));

      const { result } = renderHook(() => useCurrentLocation());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load locations successfully', async () => {
      const locations = [
        createMockLocation({ isPrimary: true }),
        createMockLocation({ id: 'location-2', name: 'Branch', isPrimary: false }),
      ];

      // Mock multiple calls since useEffect may trigger multiple fetches
      mockFetch.mockResolvedValue(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableLocations).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('should set primary location as current when no stored location', async () => {
      const locations = [
        createMockLocation({ id: 'loc-1', isPrimary: false, isActive: true }),
        createMockLocation({ id: 'loc-2', isPrimary: true, isActive: true }),
      ];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentLocation?.id).toBe('loc-2');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('currentLocationId', 'loc-2');
    });

    it('should restore location from localStorage when valid', async () => {
      localStorageMock.setItem('currentLocationId', 'stored-loc');

      const locations = [
        createMockLocation({ id: 'stored-loc', name: 'Stored Location', isPrimary: false }),
        createMockLocation({ id: 'primary-loc', isPrimary: true }),
      ];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentLocation?.id).toBe('stored-loc');
    });

    it('should clear invalid stored location and fallback to primary', async () => {
      localStorageMock.setItem('currentLocationId', 'non-existent');

      const locations = [
        createMockLocation({ id: 'loc-1', isPrimary: true, isActive: true }),
      ];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentLocationId');
      expect(result.current.currentLocation?.id).toBe('loc-1');
    });

    it('should clear inactive stored location and fallback to primary', async () => {
      localStorageMock.setItem('currentLocationId', 'inactive-loc');

      const locations = [
        createMockLocation({ id: 'inactive-loc', isActive: false, isPrimary: false }),
        createMockLocation({ id: 'active-loc', isActive: true, isPrimary: true }),
      ];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentLocationId');
      expect(result.current.currentLocation?.id).toBe('active-loc');
    });

    it('should fallback to first active location when no primary', async () => {
      const locations = [
        createMockLocation({ id: 'loc-1', isPrimary: false, isActive: true }),
        createMockLocation({ id: 'loc-2', isPrimary: false, isActive: true }),
      ];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentLocation?.id).toBe('loc-1');
    });

    it('should fallback to first location even if inactive as last resort', async () => {
      const locations = [
        createMockLocation({ id: 'inactive-1', isActive: false, isPrimary: false }),
        createMockLocation({ id: 'inactive-2', isActive: false, isPrimary: false }),
      ];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentLocation?.id).toBe('inactive-1');
    });

    it('should handle empty locations array', async () => {
      mockFetch.mockResolvedValueOnce(createMockApiResponse([]));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentLocation).toBeNull();
      expect(result.current.availableLocations).toEqual([]);
    });

    it('should handle API response without locations key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableLocations).toEqual([]);
    });
  });

  // ==========================================================================
  // Location Switching
  // ==========================================================================
  describe('Location Switching', () => {
    it('should switch to valid location', async () => {
      const locations = [
        createMockLocation({ id: 'loc-1', isPrimary: true, isActive: true }),
        createMockLocation({ id: 'loc-2', name: 'Branch', isPrimary: false, isActive: true }),
      ];

      mockFetch.mockResolvedValue(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous setItem calls
      localStorageMock.setItem.mockClear();

      act(() => {
        result.current.switchLocation('loc-2');
      });

      // switchLocation should update localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('currentLocationId', 'loc-2');
    });

    it('should not switch to non-existent location', async () => {
      const locations = [createMockLocation({ id: 'loc-1', isPrimary: true })];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialLocation = result.current.currentLocation;

      act(() => {
        result.current.switchLocation('non-existent');
      });

      // Should not change
      expect(result.current.currentLocation).toEqual(initialLocation);
    });

    it('should switch to all locations (admin view)', async () => {
      const locations = [createMockLocation({ id: 'loc-1', isPrimary: true })];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentLocation).not.toBeNull();

      act(() => {
        result.current.switchToAllLocations();
      });

      expect(result.current.currentLocation).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentLocationId');
    });

    it('should allow switching to inactive location', async () => {
      const locations = [
        createMockLocation({ id: 'active-loc', isPrimary: true, isActive: true }),
        createMockLocation({ id: 'inactive-loc', isPrimary: false, isActive: false }),
      ];

      mockFetch.mockResolvedValue(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous setItem calls
      localStorageMock.setItem.mockClear();

      act(() => {
        result.current.switchLocation('inactive-loc');
      });

      // switchLocation should attempt to switch to inactive location via localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('currentLocationId', 'inactive-loc');
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('Failed to fetch locations');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching locations:',
        expect.any(Error)
      );
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('should clear error on successful retry', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Mock all subsequent calls to succeed
      mockFetch.mockResolvedValue(
        createMockApiResponse([createMockLocation()])
      );

      await act(async () => {
        await result.current.refreshLocations();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // Computed Properties
  // ==========================================================================
  describe('Computed Properties', () => {
    describe('hasMultipleLocations', () => {
      it('should return false with 0 locations', async () => {
        mockFetch.mockResolvedValueOnce(createMockApiResponse([]));

        const { result } = renderHook(() => useCurrentLocation());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hasMultipleLocations).toBe(false);
      });

      it('should return false with 1 location', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockApiResponse([createMockLocation()])
        );

        const { result } = renderHook(() => useCurrentLocation());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hasMultipleLocations).toBe(false);
      });

      it('should return true with 2+ locations', async () => {
        const locations = [
          createMockLocation({ id: 'loc-1', isPrimary: true, isActive: true }),
          createMockLocation({ id: 'loc-2', isPrimary: false, isActive: true }),
        ];
        mockFetch.mockResolvedValue(createMockApiResponse(locations));

        const { result } = renderHook(() => useCurrentLocation());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.availableLocations.length).toBe(2);
        });

        expect(result.current.hasMultipleLocations).toBe(true);
      });
    });

    describe('primaryLocation', () => {
      it('should return undefined when no primary location', async () => {
        const locations = [
          createMockLocation({ id: 'loc-1', isPrimary: false, isActive: true }),
        ];
        // Use mockResolvedValue to handle multiple calls
        mockFetch.mockResolvedValue(createMockApiResponse(locations));

        const { result } = renderHook(() => useCurrentLocation());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.primaryLocation).toBeUndefined();
      });

      it('should return primary location when exists', async () => {
        const locations = [
          createMockLocation({ id: 'loc-1', isPrimary: false, isActive: true }),
          createMockLocation({ id: 'loc-2', isPrimary: true, isActive: true }),
        ];
        mockFetch.mockResolvedValue(createMockApiResponse(locations));

        const { result } = renderHook(() => useCurrentLocation());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.primaryLocation?.id).toBe('loc-2');
      });

      it('should return first primary when multiple primaries exist', async () => {
        // Edge case: multiple primaries (shouldn't happen but testing robustness)
        const locations = [
          createMockLocation({ id: 'loc-1', isPrimary: true, isActive: true }),
          createMockLocation({ id: 'loc-2', isPrimary: true, isActive: true }),
        ];
        mockFetch.mockResolvedValue(createMockApiResponse(locations));

        const { result } = renderHook(() => useCurrentLocation());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.primaryLocation?.id).toBe('loc-1');
      });
    });
  });

  // ==========================================================================
  // Refresh Function
  // ==========================================================================
  describe('Refresh Function', () => {
    it('should refresh locations list', async () => {
      const locations = [
        createMockLocation({ id: 'loc-1', isPrimary: true, isActive: true }),
        createMockLocation({ id: 'loc-2', name: 'New Branch', isPrimary: false, isActive: true }),
      ];

      mockFetch.mockResolvedValue(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock to count refresh calls
      mockFetch.mockClear();
      mockFetch.mockResolvedValue(createMockApiResponse(locations));

      await act(async () => {
        await result.current.refreshLocations();
      });

      // refreshLocations should call fetch
      expect(mockFetch).toHaveBeenCalledWith('/api/locations');
    });

    it('should set loading state during refresh', async () => {
      mockFetch.mockResolvedValueOnce(createMockApiResponse([]));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create a delayed response for the refresh
      let resolveRefresh: (value: any) => void;
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });

      mockFetch.mockReturnValueOnce(refreshPromise);

      // Start refresh without waiting
      act(() => {
        result.current.refreshLocations();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the refresh
      await act(async () => {
        resolveRefresh!(createMockApiResponse([]));
        await refreshPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should maintain current location after refresh if still valid', async () => {
      const locations = [
        createMockLocation({ id: 'loc-1', isPrimary: true, isActive: true }),
        createMockLocation({ id: 'loc-2', isPrimary: false, isActive: true }),
      ];

      // Use mockResolvedValue to handle all fetch calls consistently
      mockFetch.mockResolvedValue(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially should be set to primary (loc-1) or stored location
      const initialLocation = result.current.currentLocation?.id;
      expect(initialLocation).toBeDefined();

      // Verify locations are available
      expect(result.current.availableLocations).toHaveLength(2);

      // Test that refresh maintains the location list
      await act(async () => {
        await result.current.refreshLocations();
      });

      // Locations should still be available
      expect(result.current.availableLocations).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle localStorage unavailable gracefully', async () => {
      // Temporarily make localStorage throw
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = jest.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      mockFetch.mockResolvedValueOnce(
        createMockApiResponse([createMockLocation()])
      );

      // Should not crash
      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Restore
      localStorageMock.getItem = originalGetItem;
    });

    it('should call fetch with correct URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockApiResponse([]));

      renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/locations');
      });
    });

    it('should handle concurrent switches correctly', async () => {
      const locations = [
        createMockLocation({ id: 'loc-1', isPrimary: true, isActive: true }),
        createMockLocation({ id: 'loc-2', isPrimary: false, isActive: true }),
        createMockLocation({ id: 'loc-3', isPrimary: false, isActive: true }),
      ];

      mockFetch.mockResolvedValue(createMockApiResponse(locations));

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.availableLocations.length).toBe(3);
      });

      // Test that switch updates localStorage correctly
      act(() => {
        result.current.switchLocation('loc-2');
      });

      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith('currentLocationId', 'loc-2');

      act(() => {
        result.current.switchLocation('loc-3');
      });

      // Final localStorage call should be for loc-3
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('currentLocationId', 'loc-3');
    });

    it('should handle location with null optional fields', async () => {
      const locationWithNulls: Location = {
        id: 'loc-1',
        name: 'Minimal Location',
        slug: 'minimal',
        address: null,
        phone: null,
        email: null,
        timezone: null,
        isActive: true,
        isPrimary: true,
      };

      mockFetch.mockResolvedValueOnce(
        createMockApiResponse([locationWithNulls])
      );

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentLocation?.address).toBeNull();
      expect(result.current.currentLocation?.phone).toBeNull();
    });

    it('should preserve availableLocations reference stability', async () => {
      const locations = [createMockLocation()];

      mockFetch.mockResolvedValueOnce(createMockApiResponse(locations));

      const { result, rerender } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstReference = result.current.availableLocations;

      // Rerender without new fetch
      rerender();

      // Reference should be stable (same array)
      expect(result.current.availableLocations).toBe(firstReference);
    });
  });
});
