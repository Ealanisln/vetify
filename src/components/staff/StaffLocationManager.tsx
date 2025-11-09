'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPinIcon, PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

interface StaffLocationAssignment {
  id: string;
  isPrimary: boolean;
  location: Location;
}

interface StaffLocationManagerProps {
  staffId: string;
  tenantId: string;
}

export function StaffLocationManager({ staffId, tenantId }: StaffLocationManagerProps) {
  const [assignments, setAssignments] = useState<StaffLocationAssignment[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/staff/${staffId}/locations`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching staff locations:', error);
      toast.error('Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  const fetchAvailableLocations = useCallback(async () => {
    try {
      const response = await fetch(`/api/locations?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableLocations(data);
      }
    } catch (error) {
      console.error('Error fetching available locations:', error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAssignments();
    fetchAvailableLocations();
  }, [fetchAssignments, fetchAvailableLocations]);

  const handleAddLocation = async () => {
    if (!selectedLocationId) {
      toast.error('Selecciona una ubicación');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          isPrimary: assignments.length === 0, // First location is primary by default
        }),
      });

      if (response.ok) {
        toast.success('Ubicación asignada');
        await fetchAssignments();
        setSelectedLocationId('');
        setShowAddForm(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al asignar ubicación');
      }
    } catch (error) {
      console.error('Error assigning location:', error);
      toast.error('Error al asignar ubicación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLocation = async (locationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${staffId}/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Ubicación eliminada');
        await fetchAssignments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar ubicación');
      }
    } catch (error) {
      console.error('Error removing location:', error);
      toast.error('Error al eliminar ubicación');
    }
  };

  const handleSetPrimary = async (locationId: string) => {
    try {
      const response = await fetch(`/api/staff/${staffId}/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPrimary: true,
        }),
      });

      if (response.ok) {
        toast.success('Ubicación principal actualizada');
        await fetchAssignments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar ubicación principal');
      }
    } catch (error) {
      console.error('Error setting primary location:', error);
      toast.error('Error al actualizar ubicación principal');
    }
  };

  const getUnassignedLocations = () => {
    const assignedLocationIds = assignments.map(a => a.location.id);
    return availableLocations.filter(loc => !assignedLocationIds.includes(loc.id));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5" />
            Ubicaciones Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unassignedLocations = getUnassignedLocations();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5" />
            Ubicaciones Asignadas
          </CardTitle>
          {unassignedLocations.length > 0 && !showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
              variant="outline"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Ubicación
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Location Form */}
        {showAddForm && (
          <div className="border border-border rounded-lg p-4 bg-muted/50 space-y-3">
            <h4 className="font-medium text-sm">Asignar Nueva Ubicación</h4>
            <div className="space-y-2">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="form-select"
                disabled={submitting}
              >
                <option value="">Seleccionar ubicación</option>
                {unassignedLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddLocation}
                disabled={!selectedLocationId || submitting}
                size="sm"
              >
                {submitting ? 'Asignando...' : 'Asignar'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedLocationId('');
                }}
                variant="outline"
                size="sm"
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Assigned Locations List */}
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPinIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay ubicaciones asignadas</p>
            <p className="text-sm mt-1">Asigna al menos una ubicación para este staff</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{assignment.location.name}</h4>
                      {assignment.isPrimary && (
                        <Badge variant="default" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                    {assignment.location.address && (
                      <p className="text-sm text-muted-foreground">
                        {assignment.location.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!assignment.isPrimary && (
                    <Button
                      onClick={() => handleSetPrimary(assignment.location.id)}
                      variant="ghost"
                      size="sm"
                      title="Establecer como ubicación principal"
                    >
                      <StarIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {assignment.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      title="Ubicación principal"
                    >
                      <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                    </Button>
                  )}
                  <Button
                    onClick={() => handleRemoveLocation(assignment.location.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={assignments.length === 1}
                    title={assignments.length === 1 ? 'No se puede eliminar la última ubicación' : 'Eliminar asignación'}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
