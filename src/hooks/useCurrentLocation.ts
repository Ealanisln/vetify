'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  isActive: boolean;
  isPrimary: boolean;
}

/**
 * Hook to manage the current selected location for the user session
 * Persists selection in localStorage and provides helpers to switch locations
 */
export function useCurrentLocation() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch available locations
  const fetchLocations = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const response = await fetch('/api/locations', {
        signal: abortControllerRef.current.signal,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      // API returns { success: true, data: locations }
      const locations = data.data || data.locations || [];
      setAvailableLocations(locations);
      setError(null);

      // If no current location is set, set it to the primary or first location
      if (!currentLocation && locations.length > 0) {
        const storedLocationId = localStorage.getItem('currentLocationId');
        let locationToSet: Location | undefined;

        // Try to use stored location ID, but validate it exists and is active
        if (storedLocationId) {
          locationToSet = locations.find(
            (loc: Location) => loc.id === storedLocationId && loc.isActive
          );

          // If stored location is invalid (not found or inactive), clear it
          if (!locationToSet) {
            localStorage.removeItem('currentLocationId');
          }
        }

        // Fallback to primary location
        if (!locationToSet) {
          locationToSet = locations.find((loc: Location) => loc.isPrimary && loc.isActive);
        }

        // Fallback to first active location
        if (!locationToSet) {
          locationToSet = locations.find((loc: Location) => loc.isActive);
        }

        // Fallback to first location (even if inactive, as last resort)
        if (!locationToSet && locations.length > 0) {
          locationToSet = locations[0];
        }

        if (locationToSet) {
          setCurrentLocation(locationToSet);
          // Update localStorage with validated location
          localStorage.setItem('currentLocationId', locationToSet.id);
        }
      }
    } catch (err) {
      // Ignore abort errors (expected when component unmounts or request is cancelled)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching locations:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation]);

  // Initial load
  useEffect(() => {
    fetchLocations();

    // Cleanup: abort any pending request when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLocations]);

  // Switch to a different location
  const switchLocation = useCallback((locationId: string) => {
    const location = availableLocations.find((loc) => loc.id === locationId);
    if (location) {
      setCurrentLocation(location);
      localStorage.setItem('currentLocationId', location.id);
      // Optionally trigger a page reload or update other contexts
      // window.location.reload(); // Uncomment if needed
    }
  }, [availableLocations]);

  // Switch to "All Locations" view (for admins)
  const switchToAllLocations = useCallback(() => {
    setCurrentLocation(null);
    localStorage.removeItem('currentLocationId');
  }, []);

  // Refresh locations list
  const refreshLocations = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  // Check if user has multiple locations
  const hasMultipleLocations = availableLocations.length > 1;

  // Get primary location
  const primaryLocation = availableLocations.find((loc) => loc.isPrimary);

  return {
    currentLocation,
    availableLocations,
    isLoading,
    error,
    hasMultipleLocations,
    primaryLocation,
    switchLocation,
    switchToAllLocations,
    refreshLocations,
  };
}
