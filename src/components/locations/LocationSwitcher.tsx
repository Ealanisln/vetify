'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { MapPinIcon, ChevronUpDownIcon, CheckIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useLocation } from '@/components/providers/LocationProvider';
import { cn } from '@/lib/utils';

/**
 * LocationSwitcher - Dropdown component for switching between locations
 *
 * Displays the current location and allows users to switch between
 * their assigned locations. Integrates with LocationProvider context.
 *
 * Features:
 * - Current location display with icon
 * - Dropdown menu with all available locations
 * - Visual indicator for current selection
 * - Loading and error states
 * - Responsive design
 *
 * @example
 * ```tsx
 * <LocationSwitcher />
 * ```
 */
export function LocationSwitcher() {
  const {
    currentLocation,
    availableLocations,
    isLoading,
    hasMultipleLocations,
    isAllLocations,
    switchLocation,
    switchToAllLocations,
  } = useLocation();

  // Don't show switcher if only one location or still loading
  if (isLoading || !hasMultipleLocations) {
    return null;
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors">
        {isAllLocations ? (
          <BuildingOffice2Icon className="h-5 w-5 shrink-0 text-[#75a99c]" aria-hidden="true" />
        ) : (
          <MapPinIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        )}
        <span className="flex-1 truncate text-left">
          {isAllLocations ? 'Todas las ubicaciones' : (currentLocation?.name || 'Seleccionar ubicación')}
        </span>
        <ChevronUpDownIcon
          className="h-5 w-5 shrink-0 text-gray-400"
          aria-hidden="true"
        />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 right-0 z-10 mt-2 origin-top-left rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/* All Locations Option */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={switchToAllLocations}
                  className={cn(
                    'flex w-full items-center gap-x-3 px-4 py-2 text-sm',
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-200'
                  )}
                >
                  <BuildingOffice2Icon
                    className="h-5 w-5 shrink-0 text-[#75a99c]"
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-left font-medium">
                    Todas las ubicaciones
                  </span>
                  {isAllLocations && (
                    <CheckIcon
                      className="h-5 w-5 shrink-0 text-[#75a99c]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              )}
            </Menu.Item>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            {/* Individual Locations */}
            {availableLocations.map((location) => (
              <Menu.Item key={location.id}>
                {({ active }) => (
                  <button
                    onClick={() => switchLocation(location.id)}
                    className={cn(
                      'flex w-full items-center gap-x-3 px-4 py-2 text-sm',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-200',
                      !location.isActive && 'opacity-50'
                    )}
                  >
                    <MapPinIcon
                      className="h-5 w-5 shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate text-left">
                      {location.name}
                      {location.isPrimary && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          (Principal)
                        </span>
                      )}
                    </span>
                    {!isAllLocations && currentLocation?.id === location.id && (
                      <CheckIcon
                        className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-500"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

/**
 * LocationBadge - Simple badge showing current location name
 *
 * Lightweight component for displaying current location without
 * switching functionality. Useful for read-only contexts.
 *
 * @example
 * ```tsx
 * <LocationBadge />
 * ```
 */
export function LocationBadge() {
  const { currentLocation, isLoading, isAllLocations, availableLocations } = useLocation();

  if (isLoading || (!currentLocation && !isAllLocations)) {
    return null;
  }

  // Don't show if only one location
  if (availableLocations.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm">
      {isAllLocations ? (
        <BuildingOffice2Icon className="h-4 w-4 text-[#75a99c]" aria-hidden="true" />
      ) : (
        <MapPinIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
      )}
      <span className="font-medium text-gray-700 dark:text-gray-200">
        {isAllLocations ? 'Todas' : currentLocation?.name}
      </span>
    </div>
  );
}

/**
 * LocationIndicator - Inline location indicator with icon
 *
 * Compact component for showing location context in tight spaces.
 * Does not provide switching functionality.
 *
 * @example
 * ```tsx
 * <LocationIndicator />
 * ```
 */
export function LocationIndicator() {
  const { currentLocation, isLoading, isAllLocations, availableLocations } = useLocation();

  if (isLoading || (!currentLocation && !isAllLocations)) {
    return null;
  }

  // Don't show if only one location
  if (availableLocations.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-x-1.5 text-xs text-gray-600 dark:text-gray-400">
      {isAllLocations ? (
        <BuildingOffice2Icon className="h-3.5 w-3.5 text-[#75a99c]" aria-hidden="true" />
      ) : (
        <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span>{isAllLocations ? 'Todas las ubicaciones' : currentLocation?.name}</span>
    </div>
  );
}
