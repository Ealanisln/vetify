'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCurrentLocation, Location } from '@/hooks/useCurrentLocation';

interface LocationContextType {
  currentLocation: Location | null;
  availableLocations: Location[];
  isLoading: boolean;
  error: Error | null;
  hasMultipleLocations: boolean;
  primaryLocation: Location | undefined;
  switchLocation: (locationId: string) => void;
  switchToAllLocations: () => void;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

/**
 * LocationProvider - Provides location context throughout the application
 *
 * This provider wraps the dashboard and manages the current selected location,
 * location switching, and provides access to available locations.
 *
 * @example
 * ```tsx
 * <LocationProvider>
 *   <DashboardContent />
 * </LocationProvider>
 * ```
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const locationState = useCurrentLocation();

  return (
    <LocationContext.Provider value={locationState}>
      {children}
    </LocationContext.Provider>
  );
}

/**
 * useLocation - Hook to access location context
 *
 * @throws Error if used outside LocationProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentLocation, switchLocation } = useLocation();
 *
 *   return (
 *     <div>
 *       <p>Current: {currentLocation?.name}</p>
 *       <button onClick={() => switchLocation(newId)}>Switch</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);

  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }

  return context;
}

/**
 * LocationAware - Higher-order component to ensure location context is available
 *
 * @example
 * ```tsx
 * const MyFeature = LocationAware(({ currentLocation }) => {
 *   return <div>Location: {currentLocation?.name}</div>;
 * });
 * ```
 */
export function LocationAware<P extends object>(
  Component: React.ComponentType<P & { currentLocation: Location | null }>
) {
  return function WrappedComponent(props: P) {
    const { currentLocation } = useLocation();
    return <Component {...props} currentLocation={currentLocation} />;
  };
}
