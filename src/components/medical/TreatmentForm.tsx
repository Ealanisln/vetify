'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { treatmentSchema, COMMON_MEDICATIONS, type TreatmentFormData } from '../../lib/medical-validation';
import { TreatmentType } from '@prisma/client';
import { getThemeClasses } from '../../utils/theme-colors';
import { InlineVeterinarianCreator } from './InlineVeterinarianCreator';

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

  const handleVeterinarianCreated = (newStaff: StaffMember) => {
    setStaff(prev => [...prev, newStaff]);
    setValue('veterinarian_id', newStaff.id);
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
          <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Dosis *
          </label>
          <input
            type="text"
            id="dosage"
            {...register('dosage')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Ej: 250mg"
          />
          {errors.dosage && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dosage.message}</p>
          )}
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Frecuencia *
          </label>
          <input
            type="text"
            id="frequency"
            {...register('frequency')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Ej: Cada 12 horas"
          />
          {errors.frequency && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.frequency.message}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Duración (días) *
          </label>
          <input
            type="number"
            id="duration_days"
            {...register('duration_days', { valueAsNumber: true })}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="7"
          />
          {errors.duration_days && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration_days.message}</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Instrucciones *
          </label>
          <textarea
            id="instructions"
            {...register('instructions')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Instrucciones para el tratamiento..."
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.instructions.message}</p>
          )}
        </div>

        {/* Veterinarian */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="veterinarian_id" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Veterinario responsable *
            </label>
            <InlineVeterinarianCreator
              tenantId={tenantId}
              onVeterinarianCreated={handleVeterinarianCreated}
              theme="green"
              buttonText="+ Agregar"
              buttonClassName="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium flex items-center gap-1 bg-transparent border-0 px-2 py-1"
            />
          </div>
          <select
            id="veterinarian_id"
            {...register('veterinarian_id')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500"
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
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.veterinarian_id.message}</p>
          )}
          {staff.length === 0 && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No hay veterinarios registrados. Por favor agrega uno usando el botón de arriba.
            </p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Fecha de inicio *
          </label>
          <input
            type="date"
            id="start_date"
            {...register('start_date', { valueAsDate: true })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_date.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Tratamiento'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
} 