'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { PlusIcon, TrashIcon, CheckCircleIcon, CalendarIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getThemeClasses } from '../../utils/theme-colors';
import { mapSpeciesToEnglish, mapGenderToEnglish } from '@/lib/utils/pet-enum-mapping';
import { type PetCreationResponse, type CustomerCreationResponse } from '@/types/api';
import LocationSelector from '@/components/locations/LocationSelector';
import { toast } from 'sonner';

interface NewCustomerFormProps {
  tenantId: string;
}

interface PetFormData {
  name: string;
  species: string;
  breed: string;
  dateOfBirth: string;
  gender: string;
  weight?: string;
  weightUnit: string;
  microchipNumber?: string;
  isNeutered: boolean;
}

interface CustomerFormData {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  preferredContactMethod: string;
  notes?: string;
  pets: PetFormData[];
}

export function NewCustomerForm({ tenantId }: NewCustomerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false); // Prevent double submit
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [createdPets, setCreatedPets] = useState<Array<{ id: string; name: string }>>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    preferredContactMethod: 'phone',
    notes: '',
    pets: []
  });

  const addPet = () => {
    setFormData(prev => ({
      ...prev,
      pets: [
        ...prev.pets,
        {
          name: '',
          species: 'Perro',
          breed: '',
          dateOfBirth: '',
          gender: 'Macho',
          weight: '',
          weightUnit: 'kg',
          microchipNumber: '',
          isNeutered: false
        }
      ]
    }));
  };

  const removePet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pets: prev.pets.filter((_, i) => i !== index)
    }));
  };

  const updatePet = (index: number, petData: Partial<PetFormData>) => {
    setFormData(prev => ({
      ...prev,
      pets: prev.pets.map((pet, i) => 
        i === index ? { ...pet, ...petData } : pet
      )
    }));
  };

  const updateCustomer = (customerData: Partial<CustomerFormData>) => {
    setFormData(prev => ({ ...prev, ...customerData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submit
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      // Create customer
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pets: undefined, // Remove pets from customer data
          tenantId,
          locationId: locationId || null
        })
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.message || 'Error al crear cliente');
      }

      const customer: CustomerCreationResponse = await customerResponse.json();
      setCreatedCustomerId(customer.id);

      // Create pets if any
      const petsCreated: Array<{ id: string; name: string }> = [];
      if (formData.pets.length > 0) {
        for (const pet of formData.pets) {
          const petResponse = await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...pet,
              species: mapSpeciesToEnglish(pet.species),
              gender: mapGenderToEnglish(pet.gender),
              customerId: customer.id,
              tenantId,
              locationId: locationId || null,
              weight: pet.weight ? parseFloat(pet.weight) : undefined,
              dateOfBirth: pet.dateOfBirth // Send as YYYY-MM-DD string directly
            })
          });

          if (petResponse.ok) {
            const petCreationResponse: PetCreationResponse = await petResponse.json();
            petsCreated.push({
              id: petCreationResponse.pet.id,
              name: petCreationResponse.pet.name
            });
          } else {
            // Log pet creation failure but continue with customer creation
            console.error(`Failed to create pet: ${pet.name}`, await petResponse.text());
          }
        }
      }

      setCreatedPets(petsCreated);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el cliente. Inténtalo de nuevo.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleCreateAppointment = () => {
    const params = new URLSearchParams({ customerId: createdCustomerId || '' });
    if (createdPets.length > 0) {
      params.append('petId', createdPets[0].id);
    }
    router.push(`/dashboard/appointments/new?${params.toString()}`);
  };

  const handleViewCustomers = () => {
    router.push('/dashboard/customers');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
      {/* Customer Information */}
      <div className={`card p-4 md:p-6 ${getThemeClasses('background.card', 'border.card')}`}>
        <h3 className={`text-base md:text-lg font-medium ${getThemeClasses('text.primary')} mb-4`}>
          Información del Cliente
        </h3>
        
        <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
          <div>
            <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => updateCustomer({ name: e.target.value })}
              className="form-input mt-1"
              data-testid="customer-name-input"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateCustomer({ email: e.target.value })}
              className="form-input mt-1"
              data-testid="customer-email-input"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateCustomer({ phone: e.target.value })}
              className="form-input mt-1"
              data-testid="customer-phone-input"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
              Método de Contacto Preferido
            </label>
            <select
              value={formData.preferredContactMethod}
              onChange={(e) => updateCustomer({ preferredContactMethod: e.target.value })}
              className="form-input mt-1"
            >
              <option value="phone">Teléfono</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateCustomer({ address: e.target.value })}
              className="form-input mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <LocationSelector
              value={locationId}
              onChange={setLocationId}
              defaultToPrimary={true}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
              Notas
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => updateCustomer({ notes: e.target.value })}
              className="form-input mt-1"
            />
          </div>
        </div>
      </div>

      {/* Pets Section */}
      <div className={`card p-4 md:p-6 ${getThemeClasses('background.card', 'border.card')}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className={`text-base md:text-lg font-medium ${getThemeClasses('text.primary')}`}>
            Mascotas del Cliente
          </h3>
          <Button
            type="button"
            onClick={addPet}
            variant="outline"
            className="inline-flex items-center"
            data-testid="add-pet-button"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Agregar Mascota</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </div>

        {formData.pets.length === 0 ? (
          <div className={`text-center py-8 ${getThemeClasses('text.tertiary')}`}>
            <div className="text-4xl mb-2">🐕</div>
            <p>No hay mascotas agregadas</p>
            <p className="text-sm">Puedes agregar mascotas después de crear el cliente</p>
          </div>
        ) : (
          <div className="space-y-6">
            {formData.pets.map((pet, index) => (
              <div key={index} className={`card p-4 ${getThemeClasses('background.muted', 'border.card')}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-md font-medium ${getThemeClasses('text.primary')}`}>
                    Mascota #{index + 1}
                  </h4>
                  <Button
                    type="button"
                    onClick={() => removePet(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={pet.name}
                      onChange={(e) => updatePet(index, { name: e.target.value })}
                      className="form-input mt-1"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Especie *
                    </label>
                    <select
                      required
                      value={pet.species}
                      onChange={(e) => updatePet(index, { species: e.target.value })}
                      className="form-input mt-1"
                    >
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Ave">Ave</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Reptil">Reptil</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Raza *
                    </label>
                    <input
                      type="text"
                      required
                      value={pet.breed}
                      onChange={(e) => updatePet(index, { breed: e.target.value })}
                      className="form-input mt-1"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      required
                      value={pet.dateOfBirth}
                      onChange={(e) => updatePet(index, { dateOfBirth: e.target.value })}
                      className="form-input mt-1"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Género *
                    </label>
                    <select
                      required
                      value={pet.gender}
                      onChange={(e) => updatePet(index, { gender: e.target.value })}
                      className="form-input mt-1"
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Peso
                    </label>
                    <div className="flex mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={pet.weight}
                        onChange={(e) => updatePet(index, { weight: e.target.value })}
                        className="form-input rounded-r-none border-r-0"
                      />
                      <select
                        value={pet.weightUnit}
                        onChange={(e) => updatePet(index, { weightUnit: e.target.value })}
                        className="form-input rounded-l-none border-l-0 w-20"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Microchip
                    </label>
                    <input
                      type="text"
                      value={pet.microchipNumber}
                      onChange={(e) => updatePet(index, { microchipNumber: e.target.value })}
                      className="form-input mt-1"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pet.isNeutered}
                      onChange={(e) => updatePet(index, { isNeutered: e.target.checked })}
                      className="h-4 w-4 text-[#75a99c] border-gray-300 rounded focus:ring-[#75a99c]"
                    />
                    <label className={`ml-2 text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                      Esterilizado/Castrado
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="order-2 sm:order-1"
          data-testid="cancel-customer-button"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="order-1 sm:order-2"
          data-testid="submit-customer-button"
        >
          {isLoading ? 'Guardando...' : 'Crear Cliente'}
        </Button>
      </div>

      {/* Success Modal */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">¡Cliente creado exitosamente!</h2>
              <button
                onClick={handleViewCustomers}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                  <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-foreground">
                    El cliente <strong>{formData.name}</strong> ha sido registrado en el sistema.
                  </p>
                  {createdPets.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {createdPets.length === 1 
                        ? `Se agregó la mascota: ${createdPets[0].name}`
                        : `Se agregaron ${createdPets.length} mascotas: ${createdPets.map(p => p.name).join(', ')}`
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-center font-medium text-foreground">
                  ¿Qué deseas hacer ahora?
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={handleCreateAppointment}
                    className="w-full flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    Crear Cita para {createdPets.length > 0 ? createdPets[0].name : 'este cliente'}
                  </Button>
                  
                  <Button
                    onClick={handleViewCustomers}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <UserGroupIcon className="h-5 w-5" />
                    Ver Lista de Clientes
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Puedes crear citas en cualquier momento desde la lista de clientes
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 