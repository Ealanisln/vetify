'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getThemeClasses } from '../../utils/theme-colors';

import { 
  MagnifyingGlassIcon,
  HeartIcon,
  UserIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { mapSpeciesToSpanish } from '@/lib/utils/pet-enum-mapping';

interface NewMedicalHistoryFormProps {
  tenantId: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
}

interface MedicalHistoryFormData {
  petId: string;
  visitDate: string;
  reasonForVisit: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  prescriptions: Array<{
    productId: string;
    productName: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
}

export function NewMedicalHistoryForm({ }: NewMedicalHistoryFormProps) {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<MedicalHistoryFormData>({
    petId: '',
    visitDate: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    reasonForVisit: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    prescriptions: []
  });

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pets?search=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setPets(data.pets || data);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchPets();
    } else {
      setPets([]);
    }
  }, [searchQuery, fetchPets]);

  const selectPet = (pet: Pet) => {
    setSelectedPet(pet);
    setFormData(prev => ({ ...prev, petId: pet.id }));
    setSearchQuery('');
    setPets([]);
  };

  const addPrescription = () => {
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, {
        productId: '',
        productName: '',
        quantity: 1,
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }]
    }));
  };

  const removePrescription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const updatePrescription = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((prescription, i) => 
        i === index ? { ...prescription, [field]: value } : prescription
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet || !formData.reasonForVisit) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/medical-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/medical-history');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear la historia clínica');
      }
    } catch (error) {
      console.error('Error creating medical history:', error);
      alert('Error al crear la historia clínica');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {/* Selección de mascota */}
      <Card className={`${getThemeClasses('background.card', 'border.card')}`}>
        <CardHeader>
          <CardTitle className={getThemeClasses('text.primary')}>Seleccionar Mascota</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPet ? (
            <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 ${getThemeClasses('background.accent')} bg-opacity-10 ${getThemeClasses('border.accent')} rounded-lg gap-3`}>
              <div className="flex items-center gap-3">
                <HeartIcon className="h-5 w-5 text-[#75a99c] dark:text-[#9ed3c4]" />
                <div>
                  <h3 className={`font-medium ${getThemeClasses('text.primary')}`}>
                    {selectedPet.name} ({mapSpeciesToSpanish(selectedPet.species)})
                  </h3>
                  <div className={`flex items-center gap-2 text-sm ${getThemeClasses('text.secondary')}`}>
                    <UserIcon className="h-3 w-3" />
                    <span>{selectedPet.customer.name}</span>
                    {selectedPet.customer.phone && (
                      <span>• {selectedPet.customer.phone}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPet(null);
                  setFormData(prev => ({ ...prev, petId: '' }));
                }}
                className="shrink-0"
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${getThemeClasses('text.tertiary')}`} />
                <input
                  type="text"
                  placeholder="Buscar mascota por nombre o cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}
              
              {pets.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => selectPet(pet)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <HeartIcon className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {pet.name} ({mapSpeciesToSpanish(pet.species)})
                          </div>
                          <div className="text-sm text-gray-600">
                            {pet.customer.name}
                            {pet.customer.phone && ` • ${pet.customer.phone}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de la consulta */}
      {selectedPet && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Información de la Consulta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y Hora de Consulta *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.visitDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Consulta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Control rutinario, vacunación, consulta por síntomas..."
                  value={formData.reasonForVisit}
                  onChange={(e) => setFormData(prev => ({ ...prev, reasonForVisit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico
                </label>
                <input
                  type="text"
                  placeholder="Diagnóstico médico..."
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tratamiento
                </label>
                <textarea
                  rows={3}
                  placeholder="Descripción del tratamiento aplicado o recomendado..."
                  value={formData.treatment}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  rows={3}
                  placeholder="Observaciones, recomendaciones, próximas citas..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescripciones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prescripciones</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPrescription}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar Medicamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.prescriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay prescripciones agregadas
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.prescriptions.map((prescription, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Medicamento {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePrescription(index)}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Medicamento
                          </label>
                          <input
                            type="text"
                            placeholder="Nombre del medicamento"
                            value={prescription.productName}
                            onChange={(e) => updatePrescription(index, 'productName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={prescription.quantity}
                            onChange={(e) => updatePrescription(index, 'quantity', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dosis
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: 1 tableta, 5ml"
                            value={prescription.dosage}
                            onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frecuencia
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: Cada 8 horas, 2 veces al día"
                            value={prescription.frequency}
                            onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: 7 días, 2 semanas"
                            value={prescription.duration}
                            onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instrucciones
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: Con alimento, en ayunas"
                            value={prescription.instructions}
                            onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedPet || !formData.reasonForVisit}
            >
              {submitting ? 'Guardando...' : 'Guardar Consulta'}
            </Button>
          </div>
        </>
      )}
    </form>
  );
} 