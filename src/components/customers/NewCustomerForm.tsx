'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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
    setIsLoading(true);

    try {
      // Create customer
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pets: undefined, // Remove pets from customer data
          tenantId
        })
      });

      if (!customerResponse.ok) {
        throw new Error('Error al crear cliente');
      }

      const customer = await customerResponse.json();

      // Create pets if any
      if (formData.pets.length > 0) {
        for (const pet of formData.pets) {
          await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...pet,
              customerId: customer.id,
              tenantId,
              weight: pet.weight ? parseFloat(pet.weight) : undefined,
              dateOfBirth: new Date(pet.dateOfBirth).toISOString()
            })
          });
        }
      }

      router.push('/dashboard/customers');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el cliente. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Customer Information */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información del Cliente
          </h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateCustomer({ name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateCustomer({ email: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateCustomer({ phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Método de Contacto Preferido
              </label>
              <select
                value={formData.preferredContactMethod}
                onChange={(e) => updateCustomer({ preferredContactMethod: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="phone">Teléfono</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateCustomer({ address: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Notas
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => updateCustomer({ notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pets Section */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mascotas del Cliente
            </h3>
            <Button
              type="button"
              onClick={addPet}
              variant="outline"
              className="inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Mascota
            </Button>
          </div>

          {formData.pets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🐕</div>
              <p>No hay mascotas agregadas</p>
              <p className="text-sm">Puedes agregar mascotas después de crear el cliente</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.pets.map((pet, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">
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
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={pet.name}
                        onChange={(e) => updatePet(index, { name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Especie *
                      </label>
                      <select
                        required
                        value={pet.species}
                        onChange={(e) => updatePet(index, { species: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700">
                        Raza *
                      </label>
                      <input
                        type="text"
                        required
                        value={pet.breed}
                        onChange={(e) => updatePet(index, { breed: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        required
                        value={pet.dateOfBirth}
                        onChange={(e) => updatePet(index, { dateOfBirth: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Género *
                      </label>
                      <select
                        required
                        value={pet.gender}
                        onChange={(e) => updatePet(index, { gender: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Peso
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          step="0.1"
                          value={pet.weight}
                          onChange={(e) => updatePet(index, { weight: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <select
                          value={pet.weightUnit}
                          onChange={(e) => updatePet(index, { weightUnit: e.target.value })}
                          className="mt-1 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="lb">lb</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Microchip
                      </label>
                      <input
                        type="text"
                        value={pet.microchipNumber}
                        onChange={(e) => updatePet(index, { microchipNumber: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pet.isNeutered}
                        onChange={(e) => updatePet(index, { isNeutered: e.target.checked })}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Esterilizado/Castrado
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  );
} 