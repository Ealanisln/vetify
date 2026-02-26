'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Merge, 
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Clock
} from 'lucide-react';
import { mapSpeciesToSpanish } from '@/lib/utils/pet-enum-mapping';

interface CustomerDuplicate {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string;
  createdAt: string;
  pets: Array<{
    id: string;
    name: string;
    species: string;
    breed?: string;
  }>;
  similarCustomers: Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    pets: Array<{
      id: string;
      name: string;
      species: string;
    }>;
    appointments: Array<{
      id: string;
      dateTime: string;
      status: string;
    }>;
  }>;
  latestRequest: {
    id: string;
    petName: string;
    service: string | null;
    notes: string | null;
    createdAt: string;
  } | null;
  totalSimilar: number;
}

interface DuplicatesStats {
  totalNeedingReview: number;
  totalSimilarCustomers: number;
  avgSimilarityScore: number;
}

interface ApiResponse {
  customers: CustomerDuplicate[];
  stats: DuplicatesStats;
}

export function DuplicateCustomersManager() {
  const [duplicates, setDuplicates] = useState<CustomerDuplicate[]>([]);
  const [stats, setStats] = useState<DuplicatesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuplicate, setSelectedDuplicate] = useState<CustomerDuplicate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/customers/duplicates');
      const data: ApiResponse = await response.json();
      
      if (data.customers) {
        setDuplicates(data.customers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsNotDuplicate = async (customerId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/admin/customers/resolve-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          action: 'not_duplicate',
          notes: notes || undefined
        })
      });

      if (response.ok) {
        await fetchDuplicates();
        setNotes('');
        setSelectedDuplicate(null);
      }
    } catch (error) {
      console.error('Error marking as not duplicate:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMergeCustomers = async (primaryId: string, duplicateId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/admin/customers/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryId,
          duplicateId
        })
      });

      if (response.ok) {
        await fetchDuplicates();
        setSelectedDuplicate(null);
      }
    } catch (error) {
      console.error('Error merging customers:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-[#75a99c]" />
            Gestión de Duplicados
          </h2>
          <p className="text-gray-600 mt-1">
            Revisa y consolida clientes que podrían ser duplicados
          </p>
        </div>
        <Button onClick={fetchDuplicates} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalNeedingReview}</p>
                  <p className="text-sm text-gray-600">Necesitan revisión</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSimilarCustomers}</p>
                  <p className="text-sm text-gray-600">Posibles duplicados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgSimilarityScore.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Promedio similaridad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de duplicados */}
      {duplicates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Todo limpio!
            </h3>
            <p className="text-gray-600">
              No hay clientes duplicados que necesiten revisión.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((duplicate) => (
            <Card key={duplicate.id} className="border-l-4 border-l-orange-400">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {duplicate.name}
                      <Badge variant="secondary" className="ml-2">
                        {duplicate.totalSimilar} similares
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      {duplicate.phone && (
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {duplicate.phone}
                        </span>
                      )}
                      {duplicate.email && (
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {duplicate.email}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(duplicate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDuplicate(selectedDuplicate?.id === duplicate.id ? null : duplicate)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {selectedDuplicate?.id === duplicate.id && (
                <CardContent className="border-t">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cliente actual */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900">Cliente Actual</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Fuente:</strong> {duplicate.source}</p>
                        {duplicate.address && (
                          <p className="flex items-start">
                            <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                            {duplicate.address}
                          </p>
                        )}
                        {duplicate.pets.length > 0 && (
                          <div>
                            <p className="font-medium">Mascotas:</p>
                            <ul className="list-disc list-inside ml-2">
                              {duplicate.pets.map(pet => (
                                <li key={pet.id}>
                                  {pet.name} ({mapSpeciesToSpanish(pet.species)})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {duplicate.latestRequest && (
                          <div>
                            <p className="font-medium">Última solicitud:</p>
                            <p className="ml-2">
                              {duplicate.latestRequest.petName} - {duplicate.latestRequest.service || 'Consulta'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clientes similares */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900">Posibles Duplicados</h4>
                      <div className="space-y-3">
                        {duplicate.similarCustomers.map((similar) => (
                          <div key={similar.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium">{similar.name}</h5>
                              <Button
                                size="sm"
                                onClick={() => handleMergeCustomers(similar.id, duplicate.id)}
                                className="bg-[#75a99c] hover:bg-[#5b9788]"
                                disabled={isProcessing}
                              >
                                <Merge className="h-3 w-3 mr-1" />
                                Fusionar
                              </Button>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {similar.phone && <p>📞 {similar.phone}</p>}
                              {similar.email && <p>✉️ {similar.email}</p>}
                              {similar.pets.length > 0 && (
                                <p>🐾 {similar.pets.map(p => p.name).join(', ')}</p>
                              )}
                              {similar.appointments.length > 0 && (
                                <p>📅 {similar.appointments.length} citas anteriores</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-6 border-t pt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas (opcional)
                      </label>
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Agregar notas sobre esta revisión..."
                        value={notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleMarkAsNotDuplicate(duplicate.id)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Procesando...' : 'No es duplicado'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedDuplicate(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 