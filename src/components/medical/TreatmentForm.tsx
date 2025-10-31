'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { treatmentSchema, COMMON_MEDICATIONS, type TreatmentFormData } from '../../lib/medical-validation';
import { TreatmentType } from '@prisma/client';
import { getThemeClasses } from '../../utils/theme-colors';

interface TreatmentFormProps {
  petId: string;
  tenantId: string;
  consultationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  position: string;
  licenseNumber: string | null;
}

export function TreatmentForm({ petId, tenantId, consultationId, onSuccess, onCancel }: TreatmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    position: 'Veterinario',
    licenseNumber: ''
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      start_date: new Date(),
      treatment_type: TreatmentType.OTHER_PREVENTATIVE,
      consultation_id: consultationId,
      duration_days: 1,
    },
  });

  // Load staff members
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await fetch(`/api/medical/staff?tenantId=${tenantId}`);
        if (!response.ok) {
          throw new Error('Error al cargar el personal');
        }
        const staffData = await response.json();
        setStaff(staffData);
      } catch (error) {
        console.error('Error loading staff:', error);
      }
    };
    loadStaff();
  }, [tenantId]);

  const handleAddStaff = async () => {
    if (!newStaffData.name.trim()) {
      alert('Por favor ingresa el nombre del veterinario');
      return;
    }

    try {
      const response = await fetch('/api/medical/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newStaffData,
          tenantId,
          licenseNumber: newStaffData.licenseNumber || null
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el veterinario');
      }

      const newStaff = await response.json();
      setStaff(prev => [...prev, newStaff]);
      setValue('veterinarian_id', newStaff.id);
      setShowAddStaffModal(false);
      setNewStaffData({ name: '', position: 'Veterinario', licenseNumber: '' });
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Error al agregar el veterinario. Por favor intenta de nuevo.');
    }
  };

  const onSubmit = async (data: TreatmentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/medical/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          petId: petId,
          tenantId: tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el tratamiento');
      }

      const result = await response.json();
      console.log('Treatment created:', result);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting treatment:', error);
      alert('Error al guardar el tratamiento. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        {/* Treatment Type */}
        <div className={`card p-4 md:p-6 ${getThemeClasses('background.card', 'border.card')}`}>
          <label htmlFor="treatment_type" className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-2`}>
            Tipo de Tratamiento *
          </label>
          <select
            id="treatment_type"
            {...register('treatment_type')}
            className="form-input"
          >
            <option value={TreatmentType.VACCINATION}>Vacunación</option>
            <option value={TreatmentType.DEWORMING}>Desparasitación</option>
            <option value={TreatmentType.FLEA_TICK}>Antipulgas/Garrapatas</option>
            <option value={TreatmentType.OTHER_PREVENTATIVE}>Otro Preventivo</option>
          </select>
          {errors.treatment_type && (
            <p className="mt-1 text-sm text-red-600">{errors.treatment_type.message}</p>
          )}
        </div>

        {/* Medication Name */}
        <div className={`card p-4 md:p-6 space-y-3 ${getThemeClasses('background.card', 'border.card')}`}>
          <label htmlFor="medication_name" className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-2`}>
            Nombre del medicamento *
          </label>
          <input
            type="text"
            id="medication_name"
            {...register('medication_name')}
            className="form-input"
            placeholder="Ej: Amoxicilina"
          />
          {errors.medication_name && (
            <p className="mt-1 text-sm text-red-600">{errors.medication_name.message}</p>
          )}
          
          {/* Common medications suggestions */}
          <div className="mt-2">
            <p className={`text-xs ${getThemeClasses('text.tertiary')} mb-1`}>Medicamentos comunes:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_MEDICATIONS.slice(0, 5).map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() => {
                    const medicationInput = document.getElementById('medication_name') as HTMLInputElement;
                    if (medicationInput) medicationInput.value = med;
                  }}
                  className={`text-xs px-2 py-1 rounded transition-colors ${getThemeClasses('background.muted', 'text.secondary')} ${getThemeClasses('hover.muted')}`}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dosage */}
        <div>
          <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 mb-2">
            Dosis *
          </label>
          <input
            type="text"
            id="dosage"
            {...register('dosage')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: 250mg"
          />
          {errors.dosage && (
            <p className="mt-1 text-sm text-red-600">{errors.dosage.message}</p>
          )}
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
            Frecuencia *
          </label>
          <input
            type="text"
            id="frequency"
            {...register('frequency')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: Cada 12 horas"
          />
          {errors.frequency && (
            <p className="mt-1 text-sm text-red-600">{errors.frequency.message}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-2">
            Duración (días) *
          </label>
          <input
            type="number"
            id="duration_days"
            {...register('duration_days', { valueAsNumber: true })}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="7"
          />
          {errors.duration_days && (
            <p className="mt-1 text-sm text-red-600">{errors.duration_days.message}</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Instrucciones *
          </label>
          <textarea
            id="instructions"
            {...register('instructions')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Instrucciones para el tratamiento..."
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-red-600">{errors.instructions.message}</p>
          )}
        </div>

        {/* Veterinarian */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="veterinarian_id" className="block text-sm font-medium text-gray-700">
              Veterinario responsable *
            </label>
            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Veterinario
            </button>
          </div>
          <select
            id="veterinarian_id"
            {...register('veterinarian_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Seleccionar veterinario</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} - {member.position}
                {member.licenseNumber && ` (Lic: ${member.licenseNumber})`}
              </option>
            ))}
          </select>
          {errors.veterinarian_id && (
            <p className="mt-1 text-sm text-red-600">{errors.veterinarian_id.message}</p>
          )}
          {staff.length === 0 && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No hay veterinarios registrados. Por favor agrega uno usando el botón de arriba.
            </p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de inicio *
          </label>
          <input
            type="date"
            id="start_date"
            {...register('start_date', { valueAsDate: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Tratamiento'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Agregar Veterinario</h2>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={newStaffData.name}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Dr. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posición
                </label>
                <select
                  value={newStaffData.position}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Veterinario">Veterinario</option>
                  <option value="Veterinario Especialista">Veterinario Especialista</option>
                  <option value="Cirujano Veterinario">Cirujano Veterinario</option>
                  <option value="Asistente Veterinario">Asistente Veterinario</option>
                  <option value="Técnico Veterinario">Técnico Veterinario</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de licencia (opcional)
                </label>
                <input
                  type="text"
                  value={newStaffData.licenseNumber}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: VET-12345"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 