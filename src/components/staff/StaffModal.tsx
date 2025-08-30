'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    appointments: number;
    medicalHistories: number;
    medicalOrders: number;
    Sale: number;
  };
}

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  staff?: StaffMember | null;
  onStaffSaved: () => void;
}

interface FormData {
  name: string;
  position: string;
  email: string;
  phone: string;
  licenseNumber: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  position: '',
  email: '',
  phone: '',
  licenseNumber: '',
  isActive: true,
};

export default function StaffModal({ isOpen, onClose, mode, staff, onStaffSaved }: StaffModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && staff && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: staff.name,
        position: staff.position,
        email: staff.email || '',
        phone: staff.phone || '',
        licenseNumber: staff.licenseNumber || '',
        isActive: staff.isActive,
      });
    } else if (isOpen && mode === 'create') {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [isOpen, staff, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'La posición es requerida';
    } else if (formData.position.trim().length < 2) {
      newErrors.position = 'La posición debe tener al menos 2 caracteres';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        licenseNumber: formData.licenseNumber.trim() || undefined,
      };

      const url = mode === 'create' ? '/api/staff' : `/api/staff/${staff?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(mode === 'create' ? 'Personal agregado exitosamente' : 'Personal actualizado exitosamente');
        onStaffSaved();
      } else {
        toast.error(data.message || 'Error al guardar personal');
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Agregar Personal';
      case 'edit': return 'Editar Personal';
      case 'view': return 'Detalles del Personal';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'view' ? (
            <div className="space-y-6">
              {/* View Mode - Staff Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre completo
                  </label>
                  <div className="text-lg font-semibold">{staff?.name}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Posición
                  </label>
                  <div className="text-lg">{staff?.position}</div>
                </div>

                {staff?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <div>{staff.email}</div>
                  </div>
                )}

                {staff?.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono
                    </label>
                    <div>{staff.phone}</div>
                  </div>
                )}

                {staff?.licenseNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número de Licencia
                    </label>
                    <div>{staff.licenseNumber}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <Badge variant={staff?.isActive ? "default" : "secondary"}>
                    {staff?.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de registro
                  </label>
                  <div>{staff && format(new Date(staff.createdAt), 'd MMMM yyyy', { locale: es })}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Última actualización
                  </label>
                  <div>{staff && format(new Date(staff.updatedAt), 'd MMMM yyyy', { locale: es })}</div>
                </div>
              </div>

              {/* Activity Summary */}
              {staff?._count && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Resumen de Actividad</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {staff._count.appointments}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Citas</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {staff._count.medicalHistories}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Historiales</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {staff._count.medicalOrders}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Órdenes</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {staff._count.Sale}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Ventas</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Form Mode - Create/Edit */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Dr. Juan Pérez"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Posición *
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 ${
                      errors.position ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Veterinario, Asistente, Recepcionista"
                  />
                  {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="555-1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Licencia
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Número de cédula profesional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.isActive.toString()}
                    onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {mode === 'create' ? 'Agregar Personal' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 