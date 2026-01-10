'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  canAccess,
  getAccessibleFeatures,
  isAdminPosition,
  type Feature,
  type Action,
} from '@/lib/staff-permissions';
import type { StaffPositionType } from '@/lib/staff-positions';

interface StaffData {
  id: string;
  name: string;
  position: StaffPositionType;
  email: string | null;
  isActive: boolean;
}

interface UseStaffPermissionsReturn {
  // Staff data
  staff: StaffData | null;
  position: StaffPositionType | null;
  isLoading: boolean;
  error: string | null;

  // Permission checks
  canAccess: (feature: Feature, action?: Action) => boolean;
  accessibleFeatures: Feature[];

  // Convenience booleans
  isAdmin: boolean;
  isVeterinarian: boolean;
  isReceptionist: boolean;
  isAssistant: boolean;
  isTechnician: boolean;

  // Refetch
  refresh: () => Promise<void>;
}

/**
 * Hook to get current user's staff info and permissions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { canAccess, isAdmin, position } = useStaffPermissions();
 *
 *   if (!canAccess('medical', 'write')) {
 *     return <p>No tienes permiso para editar registros médicos</p>;
 *   }
 *
 *   return <MedicalForm />;
 * }
 * ```
 */
export function useStaffPermissions(): UseStaffPermissionsReturn {
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/staff/me');

      if (!response.ok) {
        if (response.status === 404) {
          // No staff record - user is probably the tenant owner without a staff record
          // They get admin permissions by default
          setStaff(null);
          return;
        }
        throw new Error('Error al obtener información del staff');
      }

      const data = await response.json();
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStaff(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Determine effective position (MANAGER for tenant owners without staff record)
  const effectivePosition: StaffPositionType | null = staff?.position ?? (isLoading ? null : 'MANAGER');

  // Permission check function
  const checkAccess = useCallback(
    (feature: Feature, action: Action = 'read'): boolean => {
      if (isLoading) return false;
      return canAccess(effectivePosition, feature, action);
    },
    [effectivePosition, isLoading]
  );

  // Get accessible features
  const accessibleFeatures = effectivePosition
    ? getAccessibleFeatures(effectivePosition)
    : [];

  return {
    staff,
    position: effectivePosition,
    isLoading,
    error,

    canAccess: checkAccess,
    accessibleFeatures,

    isAdmin: effectivePosition ? isAdminPosition(effectivePosition) : false,
    isVeterinarian: effectivePosition === 'VETERINARIAN',
    isReceptionist: effectivePosition === 'RECEPTIONIST',
    isAssistant: effectivePosition === 'ASSISTANT',
    isTechnician: effectivePosition === 'VETERINARY_TECHNICIAN',

    refresh: fetchStaffData,
  };
}

export default useStaffPermissions;
