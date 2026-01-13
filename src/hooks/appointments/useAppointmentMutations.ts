/**
 * Hook for appointment mutations (create, update, delete)
 *
 * Provides optimistic updates and automatic cache invalidation.
 */

'use client';

import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { APPOINTMENTS_KEYS } from '@/lib/appointments/cache-keys';
import {
  createAppointment as createApi,
  updateAppointment as updateApi,
  deleteAppointment as deleteApi,
  quickActionAppointment as quickActionApi,
  AppointmentWithDetails,
} from '@/lib/appointments/fetchers';
import { AppointmentFormData } from '@/lib/validations/appointments';

/**
 * Return type for useAppointmentMutations
 */
export interface UseAppointmentMutationsReturn {
  /** Create a new appointment */
  createAppointment: (data: AppointmentFormData) => Promise<AppointmentWithDetails>;
  /** Update an existing appointment */
  updateAppointment: (
    id: string,
    data: Partial<AppointmentFormData>
  ) => Promise<AppointmentWithDetails>;
  /** Delete (cancel) an appointment */
  deleteAppointment: (id: string) => Promise<AppointmentWithDetails>;
  /** Quick action (change status) */
  quickAction: (
    id: string,
    action: string,
    notes?: string
  ) => Promise<AppointmentWithDetails>;
  /** Invalidate all appointment caches */
  invalidateAll: () => Promise<void>;
}

/**
 * Hook for appointment mutations with cache invalidation
 *
 * All mutations automatically invalidate the appointments cache,
 * triggering a refresh in all components using useAppointmentsData.
 *
 * @example
 * ```tsx
 * const { createAppointment, quickAction } = useAppointmentMutations();
 *
 * // Create appointment - cache automatically refreshes
 * await createAppointment(formData);
 *
 * // Quick status change
 * await quickAction(appointmentId, 'confirm');
 * ```
 */
export function useAppointmentMutations(): UseAppointmentMutationsReturn {
  const { mutate } = useSWRConfig();

  /**
   * Invalidate all appointment-related caches
   * This triggers a refetch in all components using appointment data
   */
  const invalidateAll = useCallback(async () => {
    // Invalidate all keys that start with 'appointments'
    await mutate(
      (key) => {
        if (Array.isArray(key) && key[0] === 'appointments') {
          return true;
        }
        return false;
      },
      undefined,
      { revalidate: true }
    );
  }, [mutate]);

  /**
   * Create a new appointment
   */
  const createAppointment = useCallback(
    async (data: AppointmentFormData): Promise<AppointmentWithDetails> => {
      const newAppointment = await createApi(data);

      // Invalidate all appointment caches to include the new appointment
      await invalidateAll();

      return newAppointment;
    },
    [invalidateAll]
  );

  /**
   * Update an existing appointment
   */
  const updateAppointment = useCallback(
    async (
      id: string,
      data: Partial<AppointmentFormData>
    ): Promise<AppointmentWithDetails> => {
      const updatedAppointment = await updateApi(id, data);

      // Invalidate all caches to reflect the update
      await invalidateAll();

      return updatedAppointment;
    },
    [invalidateAll]
  );

  /**
   * Delete (cancel) an appointment
   */
  const deleteAppointment = useCallback(
    async (id: string): Promise<AppointmentWithDetails> => {
      const deletedAppointment = await deleteApi(id);

      // Invalidate all caches
      await invalidateAll();

      return deletedAppointment;
    },
    [invalidateAll]
  );

  /**
   * Quick action to change appointment status
   */
  const quickAction = useCallback(
    async (
      id: string,
      action: string,
      notes?: string
    ): Promise<AppointmentWithDetails> => {
      const updatedAppointment = await quickActionApi(id, action, notes);

      // Invalidate all caches
      await invalidateAll();

      return updatedAppointment;
    },
    [invalidateAll]
  );

  return {
    createAppointment,
    updateAppointment,
    deleteAppointment,
    quickAction,
    invalidateAll,
  };
}

/**
 * Hook for optimistic mutations
 *
 * Use this when you want immediate UI feedback before the API responds.
 * The cache is updated immediately, then reverted if the API fails.
 */
export function useOptimisticAppointmentMutation() {
  const { mutate } = useSWRConfig();

  /**
   * Optimistically update an appointment's status
   */
  const optimisticStatusUpdate = useCallback(
    async (
      id: string,
      newStatus: string,
      updateFn: () => Promise<AppointmentWithDetails>
    ) => {
      // Get current data from cache
      // const currentData = cache.get(APPOINTMENTS_KEYS.lists());

      // Optimistically update
      await mutate(
        (key) => Array.isArray(key) && key[0] === 'appointments',
        async (currentData: AppointmentWithDetails[] | undefined) => {
          if (!currentData) return currentData;

          // Optimistically update the status
          return currentData.map((apt) =>
            apt.id === id ? { ...apt, status: newStatus as AppointmentWithDetails['status'] } : apt
          );
        },
        { revalidate: false }
      );

      try {
        // Perform the actual update
        const result = await updateFn();

        // Revalidate to ensure consistency
        await mutate(
          (key) => Array.isArray(key) && key[0] === 'appointments',
          undefined,
          { revalidate: true }
        );

        return result;
      } catch (error) {
        // Revert on error by revalidating
        await mutate(
          (key) => Array.isArray(key) && key[0] === 'appointments',
          undefined,
          { revalidate: true }
        );
        throw error;
      }
    },
    [mutate]
  );

  return { optimisticStatusUpdate };
}
