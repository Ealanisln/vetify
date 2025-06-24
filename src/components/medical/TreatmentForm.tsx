'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { treatmentSchema, COMMON_MEDICATIONS, type TreatmentFormData } from '@/lib/medical-validation';
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
          pet_id: petId,
          tenant_id: tenantId,
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Treatment Type */}
        <div>
          <label htmlFor="treatment_type" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Tratamiento *
          </label>
          <select
            id="treatment_type"
            {...register('treatment_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
        <div>
          <label htmlFor="medication_name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del medicamento *
          </label>
          <input
            type="text"
            id="medication_name"
            {...register('medication_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: Amoxicilina"
          />
          {errors.medication_name && (
            <p className="mt-1 text-sm text-red-600">{errors.medication_name.message}</p>
          )}
          
          {/* Common medications suggestions */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Medicamentos comunes:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_MEDICATIONS.slice(0, 5).map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() => {
                    const medicationInput = document.getElementById('medication_name') as HTMLInputElement;
                    if (medicationInput) medicationInput.value = med;
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
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
        <div>
          <label htmlFor="veterinarian_id" className="block text-sm font-medium text-gray-700 mb-2">
            Veterinario responsable *
          </label>
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
    </div>
  );
} 