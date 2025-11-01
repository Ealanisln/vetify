'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  HeartIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { getThemeClasses } from '../../utils/theme-colors';

interface MedicalHistoryMainProps {
  tenantId: string;
}

interface MedicalHistoryEntry {
  id: string;
  visitDate: Date;
  reasonForVisit: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    customer: {
      name: string;
      phone?: string;
    };
  };
  medicalOrder?: {
    id: string;
    status: string;
    prescriptions: Array<{
      productName: string;
      quantity: number;
      dosage: string;
    }>;
  };
}

export function MedicalHistoryMain({ tenantId }: MedicalHistoryMainProps) {
  const [histories, setHistories] = useState<MedicalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '10',
        page: page.toString(),
        tenantId: tenantId
      });
      
      if (searchQuery) params.append('q', searchQuery);

      const response = await fetch(`/api/medical-history?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.histories) {
          setHistories(data.histories);
          setTotal(data.total);
        } else {
          setHistories(data);
        }
      }
    } catch (error) {
      console.error('Error fetching medical histories:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, searchQuery]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const getDiagnosisColor = (diagnosis?: string) => {
    if (!diagnosis) return 'secondary';
    const lower = diagnosis.toLowerCase();
    if (lower.includes('emergencia') || lower.includes('urgente')) return 'destructive';
    if (lower.includes('vacuna') || lower.includes('prevención')) return 'default';
    return 'secondary';
  };

  if (loading && histories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historias Clínicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className={`ml-3 ${getThemeClasses('text.primary')}`}>Cargando historias clínicas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y acciones */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5" />
              Historias Clínicas Recientes
            </CardTitle>
            <Link href="/dashboard/medical-history/new">
              <Button className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Nueva Consulta
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${getThemeClasses('text.muted')}`} />
              <input
                type="text"
                placeholder="Buscar por mascota, cliente, diagnóstico o tratamiento..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md ${getThemeClasses('input.base')} ${getThemeClasses('input.focus')}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de historias clínicas */}
      <Card>
        <CardContent className="p-0">
          {histories.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className={`h-12 w-12 ${getThemeClasses('text.muted')} mx-auto mb-3`} />
              <p className={`${getThemeClasses('text.secondary')} mb-4`}>
                {searchQuery ? 'No se encontraron historias clínicas' : 'No hay historias clínicas registradas'}
              </p>
              <Link href="/dashboard/medical-history/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Registrar Primera Consulta
                </Button>
              </Link>
            </div>
          ) : (
            <div className={`divide-y ${getThemeClasses('border.primary')}`}>
              {histories.map((history) => (
                <div key={history.id} className={`p-4 md:p-6 ${getThemeClasses('hover.card')} transition-colors`}>
                  {/* Mobile: Date at top, Desktop: Date on the right */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-0">
                    {/* Date - Mobile Top */}
                    <div className="flex items-center justify-between md:hidden mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="h-3 w-3" />
                        <span>
                          {format(new Date(history.visitDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header con mascota y cliente */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <HeartIcon className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {history.pet.name}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({history.pet.species})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <UserIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{history.pet.customer.name}</span>
                        </div>
                      </div>

                      {/* Motivo de consulta */}
                      <div className="mb-2">
                        <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {history.reasonForVisit}
                        </h3>
                        {history.diagnosis && (
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Diagnóstico:</span>
                            <Badge variant={getDiagnosisColor(history.diagnosis)} className="dark:border-gray-600">
                              {history.diagnosis}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Tratamiento */}
                      {history.treatment && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Tratamiento: </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{history.treatment}</span>
                        </div>
                      )}

                      {/* Prescripciones */}
                      {history.medicalOrder?.prescriptions && history.medicalOrder.prescriptions.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Prescripciones: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {history.medicalOrder.prescriptions.map((prescription, index) => (
                              <Badge key={index} variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                                {prescription.productName} ({prescription.quantity})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      {history.notes && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <strong>Notas:</strong> {history.notes}
                        </div>
                      )}
                    </div>

                    {/* Fecha y acciones - Desktop */}
                    <div className="hidden md:flex md:flex-col items-end gap-2 ml-4 flex-shrink-0">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        <CalendarIcon className="h-3 w-3" />
                        <span>
                          {format(new Date(history.visitDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/dashboard/pets/${history.pet.id}`}>
                          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                            Ver Mascota
                          </Button>
                        </Link>
                        <Link href={`/dashboard/medical-history/${history.id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            Ver Detalle
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Botones - Mobile Bottom */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 md:hidden">
                      <Link href={`/dashboard/pets/${history.pet.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                          Ver Mascota
                        </Button>
                      </Link>
                      <Link href={`/dashboard/medical-history/${history.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                          Ver Detalle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {total > 10 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className={`flex items-center px-4 text-sm ${getThemeClasses('text.secondary')}`}>
            Página {page} de {Math.ceil(total / 10)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 10)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
} 