'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddPetForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    dateOfBirth: '',
    gender: 'male',
    weight: '',
    weightUnit: 'kg',
    microchipNumber: '',
    isNeutered: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dateOfBirth: new Date(formData.dateOfBirth),
          weight: formData.weight ? Number(formData.weight) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating pet');
      }

      const result = await response.json();
      
      // Show success message with WhatsApp automation info
      if (result.automationTriggered) {
        alert('¡Mascota registrada! 🎉\n\nSe ha enviado un WhatsApp automático al dueño.');
      } else {
        alert('¡Mascota registrada exitosamente!\n\nNota: Para activar WhatsApp automático, asegúrate de que el usuario tenga un número de teléfono registrado.');
      }

      router.push('/dashboard/pets');
      router.refresh();
    } catch (error) {
      console.error('Error creating pet:', error);
      alert(error instanceof Error ? error.message : 'Error creating pet');
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

  const getSpeciesEmoji = (species: string) => {
    const emojis = {
      'dog': '🐕',
      'cat': '🐱',
      'bird': '🐦',
      'rabbit': '🐰',
      'other': '🐾'
    };
    return emojis[species as keyof typeof emojis] || '🐾';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            placeholder="Ej: Firulais"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Especie *
          </label>
          <select
            name="species"
            value={formData.species}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="bird">Ave</option>
            <option value="rabbit">Conejo</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Raza
          </label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            placeholder="Ej: Labrador"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Género *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha de nacimiento *
          </label>
          <input
            type="date"
            name="dateOfBirth"
            required
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
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
              className="block w-full rounded-l-md border-gray-300 focus:border-green-500 focus:ring-green-500"
              placeholder="0.0"
            />
            <select
              name="weightUnit"
              value={formData.weightUnit}
              onChange={handleChange}
              className="rounded-r-md border-l-0 border-gray-300 bg-gray-50 text-gray-500 focus:border-green-500 focus:ring-green-500"
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Número de microchip
          </label>
          <input
            type="text"
            name="microchipNumber"
            value={formData.microchipNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            placeholder="Ej: 123456789012345"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isNeutered"
              checked={formData.isNeutered}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Está esterilizado/castrado
            </label>
          </div>
        </div>
      </div>

      {/* WhatsApp Integration Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-green-500 text-xl mr-3">💬</span>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-900">
              WhatsApp Automático Incluido
            </h4>
            <p className="text-sm text-green-700 mt-1">
              Al registrar la mascota, se enviará automáticamente un mensaje de bienvenida al dueño.
            </p>
            <button
              type="button"
              onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
              className="text-xs text-green-600 hover:text-green-800 mt-2 underline"
            >
              {showWhatsAppPreview ? 'Ocultar' : 'Ver'} vista previa del mensaje
            </button>
          </div>
        </div>
        
        {showWhatsAppPreview && (
          <div className="mt-4 p-3 bg-white rounded border border-green-300">
            <div className="text-xs text-gray-500 mb-2">Vista previa del WhatsApp:</div>
            <div className="text-sm bg-green-100 p-3 rounded-lg font-mono whitespace-pre-line">
              🎉 ¡Bienvenido a Tu Clínica!

              {getSpeciesEmoji(formData.species)} <strong>{formData.name || '[Nombre]'}</strong> ya está registrado en nuestro sistema Vetify.

              ✅ Recibirás recordatorios automáticos de vacunas
              ✅ Historial médico digitalizado
              ✅ Comunicación directa con el veterinario

              ¿Alguna pregunta? Solo responde a este mensaje.

              <em>Mensaje automático de Vetify CRM</em>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando...
            </>
          ) : (
            <>
              <span className="mr-2">🚀</span>
              Registrar Mascota
            </>
          )}
        </button>
      </div>
    </form>
  );
} 