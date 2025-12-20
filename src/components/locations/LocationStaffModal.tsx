'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

interface Staff {
  id: string;
  name: string;
  position: string;
  email: string | null;
  isActive: boolean;
}

interface AssignedStaff extends Staff {
  isPrimary: boolean;
}

interface LocationStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  onUpdate?: () => void;
}

export function LocationStaffModal({
  isOpen,
  onClose,
  locationId,
  locationName,
  onUpdate,
}: LocationStaffModalProps) {
  const router = useRouter();
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAddNewStaff = () => {
    onClose();
    router.push('/dashboard/staff');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all active staff
      const staffResponse = await fetch('/api/staff?isActive=true');
      const staffData = await staffResponse.json();
      const allStaff: Staff[] = staffData.staff || [];

      // Fetch staff assignments for this location
      // We need to check each staff's locations to see if they're assigned here
      const assignedList: AssignedStaff[] = [];
      const availableList: Staff[] = [];

      for (const staff of allStaff) {
        try {
          const locResponse = await fetch(`/api/staff/${staff.id}/locations`);
          if (locResponse.ok) {
            const locData = await locResponse.json();
            const assignment = locData.locations?.find(
              (loc: { locationId: string; isPrimary: boolean }) =>
                loc.locationId === locationId
            );

            if (assignment) {
              assignedList.push({ ...staff, isPrimary: assignment.isPrimary });
            } else {
              availableList.push(staff);
            }
          } else {
            availableList.push(staff);
          }
        } catch {
          availableList.push(staff);
        }
      }

      setAssignedStaff(assignedList);
      setAvailableStaff(availableList);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleAssignStaff = async (staffId: string) => {
    setActionLoading(staffId);
    try {
      const response = await fetch(`/api/staff/${staffId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al asignar personal');
      }

      await fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert(error instanceof Error ? error.message : 'Error al asignar personal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    setActionLoading(staffId);
    try {
      const response = await fetch(`/api/staff/${staffId}/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al remover personal');
      }

      await fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing staff:', error);
      alert(error instanceof Error ? error.message : 'Error al remover personal');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Personal de {locationName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Assigned Staff */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Personal asignado ({assignedStaff.length})
                  </h4>
                  {assignedStaff.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      No hay personal asignado a esta ubicación
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignedStaff.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <UserCircleIcon className="w-10 h-10 text-gray-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {staff.name}
                                </span>
                                {staff.isPrimary && (
                                  <span className="text-xs bg-[#75a99c] text-white px-2 py-0.5 rounded-full">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {staff.position}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveStaff(staff.id)}
                            disabled={actionLoading === staff.id}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                            title="Remover de esta ubicación"
                          >
                            {actionLoading === staff.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" />
                            ) : (
                              <TrashIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Staff */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Personal disponible ({availableStaff.length})
                  </h4>
                  {availableStaff.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      Todo el personal ya está asignado a esta ubicación
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableStaff.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <UserCircleIcon className="w-10 h-10 text-gray-400" />
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {staff.name}
                              </span>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {staff.position}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssignStaff(staff.id)}
                            disabled={actionLoading === staff.id}
                            className="p-2 text-[#75a99c] hover:bg-[#75a99c]/10 rounded-lg disabled:opacity-50"
                            title="Asignar a esta ubicación"
                          >
                            {actionLoading === staff.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#75a99c]" />
                            ) : (
                              <PlusIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAddNewStaff}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#75a99c] hover:bg-[#5d8b80] rounded-lg transition-colors"
            >
              <UserPlusIcon className="w-4 h-4" />
              Agregar personal nuevo
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
