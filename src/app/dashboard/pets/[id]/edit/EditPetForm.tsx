'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pet, Customer } from '@prisma/client';
import { getThemeClasses } from '@/utils/theme-colors';
import { PetProfileImage } from '@/components/pets/PetProfileImage';

// Serialized types for client component (Decimal -> number, Date -> string)
type SerializedCustomer = Omit<Customer, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type SerializedPet = Omit<Pet, 'weight' | 'dateOfBirth' | 'createdAt' | 'updatedAt'> & {
  weight: number | null;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
};

export type SerializedPetWithCustomer = SerializedPet & { customer: SerializedCustomer };

interface EditPetFormProps {
  pet: SerializedPetWithCustomer;
}

export function EditPetForm({ pet }: EditPetFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoSectionRef = useRef<HTMLDivElement>(null);

  // Scroll to photo section if URL has #photo hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#photo') {
      photoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  const [formData, setFormData] = useState({
    name: pet.name,
    species: pet.species,
    breed: pet.breed || '',
    dateOfBirth: pet.dateOfBirth.split('T')[0],
    gender: pet.gender,
    weight: pet.weight !== null ? String(pet.weight) : '',
    weightUnit: pet.weightUnit || 'kg',
    microchipNumber: pet.microchipNumber || '',
    isNeutered: pet.isNeutered,
    isDeceased: pet.isDeceased,
    internalId: pet.internalId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pets/${pet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: formData.weight ? Number(formData.weight) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating pet');
      }

      router.push(`/dashboard/pets/${pet.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating pet:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar mascota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pet Info */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-4">
          Informacion de la Mascota
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ID Interno
            </label>
            <input
              type="text"
              name="internalId"
              value={formData.internalId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Ej: PET-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Especie *
            </label>
            <select
              name="species"
              value={formData.species}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="dog">Perro</option>
              <option value="cat">Gato</option>
              <option value="bird">Ave</option>
              <option value="rabbit">Conejo</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Raza
            </label>
            <input
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Genero *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="male">Macho</option>
              <option value="female">Hembra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de nacimiento *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              required
              max={new Date().toISOString().split('T')[0]}
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Peso
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                name="weight"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={handleChange}
                className="block w-full rounded-l-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-green-500"
              />
              <select
                name="weightUnit"
                value={formData.weightUnit}
                onChange={handleChange}
                className="rounded-r-md border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300 focus:border-green-500 focus:ring-green-500"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Numero de microchip
            </label>
            <input
              type="text"
              name="microchipNumber"
              value={formData.microchipNumber}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isNeutered"
                checked={formData.isNeutered}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                Esta esterilizado/castrado
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isDeceased"
                checked={formData.isDeceased}
                onChange={handleChange}
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                Fallecido
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Photo & Owner Info Section */}
      <div className={`rounded-xl border ${getThemeClasses('background.card', 'border.card')} overflow-hidden`}>
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-stretch">
          {/* Photo Column */}
          <div
            ref={photoSectionRef}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/30 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700"
          >
            <div className="w-[160px]">
              <PetProfileImage
                petId={pet.id}
                currentImage={pet.profileImage}
                petName={pet.name}
                size="md"
                showDescription={false}
                onUpdate={() => router.refresh()}
              />
            </div>
          </div>

          {/* Owner Info Column */}
          <div className="p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#75a99c] rounded-full" />
              <h3 className={`text-base font-semibold ${getThemeClasses('text.primary')}`}>
                Informacion del Dueno
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#75a99c]/10 dark:bg-[#75a99c]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-[#5b9788] dark:text-[#75a99c]">
                    {pet.customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className={`font-medium ${getThemeClasses('text.primary')} truncate`}>
                    {pet.customer.name}
                  </p>
                </div>
              </div>
              {(pet.customer.phone || pet.customer.email) && (
                <div className="pl-12 space-y-1">
                  {pet.customer.phone && (
                    <p className={`text-sm ${getThemeClasses('text.secondary')} flex items-center gap-2`}>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{pet.customer.phone}</span>
                    </p>
                  )}
                  {pet.customer.email && (
                    <p className={`text-sm ${getThemeClasses('text.secondary')} flex items-center gap-2`}>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{pet.customer.email}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}
