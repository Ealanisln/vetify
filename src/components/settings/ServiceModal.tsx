'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ServiceCategory } from '@prisma/client';
import { ServiceWithCategory } from '@/types';

// Esquema de validación
const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().optional(),
  category: z.nativeEnum(ServiceCategory, { required_error: 'Selecciona una categoría' }),
  price: z.number().min(0, 'El precio no puede ser negativo').max(99999, 'El precio es demasiado alto'),
  duration: z.number().min(1, 'La duración mínima es 1 minuto').max(480, 'La duración máxima es 8 horas').optional(),
  isActive: z.boolean()
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: ServiceWithCategory) => void;
  service: ServiceWithCategory | null;
  tenantId: string;
}

export function ServiceModal({ isOpen, onClose, onSave, service, tenantId }: ServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!service;

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'CONSULTATION',
      price: 0,
      duration: 30,
      isActive: true
    }
  });

  // Resetear formulario cuando cambia el servicio
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description || '',
        category: service.category,
        price: typeof service.price === 'number' ? service.price : Number(service.price),
        duration: service.duration || undefined,
        isActive: service.isActive
      });
    } else {
      form.reset({
        name: '',
        description: '',
        category: 'CONSULTATION',
        price: 0,
        duration: 30,
        isActive: true
      });
    }
  }, [service, form]);

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setIsSubmitting(false);
    }
  }, [isOpen, form]);

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    
    try {
      const url = isEditing ? `/api/services/${service.id}` : '/api/services';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tenantId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el servicio');
      }

      const savedService = await response.json();
      onSave(savedService);
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceCategories = [
    { value: 'CONSULTATION', label: 'Consultas' },
    { value: 'SURGERY', label: 'Cirugías' },
    { value: 'VACCINATION', label: 'Vacunación' },
    { value: 'DEWORMING', label: 'Desparasitación' },
    { value: 'PREVENTATIVE_CARE', label: 'Medicina Preventiva' },
    { value: 'GROOMING', label: 'Estética' },
    { value: 'BOARDING', label: 'Hospitalización' },
    { value: 'DENTAL_CARE', label: 'Cuidado Dental' },
    { value: 'LABORATORY_TEST', label: 'Análisis de Laboratorio' },
    { value: 'IMAGING_RADIOLOGY', label: 'Radiografías/Imágenes' },
    { value: 'HOSPITALIZATION', label: 'Hospitalización' },
    { value: 'EMERGENCY_CARE', label: 'Atención de Emergencia' },
    { value: 'EUTHANASIA', label: 'Eutanasia' },
    { value: 'OTHER', label: 'Otros' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    {...form.register('name')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Ej: Consulta General, Radiografía, Cirugía..."
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    {...form.register('category')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {serviceCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register('price', { valueAsNumber: true })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0.00"
                    />
                  </div>
                  {form.formState.errors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    {...form.register('duration', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="30"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Opcional. Útil para programación de citas.
                  </p>
                  {form.formState.errors.duration && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.duration.message}
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    {...form.register('description')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Describe brevemente el servicio..."
                  />
                  {form.formState.errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                {/* Estado activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...form.register('isActive')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Servicio activo
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Servicio'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 