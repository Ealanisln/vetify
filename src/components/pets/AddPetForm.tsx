'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export function AddPetForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
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
    customerId: '',
  });

  // Datos para nuevo cliente
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    preferredContactMethod: 'phone',
    notes: '',
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let customerId = formData.customerId;

      // Si se está creando un nuevo cliente
      if (showNewCustomerForm) {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomerData),
        });

        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();
          throw new Error(errorData.message || 'Error creating customer');
        }

        const newCustomer = await customerResponse.json();
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error('Debe seleccionar o crear un cliente');
      }

      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerId,
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
        alert('¡Mascota registrada exitosamente!\n\nNota: Para activar WhatsApp automático, asegúrate de que el cliente tenga un número de teléfono registrado.');
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

  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
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

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección de Cliente/Dueño */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-4">
          👤 Información del Dueño
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowNewCustomerForm(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showNewCustomerForm 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-600'
              }`}
            >
              Seleccionar Cliente Existente
            </button>
            <button
              type="button"
              onClick={() => setShowNewCustomerForm(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showNewCustomerForm 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-600'
              }`}
            >
              Crear Nuevo Cliente
            </button>
          </div>

          {!showNewCustomerForm ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              {loadingCustomers ? (
                <div className="text-sm text-gray-500">Cargando clientes...</div>
              ) : (
                <select
                  name="customerId"
                  required
                  value={formData.customerId}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Selecciona un cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </option>
                  ))}
                </select>
              )}
              
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-sm text-gray-600">📞 {selectedCustomer.phone}</p>
                  )}
                  {selectedCustomer.email && (
                    <p className="text-sm text-gray-600">✉️ {selectedCustomer.email}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={newCustomerData.name}
                  onChange={handleNewCustomerChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newCustomerData.phone}
                  onChange={handleNewCustomerChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: +52 55 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={newCustomerData.email}
                  onChange={handleNewCustomerChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: juan@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Método de Contacto Preferido
                </label>
                <select
                  name="preferredContactMethod"
                  value={newCustomerData.preferredContactMethod}
                  onChange={handleNewCustomerChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                <textarea
                  name="address"
                  rows={2}
                  value={newCustomerData.address}
                  onChange={handleNewCustomerChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Mascota */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-green-900 mb-4">
          🐾 Información de la Mascota
        </h3>
        
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
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Mascota'}
        </button>
      </div>
    </form>
  );
} 