'use client';

import { useState } from 'react';
import { mapPositionToEnum, POSITION_SELECT_OPTIONS } from '../../lib/staff-positions';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  licenseNumber: string | null;
}

interface InlineVeterinarianCreatorProps {
  tenantId: string;
  onVeterinarianCreated: (veterinarian: StaffMember) => void;
  theme?: 'blue' | 'green' | 'purple';
  buttonText?: string;
  buttonClassName?: string;
}

// Local theme color mappings for component-specific styling
// Uses the shared themeColors for consistency where applicable
const componentThemeColors = {
  blue: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    ring: 'focus:ring-blue-500',
    border: 'focus:border-blue-500'
  },
  green: {
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    ring: 'focus:ring-green-500',
    border: 'focus:border-green-500'
  },
  purple: {
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-700',
    ring: 'focus:ring-purple-500',
    border: 'focus:border-purple-500'
  }
};

export function InlineVeterinarianCreator({
  tenantId,
  onVeterinarianCreated,
  theme = 'blue',
  buttonText = 'Agregar Veterinario',
  buttonClassName = ''
}: InlineVeterinarianCreatorProps) {
  const [showModal, setShowModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    position: 'Veterinario',
    licenseNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = componentThemeColors[theme];

  const handleAddStaff = async () => {
    if (!newStaffData.name.trim()) {
      setError('Por favor ingresa el nombre del veterinario');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/medical/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStaffData.name.trim(),
          position: mapPositionToEnum(newStaffData.position),
          licenseNumber: newStaffData.licenseNumber.trim() || null,
          tenantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el veterinario');
      }

      const newStaff = await response.json();

      // Call the parent's callback with the new veterinarian
      onVeterinarianCreated(newStaff);

      // Reset and close modal
      setShowModal(false);
      setNewStaffData({ name: '', position: 'Veterinario', licenseNumber: '' });
    } catch (error) {
      console.error('Error adding staff:', error);
      setError(error instanceof Error ? error.message : 'Error al agregar el veterinario. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setNewStaffData({ name: '', position: 'Veterinario', licenseNumber: '' });
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={buttonClassName || `${colors.bg} ${colors.hover} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}
      >
        {buttonText}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Agregar Veterinario
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={newStaffData.name}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${colors.ring} ${colors.border}`}
                  placeholder="Ej: Dr. Juan Pérez"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posición
                </label>
                <select
                  value={newStaffData.position}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, position: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${colors.ring} ${colors.border}`}
                  disabled={isSubmitting}
                >
                  {POSITION_SELECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de licencia (opcional)
                </label>
                <input
                  type="text"
                  value={newStaffData.licenseNumber}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${colors.ring} ${colors.border}`}
                  placeholder="Ej: VET-12345"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                disabled={isSubmitting}
                className={`px-4 py-2 ${colors.bg} ${colors.hover} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                )}
                <span>{isSubmitting ? 'Agregando...' : 'Agregar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
