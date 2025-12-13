'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Clock, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BusinessHour {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  lunchStart?: string;
  lunchEnd?: string;
  slotDuration?: number;
}

interface BusinessHoursData {
  id: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultLunchStart?: string;
  defaultLunchEnd?: string;
  defaultSlotDuration: number;
  businessHours: BusinessHour[];
}

interface BusinessHoursSettingsProps {
  tenantId: string;
}

const dayNames = [
  'Domingo',
  'Lunes', 
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

const timeSlots = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00'
];

const slotDurations = [
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
];

export function BusinessHoursSettings({ }: BusinessHoursSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHoursData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/business-hours');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar horarios');
      }

      setBusinessHours(result.data);
    } catch (error) {
      console.error('Error fetching business hours:', error);
      toast.error('Error al cargar la configuración de horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const handleDefaultTimeChange = (field: keyof BusinessHoursData, value: string | number) => {
    if (!businessHours) return;

    setBusinessHours({
      ...businessHours,
      [field]: value === '' ? undefined : value
    });
    setHasChanges(true);
  };

  const handleDayToggle = (dayOfWeek: number) => {
    if (!businessHours) return;

    const updatedBusinessHours = businessHours.businessHours.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { ...day, isWorkingDay: !day.isWorkingDay }
        : day
    );

    setBusinessHours({
      ...businessHours,
      businessHours: updatedBusinessHours
    });
    setHasChanges(true);
  };

  const handleDayTimeChange = (dayOfWeek: number, field: keyof BusinessHour, value: string | number) => {
    if (!businessHours) return;

    const updatedBusinessHours = businessHours.businessHours.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { ...day, [field]: value === '' ? undefined : value }
        : day
    );

    setBusinessHours({
      ...businessHours,
      businessHours: updatedBusinessHours
    });
    setHasChanges(true);
  };

  const applyDefaultsToAll = () => {
    if (!businessHours) return;

    const updatedBusinessHours = businessHours.businessHours.map(day => ({
      ...day,
      startTime: businessHours.defaultStartTime,
      endTime: businessHours.defaultEndTime,
      lunchStart: businessHours.defaultLunchStart,
      lunchEnd: businessHours.defaultLunchEnd,
      slotDuration: businessHours.defaultSlotDuration,
    }));

    setBusinessHours({
      ...businessHours,
      businessHours: updatedBusinessHours
    });
    setHasChanges(true);
    toast.success('Configuración por defecto aplicada a todos los días');
  };

  const handleSave = async () => {
    if (!businessHours) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/business-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessHours),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar horarios');
      }

      setBusinessHours(result.data);
      setHasChanges(false);
      toast.success('Horarios de atención guardados exitosamente');
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast.error('Error al guardar los horarios');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchBusinessHours();
    setHasChanges(false);
    toast.info('Cambios descartados');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!businessHours) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Error al cargar la configuración de horarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración por Defecto
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Estos valores se aplicarán como predeterminados para todos los días
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Apertura
              </label>
              <select
                value={businessHours.defaultStartTime}
                onChange={(e) => handleDefaultTimeChange('defaultStartTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Cierre
              </label>
              <select
                value={businessHours.defaultEndTime}
                onChange={(e) => handleDefaultTimeChange('defaultEndTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración de Cita
              </label>
              <select
                value={businessHours.defaultSlotDuration}
                onChange={(e) => handleDefaultTimeChange('defaultSlotDuration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {slotDurations.map(duration => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inicio de comida
              </label>
              <select
                value={businessHours.defaultLunchStart || ''}
                onChange={(e) => handleDefaultTimeChange('defaultLunchStart', e.target.value || '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin comida</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fin de comida
              </label>
              <select
                value={businessHours.defaultLunchEnd || ''}
                onChange={(e) => handleDefaultTimeChange('defaultLunchEnd', e.target.value || '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                disabled={!businessHours.defaultLunchStart}
              >
                <option value="">Sin comida</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={applyDefaultsToAll}
              variant="outline"
              size="sm"
            >
              Aplicar a Todos los Días
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Day Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Horarios por Día</CardTitle>
          <p className="text-sm text-muted-foreground">
            Personaliza los horarios para cada día de la semana
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {businessHours.businessHours.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`p-4 border rounded-lg ${day.isWorkingDay ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {dayNames[day.dayOfWeek]}
                    </h3>
                    <Badge variant={day.isWorkingDay ? 'default' : 'secondary'}>
                      {day.isWorkingDay ? 'Día Laborable' : 'Cerrado'}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleDayToggle(day.dayOfWeek)}
                    variant={day.isWorkingDay ? 'destructive' : 'default'}
                    size="sm"
                  >
                    {day.isWorkingDay ? 'Cerrar' : 'Abrir'}
                  </Button>
                </div>

                {day.isWorkingDay && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Apertura
                      </label>
                      <select
                        value={day.startTime}
                        onChange={(e) => handleDayTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Cierre
                      </label>
                      <select
                        value={day.endTime}
                        onChange={(e) => handleDayTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Inicio comida
                      </label>
                      <select
                        value={day.lunchStart || ''}
                        onChange={(e) => handleDayTimeChange(day.dayOfWeek, 'lunchStart', e.target.value || '')}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sin comida</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Fin comida
                      </label>
                      <select
                        value={day.lunchEnd || ''}
                        onChange={(e) => handleDayTimeChange(day.dayOfWeek, 'lunchEnd', e.target.value || '')}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                        disabled={!day.lunchStart}
                      >
                        <option value="">Sin comida</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Tienes cambios sin guardar
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 