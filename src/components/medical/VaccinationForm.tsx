'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vaccinationSchema, COMMON_VACCINES, type VaccinationFormData } from '@/lib/medical-validation';
import { TreatmentType, VaccinationStage } from '@prisma/client';
import { getThemeClasses } from '@/utils/theme-colors';

interface VaccinationFormProps {
  petId: string;
  tenantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  position: string;
  licenseNumber: string | null;
}

export function VaccinationForm({ petId, tenantId, onSuccess, onCancel }: VaccinationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      vaccine_type: TreatmentType.VACCINATION,
      administered_date: new Date(),
      next_due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
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

  const onSubmit = async (data: VaccinationFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/medical/vaccinations', {
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
        throw new Error(errorData.message || 'Error al registrar la vacunación');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting vaccination:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar la vacunación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
      {/* Información de la Vacuna */}
      <div className={`card p-4 md:p-6 space-y-4 ${getThemeClasses('background.card', 'border.card')}`}>
        <h3 className={`text-base md:text-lg font-semibold ${getThemeClasses('text.primary')} flex items-center`}>
          <span className={`w-6 h-6 md:w-8 md:h-8 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs md:text-sm font-bold mr-3`}>
            1
          </span>
          Información de la Vacuna
        </h3>
        
        <div>
          <label htmlFor="vaccine_brand" className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-2`}>
            Tipo/Marca de vacuna *
          </label>
          <input
            type="text"
            id="vaccine_brand"
            {...register('vaccine_brand')}
            list="vaccines"
            className="form-input"
            placeholder="Ej: DHPPI, Antirrábica..."
          />
          <datalist id="vaccines">
            {COMMON_VACCINES.map((vaccine) => (
              <option key={vaccine} value={vaccine} />
            ))}
          </datalist>
          {errors.vaccine_brand && (
            <p className="mt-1 text-sm text-red-600">{errors.vaccine_brand.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700 mb-2">
              Número de lote *
            </label>
            <input
              type="text"
              id="batch_number"
              {...register('batch_number')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ej: ABC123"
            />
            {errors.batch_number && (
              <p className="mt-1 text-sm text-red-600">{errors.batch_number.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
              Laboratorio (opcional)
            </label>
            <input
              type="text"
              id="manufacturer"
              {...register('manufacturer')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ej: Zoetis, MSD..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="vaccine_stage" className="block text-sm font-medium text-gray-700 mb-2">
            Etapa de vacunación
          </label>
          <select
            id="vaccine_stage"
            {...register('vaccine_stage')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Selecciona una etapa...</option>
            <option value={VaccinationStage.PUPPY_KITTEN}>Cachorro/Gatito</option>
            <option value={VaccinationStage.ADULT}>Adulto</option>
            <option value={VaccinationStage.SENIOR}>Senior</option>
            <option value={VaccinationStage.BOOSTER}>Refuerzo</option>
          </select>
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            2
          </span>
          Fechas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="administered_date" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de aplicación *
            </label>
            <input
              type="date"
              id="administered_date"
              {...register('administered_date', {
                setValueAs: (value) => new Date(value),
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {errors.administered_date && (
              <p className="mt-1 text-sm text-red-600">{errors.administered_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="next_due_date" className="block text-sm font-medium text-gray-700 mb-2">
              Próxima vacuna *
            </label>
            <input
              type="date"
              id="next_due_date"
              {...register('next_due_date', {
                setValueAs: (value) => new Date(value),
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {errors.next_due_date && (
              <p className="mt-1 text-sm text-red-600">{errors.next_due_date.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Veterinario */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            3
          </span>
          Veterinario Responsable
        </h3>
        
        <div>
          <label htmlFor="veterinarian_id" className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona el veterinario *
          </label>
          <select
            id="veterinarian_id"
            {...register('veterinarian_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

      {/* Observaciones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            4
          </span>
          Observaciones
        </h3>
        
        <div>
          <label htmlFor="side_effects" className="block text-sm font-medium text-gray-700 mb-2">
            Efectos secundarios observados (opcional)
          </label>
          <textarea
            id="side_effects"
            {...register('side_effects')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Describe cualquier reacción o efecto secundario observado..."
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Cualquier observación adicional..."
          />
        </div>
      </div>

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
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          )}
          <span>{isSubmitting ? 'Guardando...' : 'Registrar Vacuna'}</span>
        </button>
      </div>
    </form>
  );
} 