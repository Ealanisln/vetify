'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Clock, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  applyDefaultChange,
  getScheduleErrors,
  type DefaultField,
  type ScheduleError,
  type ScheduleField,
} from '../../lib/business-hours';

interface BusinessHour {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  lunchStart: string | null;
  lunchEnd: string | null;
  slotDuration: number | null;
}

interface BusinessHoursData {
  id: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultLunchStart: string | null;
  defaultLunchEnd: string | null;
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

// Stable English slugs for test selectors (e.g. open-time-monday)
const daySlugs = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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

interface ValidationDetail {
  path?: (string | number)[];
  message?: string;
}

const errorFor = (errors: ScheduleError[], field: ScheduleField) =>
  errors.find(error => error.field === field)?.message;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>;
}

function getDefaultErrors(data: BusinessHoursData): ScheduleError[] {
  return getScheduleErrors({
    startTime: data.defaultStartTime,
    endTime: data.defaultEndTime,
    lunchStart: data.defaultLunchStart,
    lunchEnd: data.defaultLunchEnd,
  });
}

function getDayErrors(day: BusinessHour): ScheduleError[] {
  return day.isWorkingDay ? getScheduleErrors(day) : [];
}

/** Turns zod issue details from the API into "Martes: mensaje" lines. */
function describeValidationDetails(details: ValidationDetail[] | undefined, data: BusinessHoursData): string | null {
  if (!Array.isArray(details) || details.length === 0) return null;
  const lines = details
    .filter(detail => detail?.message)
    .map(detail => {
      const [section, index] = detail.path ?? [];
      if (section === 'businessHours' && typeof index === 'number') {
        const dayOfWeek = data.businessHours[index]?.dayOfWeek;
        return dayOfWeek !== undefined ? `${dayNames[dayOfWeek]}: ${detail.message}` : detail.message!;
      }
      return `Configuración por defecto: ${detail.message}`;
    });
  return lines.length > 0 ? Array.from(new Set(lines)).join('; ') : null;
}

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

  const handleDefaultTimeChange = (field: DefaultField, value: string | number) => {
    if (!businessHours) return;

    // null (not undefined) so "Sin comida" survives JSON.stringify. Days that
    // still follow the old default move with it; customized days stay as set.
    setBusinessHours(applyDefaultChange(businessHours, field, value === '' ? null : value));
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

    const updatedBusinessHours = businessHours.businessHours.map(day => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      // null (not undefined) so "Sin comida" survives JSON.stringify
      const next = { ...day, [field]: value === '' ? null : value };
      // Lunch end cannot exist without a start
      if (field === 'lunchStart' && value === '') next.lunchEnd = null;
      return next;
    });

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

    const hasErrors = getDefaultErrors(businessHours).length > 0
      || businessHours.businessHours.some(day => getDayErrors(day).length > 0);
    if (hasErrors) {
      toast.error('Revisa los horarios marcados antes de guardar');
      return;
    }

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
        const details = describeValidationDetails(result.details, businessHours);
        toast.error(details ?? result.error ?? 'Error al guardar los horarios');
        return;
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
        <Button onClick={fetchBusinessHours} variant="outline" size="sm" className="mt-4">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const defaultErrors = getDefaultErrors(businessHours);

  return (
    <div className="space-y-6" data-testid="business-hours-settings">
      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración por Defecto
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Los cambios aquí se aplican a todos los días que no hayas personalizado. Usa &quot;Aplicar a Todos los Días&quot; para sobrescribir también los personalizados.
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
                data-testid="default-open-time"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <FieldError message={errorFor(defaultErrors, 'startTime')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Cierre
              </label>
              <select
                value={businessHours.defaultEndTime}
                onChange={(e) => handleDefaultTimeChange('defaultEndTime', e.target.value)}
                data-testid="default-close-time"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <FieldError message={errorFor(defaultErrors, 'endTime')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración de Cita
              </label>
              <select
                value={businessHours.defaultSlotDuration}
                onChange={(e) => handleDefaultTimeChange('defaultSlotDuration', parseInt(e.target.value))}
                data-testid="default-slot-duration"
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
                data-testid="default-lunch-start"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin comida</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <FieldError message={errorFor(defaultErrors, 'lunchStart')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fin de comida
              </label>
              <select
                value={businessHours.defaultLunchEnd || ''}
                onChange={(e) => handleDefaultTimeChange('defaultLunchEnd', e.target.value || '')}
                data-testid="default-lunch-end"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                disabled={!businessHours.defaultLunchStart}
              >
                <option value="">Sin comida</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <FieldError message={errorFor(defaultErrors, 'lunchEnd')} />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={applyDefaultsToAll}
              variant="outline"
              size="sm"
              data-testid="apply-defaults-button"
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
            {businessHours.businessHours.map((day) => {
              const dayErrors = getDayErrors(day);
              return (
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
                    data-testid={`day-toggle-${daySlugs[day.dayOfWeek]}`}
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
                        data-testid={`open-time-${daySlugs[day.dayOfWeek]}`}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <FieldError message={errorFor(dayErrors, 'startTime')} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Cierre
                      </label>
                      <select
                        value={day.endTime}
                        onChange={(e) => handleDayTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                        data-testid={`close-time-${daySlugs[day.dayOfWeek]}`}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <FieldError message={errorFor(dayErrors, 'endTime')} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Inicio comida
                      </label>
                      <select
                        value={day.lunchStart || ''}
                        onChange={(e) => handleDayTimeChange(day.dayOfWeek, 'lunchStart', e.target.value || '')}
                        data-testid={`lunch-start-${daySlugs[day.dayOfWeek]}`}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sin comida</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <FieldError message={errorFor(dayErrors, 'lunchStart')} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Fin comida
                      </label>
                      <select
                        value={day.lunchEnd || ''}
                        onChange={(e) => handleDayTimeChange(day.dayOfWeek, 'lunchEnd', e.target.value || '')}
                        data-testid={`lunch-end-${daySlugs[day.dayOfWeek]}`}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                        disabled={!day.lunchStart}
                      >
                        <option value="">Sin comida</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <FieldError message={errorFor(dayErrors, 'lunchEnd')} />
                    </div>
                  </div>
                )}
              </div>
              );
            })}
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
              data-testid="reset-hours-button"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving}
              data-testid="save-business-hours"
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