'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { 
  PencilIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  MapPinIcon,
  UserIcon,
  ArchiveBoxIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { getThemeClasses } from '../../utils/theme-colors';
import Link from 'next/link';
import { toast } from 'sonner';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  dateOfBirth: string;
  gender: string;
  isDeceased: boolean;
}

interface Appointment {
  id: string;
  dateTime: string;
  reason: string;
  status: string;
  pet: {
    id: string;
    name: string;
  };
  staff?: {
    name: string;
  };
}

interface Sale {
  id: string;
  total: number;
  createdAt: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  preferredContactMethod?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  pets?: Pet[];
  appointments?: Appointment[];
  sales?: Sale[];
}

interface CustomerDetailProps {
  customer: Customer;
  onUpdate: (updatedCustomer: Customer) => void;
  onArchive: () => void;
  initialEditMode?: boolean;
}

export function CustomerDetail({ customer, onUpdate, onArchive, initialEditMode = false }: CustomerDetailProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: customer.name || '',
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    preferredContactMethod: customer.preferredContactMethod || 'phone',
    notes: customer.notes || '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar cliente');
      }

      const updatedCustomer = await response.json();
      onUpdate(updatedCustomer);
      setIsEditing(false);
      toast.success('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Error al actualizar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('¿Estás seguro de que quieres archivar este cliente? No aparecerá en la lista principal pero se mantendrá en el historial.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al archivar cliente');
      }

      toast.success('Cliente archivado exitosamente');
      onArchive();
    } catch (error) {
      console.error('Error archiving customer:', error);
      toast.error('Error al archivar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: customer.name || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      preferredContactMethod: customer.preferredContactMethod || 'phone',
      notes: customer.notes || '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6" data-testid="customer-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${getThemeClasses('text.primary')}`}>
            {customer.name}
          </h1>
          <p className={`${getThemeClasses('text.muted')}`}>
            Cliente desde {formatDate(customer.createdAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="inline-flex items-center"
                data-testid="edit-customer-button"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={handleArchive}
                variant="outline"
                disabled={isLoading}
                className="inline-flex items-center text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                data-testid="archive-customer-button"
              >
                <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                Archivar
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="inline-flex items-center"
                data-testid="save-customer-button"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isLoading}
                className="inline-flex items-center"
                data-testid="cancel-edit-button"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2">
          <Card className={`p-6 ${getThemeClasses('card.background')}`}>
            <h2 className={`text-lg font-semibold mb-4 ${getThemeClasses('text.primary')}`}>
              Información del Cliente
            </h2>
            
            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                      Nombre Completo
                    </label>
                    <div className={`flex items-center ${getThemeClasses('text.primary')}`}>
                      <UserIcon className="h-4 w-4 mr-2" />
                      {customer.name}
                    </div>
                  </div>
                  
                  {customer.phone && (
                    <div>
                      <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                        Teléfono
                      </label>
                      <div className={`flex items-center ${getThemeClasses('text.primary')}`}>
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        {customer.phone}
                      </div>
                    </div>
                  )}
                  
                  {customer.email && (
                    <div>
                      <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                        Email
                      </label>
                      <div className={`flex items-center ${getThemeClasses('text.primary')}`}>
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        {customer.email}
                      </div>
                    </div>
                  )}
                  
                  {customer.address && (
                    <div>
                      <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                        Dirección
                      </label>
                      <div className={`flex items-center ${getThemeClasses('text.primary')}`}>
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        {customer.address}
                      </div>
                    </div>
                  )}
                </div>
                
                {customer.notes && (
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                      Notas
                    </label>
                    <p className={`${getThemeClasses('text.primary')} bg-gray-50 dark:bg-gray-800 p-3 rounded`}>
                      {customer.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className={`${getThemeClasses('input.base')} block w-full px-3 py-2 border rounded-md`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className={`${getThemeClasses('input.base')} block w-full px-3 py-2 border rounded-md`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className={`${getThemeClasses('input.base')} block w-full px-3 py-2 border rounded-md`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                      Método de Contacto
                    </label>
                    <select
                      value={editData.preferredContactMethod}
                      onChange={(e) => setEditData({ ...editData, preferredContactMethod: e.target.value })}
                      className={`${getThemeClasses('input.base')} block w-full px-3 py-2 border rounded-md`}
                    >
                      <option value="phone">Teléfono</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className={`${getThemeClasses('input.base')} block w-full px-3 py-2 border rounded-md`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                    Notas
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={3}
                    className={`${getThemeClasses('input.base')} block w-full px-3 py-2 border rounded-md`}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Pets Summary */}
          <Card className={`p-6 ${getThemeClasses('card.background')}`}>
            <h3 className={`text-lg font-semibold mb-4 ${getThemeClasses('text.primary')}`}>
              Mascotas
            </h3>
            {customer.pets && customer.pets.length > 0 ? (
              <div className="space-y-3">
                {customer.pets.map((pet) => (
                  <Link
                    key={pet.id}
                    href={`/dashboard/pets/${pet.id}`}
                    className={`block p-3 rounded-lg border ${getThemeClasses('border.primary')} ${getThemeClasses('hover.card')} transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${getThemeClasses('text.primary')}`}>
                          {pet.name}
                        </p>
                        <p className={`text-sm ${getThemeClasses('text.secondary')}`}>
                          {pet.species} • {pet.breed}
                        </p>
                      </div>
                      {pet.isDeceased && (
                        <HeartIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${getThemeClasses('text.muted')}`}>
                Sin mascotas registradas
              </p>
            )}
            <Link href={`/dashboard/pets/new?customerId=${customer.id}`}>
              <Button variant="outline" className="w-full mt-4" data-testid="add-pet-to-customer-button">
                Agregar Mascota
              </Button>
            </Link>
          </Card>

          {/* Recent Appointments */}
          <Card className={`p-6 ${getThemeClasses('card.background')}`}>
            <h3 className={`text-lg font-semibold mb-4 ${getThemeClasses('text.primary')}`}>
              Citas Recientes
            </h3>
            {customer.appointments && customer.appointments.length > 0 ? (
              <div className="space-y-3">
                {customer.appointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`p-3 rounded-lg border ${getThemeClasses('border.primary')}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${getThemeClasses('text.primary')}`}>
                        {appointment.pet.name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className={`text-sm ${getThemeClasses('text.secondary')}`}>
                      {appointment.reason}
                    </p>
                    <div className={`flex items-center text-xs ${getThemeClasses('text.muted')} mt-1`}>
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatDate(appointment.dateTime)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${getThemeClasses('text.muted')}`}>
                Sin citas registradas
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 