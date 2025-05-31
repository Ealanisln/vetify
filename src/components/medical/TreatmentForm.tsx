'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { treatmentSchema, COMMON_MEDICATIONS, type TreatmentFormData } from '@/lib/medical-validation';
import { getStaffMembers } from '@/lib/medical';
import { TreatmentType } from '@prisma/client';

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
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      start_date: new Date(),
      treatment_type: TreatmentType.OTHER_PREVENTATIVE,
      consultation_id: consultationId,
    },
  });

  // Load staff members
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staffData = await getStaffMembers(tenantId);
        setStaff(staffData);
      } catch (error) {
        console.error('Error loading staff:', error);
      }
    };
    loadStaff();
  }, [tenantId]);

  const onSubmit = async (data: TreatmentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/medical/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId,
          tenantId,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el tratamiento');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting treatment:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el tratamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Tipo de Tratamiento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            1
          </span>
          Tipo de Tratamiento
        </h3>
        
        <div>
          <label htmlFor="treatment_type" className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona el tipo de tratamiento *
          </label>
          <select
            id="treatment_type"
            {...register('treatment_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value={TreatmentType.OTHER_PREVENTATIVE}>Medicamento General</option>
            <option value={TreatmentType.VACCINATION}>Vacunación</option>
            <option value={TreatmentType.DEWORMING}>Desparasitación</option>
            <option value={TreatmentType.FLEA_TICK}>Control de Pulgas/Garrapatas</option>
          </select>
          {errors.treatment_type && (
            <p className="mt-1 text-sm text-red-600">{errors.treatment_type.message}</p>
          )}
        </div>
      </div>

      {/* Medicamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            2
          </span>
          Medicamento
        </h3>
        
        <div>
          <label htmlFor="medication_name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del medicamento *
          </label>
          <input
            type="text"
            id="medication_name"
            {...register('medication_name')}
            list="medications"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: Amoxicilina, Prednisolona..."
          />
          <datalist id="medications">
            {COMMON_MEDICATIONS.map((med) => (
              <option key={med} value={med} />
            ))}
          </datalist>
          {errors.medication_name && (
            <p className="mt-1 text-sm text-red-600">{errors.medication_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 mb-2">
              Dosis *
            </label>
            <input
              type="text"
              id="dosage"
              {...register('dosage')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ej: 250mg, 1 tableta, 2ml..."
            />
            {errors.dosage && (
              <p className="mt-1 text-sm text-red-600">{errors.dosage.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia *
            </label>
            <input
              type="text"
              id="frequency"
              {...register('frequency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ej: Cada 12 horas, 2 veces al día..."
            />
            {errors.frequency && (
              <p className="mt-1 text-sm text-red-600">{errors.frequency.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Duración y Fechas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            3
          </span>
          Duración y Fechas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-2">
              Duración (días) *
            </label>
            <input
              type="number"
              id="duration_days"
              {...register('duration_days', { valueAsNumber: true })}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="7"
            />
            {errors.duration_days && (
              <p className="mt-1 text-sm text-red-600">{errors.duration_days.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de inicio *
            </label>
            <input
              type="date"
              id="start_date"
              {...register('start_date', {
                setValueAs: (value) => new Date(value),
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            4
          </span>
          Instrucciones
        </h3>
        
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Instrucciones detalladas *
          </label>
          <textarea
            id="instructions"
            {...register('instructions')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Administrar con comida, evitar lácteos, observar efectos secundarios..."
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-red-600">{errors.instructions.message}</p>
          )}
        </div>
      </div>

      {/* Veterinario (opcional si no hay consultation_id) */}
      {!consultationId && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
              5
            </span>
            Veterinario Responsable
          </h3>
          
          <div>
            <label htmlFor="veterinarian_id" className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el veterinario
            </label>
            <select
              id="veterinarian_id"
              {...register('veterinarian_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Selecciona un veterinario...</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.position}
                  {member.licenseNumber && ` (Lic. ${member.licenseNumber})`}
                </option>
              ))}
            </select>
            {errors.veterinarian_id && (
              <p className="mt-1 text-sm text-red-600">{errors.veterinarian_id.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          )}
          <span>{isSubmitting ? 'Guardando...' : 'Guardar Tratamiento'}</span>
        </button>
      </div>
    </form>
  );
} 