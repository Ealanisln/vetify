'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vitalSignsSchema, type VitalSignsFormData } from '../../lib/medical-validation';
import { getThemeClasses } from '../../utils/theme-colors';

interface VitalSignsFormProps {
  petId: string;
  tenantId: string;
  consultationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VitalSignsForm({ petId, tenantId, consultationId, onSuccess, onCancel }: VitalSignsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<VitalSignsFormData>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      recorded_date: new Date(),
      consultation_id: consultationId,
    },
  });

  // Watch form values for real-time feedback
  const weight = watch('weight');
  const temperature = watch('temperature');
  const heartRate = watch('heart_rate');
  const respiratoryRate = watch('respiratory_rate');

  // Helper functions for vital signs assessment
  const getWeightStatus = (weight: number) => {
    if (weight < 1) return { status: 'low', color: 'text-red-600', message: 'Peso muy bajo' };
    if (weight > 50) return { status: 'high', color: 'text-orange-600', message: 'Peso elevado' };
    return { status: 'normal', color: 'text-green-600', message: 'Peso normal' };
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp < 37.5) return { status: 'low', color: 'text-blue-600', message: 'Hipotermia' };
    if (temp > 39.5) return { status: 'high', color: 'text-red-600', message: 'Fiebre' };
    return { status: 'normal', color: 'text-green-600', message: 'Normal' };
  };

  const getHeartRateStatus = (hr: number) => {
    if (hr < 60) return { status: 'low', color: 'text-blue-600', message: 'Bradicardia' };
    if (hr > 160) return { status: 'high', color: 'text-red-600', message: 'Taquicardia' };
    return { status: 'normal', color: 'text-green-600', message: 'Normal' };
  };

  const getRespiratoryRateStatus = (rr: number) => {
    if (rr < 10) return { status: 'low', color: 'text-blue-600', message: 'Bradipnea' };
    if (rr > 40) return { status: 'high', color: 'text-red-600', message: 'Taquipnea' };
    return { status: 'normal', color: 'text-green-600', message: 'Normal' };
  };

  const onSubmit = async (data: VitalSignsFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/medical/vitals', {
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
        throw new Error(errorData.message || 'Error al registrar los signos vitales');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting vital signs:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar los signos vitales');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="medical-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
      {/* Fecha de Registro */}
      <div className={`card p-4 md:p-6 space-y-4 ${getThemeClasses('background.card', 'border.card')}`}>
        <h3 className={`text-base md:text-lg font-semibold ${getThemeClasses('text.primary')} flex items-center`}>
          <span className={`w-6 h-6 md:w-8 md:h-8 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs md:text-sm font-bold mr-3`}>
            1
          </span>
          Fecha de Registro
        </h3>
        
        <div>
          <label htmlFor="recorded_date" className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-2`}>
            Fecha y hora del registro *
          </label>
          <input
            type="datetime-local"
            id="recorded_date"
            {...register('recorded_date', {
              setValueAs: (value) => new Date(value),
            })}
            className="form-input"
          />
          {errors.recorded_date && (
            <p className="mt-1 text-sm text-red-600">{errors.recorded_date.message}</p>
          )}
        </div>
      </div>

      {/* Signos Vitales Principales */}
      <div className={`card p-4 md:p-6 space-y-4 ${getThemeClasses('background.card', 'border.card')}`}>
        <h3 className={`text-base md:text-lg font-semibold ${getThemeClasses('text.primary')} flex items-center`}>
          <span className={`w-6 h-6 md:w-8 md:h-8 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs md:text-sm font-bold mr-3`}>
            2
          </span>
          Signos Vitales Principales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Weight */}
          <div>
            <label htmlFor="weight" className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-2`}>
              Peso (kg) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="weight"
                {...register('weight', { valueAsNumber: true })}
                step="0.1"
                min="0.1"
                max="200"
                className="form-input pr-8"
                placeholder="15.5"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className={`${getThemeClasses('text.tertiary')} text-sm`}>kg</span>
              </div>
            </div>
            {weight && (
              <p className={`mt-1 text-xs ${getWeightStatus(weight).color}`}>
                {getWeightStatus(weight).message}
              </p>
            )}
            {errors.weight && (
              <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
            )}
          </div>

          {/* Temperature */}
          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
              Temperatura (°C) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="temperature"
                {...register('temperature', { valueAsNumber: true })}
                step="0.1"
                min="35"
                max="45"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="38.5"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-gray-500 text-sm">°C</span>
              </div>
            </div>
            {temperature && (
              <p className={`mt-1 text-xs ${getTemperatureStatus(temperature).color}`}>
                {getTemperatureStatus(temperature).message}
              </p>
            )}
            {errors.temperature && (
              <p className="mt-1 text-sm text-red-600">{errors.temperature.message}</p>
            )}
          </div>

          {/* Heart Rate */}
          <div>
            <label htmlFor="heart_rate" className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia Cardíaca (lpm) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="heart_rate"
                {...register('heart_rate', { valueAsNumber: true })}
                min="30"
                max="300"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="120"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-gray-500 text-sm">lpm</span>
              </div>
            </div>
            {heartRate && (
              <p className={`mt-1 text-xs ${getHeartRateStatus(heartRate).color}`}>
                {getHeartRateStatus(heartRate).message}
              </p>
            )}
            {errors.heart_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.heart_rate.message}</p>
            )}
          </div>

          {/* Respiratory Rate */}
          <div>
            <label htmlFor="respiratory_rate" className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia Respiratoria (rpm) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="respiratory_rate"
                {...register('respiratory_rate', { valueAsNumber: true })}
                min="5"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="24"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-gray-500 text-sm">rpm</span>
              </div>
            </div>
            {respiratoryRate && (
              <p className={`mt-1 text-xs ${getRespiratoryRateStatus(respiratoryRate).color}`}>
                {getRespiratoryRateStatus(respiratoryRate).message}
              </p>
            )}
            {errors.respiratory_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.respiratory_rate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Signos Adicionales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
            3
          </span>
          Signos Adicionales
        </h3>
        
        <div>
          <label htmlFor="blood_pressure" className="block text-sm font-medium text-gray-700 mb-2">
            Presión Arterial (opcional)
          </label>
          <input
            type="text"
            id="blood_pressure"
            {...register('blood_pressure')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej: 120/80 mmHg"
          />
          <p className="mt-1 text-xs text-gray-500">
            Formato: sistólica/diastólica mmHg
          </p>
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
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Comportamiento durante el examen, condición general, observaciones especiales..."
          />
        </div>
      </div>

      {/* Vital Signs Summary */}
      {(weight || temperature || heartRate || respiratoryRate) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen de Signos Vitales</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {weight && (
              <div className="text-center">
                <p className="font-medium text-gray-900">{weight} kg</p>
                <p className={getWeightStatus(weight).color}>Peso</p>
              </div>
            )}
            {temperature && (
              <div className="text-center">
                <p className="font-medium text-gray-900">{temperature}°C</p>
                <p className={getTemperatureStatus(temperature).color}>Temperatura</p>
              </div>
            )}
            {heartRate && (
              <div className="text-center">
                <p className="font-medium text-gray-900">{heartRate} lpm</p>
                <p className={getHeartRateStatus(heartRate).color}>Cardíaca</p>
              </div>
            )}
            {respiratoryRate && (
              <div className="text-center">
                <p className="font-medium text-gray-900">{respiratoryRate} rpm</p>
                <p className={getRespiratoryRateStatus(respiratoryRate).color}>Respiratoria</p>
              </div>
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
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          )}
          <span>{isSubmitting ? 'Guardando...' : 'Registrar Signos Vitales'}</span>
        </button>
      </div>
    </form>
  );
} 