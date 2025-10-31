'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { consultationSchema, COMMON_SYMPTOMS, type ConsultationFormData } from '../../lib/medical-validation';
import { MedicalHistory } from '@prisma/client';
import { getThemeClasses } from '../../utils/theme-colors';

interface ConsultationFormProps {
  petId: string;
  tenantId: string;
  onSuccess?: (consultation: MedicalHistory) => void;
  onCancel?: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  position: string;
  licenseNumber: string | null;
}

export function ConsultationForm({ petId, tenantId, onSuccess, onCancel }: ConsultationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      symptoms: [],
      next_appointment: undefined,
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

  // Update form when symptoms change
  useEffect(() => {
    setValue('symptoms', selectedSymptoms);
  }, [selectedSymptoms, setValue]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/medical/consultations', {
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
        console.error('❌ API Error Response:', errorData);
        
        // Show more detailed error message if available
        const errorMessage = errorData.details || errorData.error || errorData.message || 'Error al crear la consulta';
        throw new Error(errorMessage);
      }

      const consultation = await response.json();
      onSuccess?.(consultation);
    } catch (error) {
      console.error('❌ Error submitting consultation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la consulta';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
      {/* Motivo de la Consulta */}
      <div className={`card p-4 md:p-6 space-y-4 ${getThemeClasses('background.card', 'border.card')}`}>
        <h3 className={`text-base md:text-lg font-semibold ${getThemeClasses('text.primary')} flex items-center`}>
          <span className={`w-6 h-6 md:w-8 md:h-8 ${getThemeClasses('background.accent')} text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold mr-3`}>
            1
          </span>
          Motivo de la Consulta
        </h3>
        
        <div>
          <label htmlFor="reason" className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-2`}>
            Describe el motivo de la visita *
          </label>
          <textarea
            id="reason"
            {...register('reason')}
            rows={3}
            className="form-input"
            placeholder="Ej: Revisión de rutina, síntomas específicos, seguimiento de tratamiento..."
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
          )}
        </div>
      </div>

      {/* Síntomas Observados */}
      <div className={`card p-4 md:p-6 space-y-4 ${getThemeClasses('background.card', 'border.card')}`}>
        <h3 className={`text-base md:text-lg font-semibold ${getThemeClasses('text.primary')} flex items-center`}>
          <span className={`w-6 h-6 md:w-8 md:h-8 ${getThemeClasses('background.accent')} text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold mr-3`}>
            2
          </span>
          Síntomas Observados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {COMMON_SYMPTOMS.map((symptom) => (
            <label
              key={symptom}
              className={`flex items-center p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                selectedSymptoms.includes(symptom)
                  ? `${getThemeClasses('background.accent')} bg-opacity-10 ${getThemeClasses('border.accent')} text-[#75a99c] dark:text-[#9ed3c4]`
                  : `${getThemeClasses('background.card', 'border.card')} ${getThemeClasses('hover.card')}`
              }`}
            >
              <input
                type="checkbox"
                checked={selectedSymptoms.includes(symptom)}
                onChange={() => handleSymptomToggle(symptom)}
                className="sr-only"
              />
              <span className="text-xs md:text-sm font-medium">{symptom}</span>
            </label>
          ))}
        </div>

        {/* Custom Symptom Input */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            placeholder="Agregar síntoma personalizado..."
            className="form-input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSymptom())}
          />
          <button
            type="button"
            onClick={handleAddCustomSymptom}
            className="btn-primary px-4 py-2 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Agregar</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>

        {selectedSymptoms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((symptom) => (
              <span
                key={symptom}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {symptom}
                <button
                  type="button"
                  onClick={() => handleSymptomToggle(symptom)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.symptoms && (
          <p className="text-sm text-red-600">{errors.symptoms.message}</p>
        )}
      </div>

      {/* Diagnóstico */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            3
          </span>
          Diagnóstico
        </h3>
        
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
            Diagnóstico médico *
          </label>
          <textarea
            id="diagnosis"
            {...register('diagnosis')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingresa el diagnóstico basado en la evaluación..."
          />
          {errors.diagnosis && (
            <p className="mt-1 text-sm text-red-600">{errors.diagnosis.message}</p>
          )}
        </div>
      </div>

      {/* Plan de Tratamiento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            4
          </span>
          Plan de Tratamiento
        </h3>
        
        <div>
          <label htmlFor="treatment_plan" className="block text-sm font-medium text-gray-700 mb-2">
            Describe el plan de tratamiento *
          </label>
          <textarea
            id="treatment_plan"
            {...register('treatment_plan')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Detalla el tratamiento recomendado, medicamentos, cuidados especiales..."
          />
          {errors.treatment_plan && (
            <p className="mt-1 text-sm text-red-600">{errors.treatment_plan.message}</p>
          )}
        </div>
      </div>

      {/* Veterinario */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            5
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* Observaciones Adicionales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            6
          </span>
          Observaciones Adicionales
        </h3>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cualquier observación adicional, recomendaciones especiales..."
          />
        </div>

        <div>
          <label htmlFor="next_appointment" className="block text-sm font-medium text-gray-700 mb-2">
            Próxima cita (opcional)
          </label>
          <input
            type="datetime-local"
            id="next_appointment"
            {...register('next_appointment', {
              setValueAs: (value) => value ? new Date(value) : undefined,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          )}
          <span>{isSubmitting ? 'Guardando...' : 'Guardar Consulta'}</span>
        </button>
      </div>
    </form>
  );
} 