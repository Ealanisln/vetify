'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  Loader2,
  Bell,
  Save,
  RotateCcw,
  AlertCircle,
  Mail,
  Users,
  Calendar,
  Clock,
  Package,
  Stethoscope,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  appointmentConfirmation: boolean;
  appointmentReminder: boolean;
  appointmentCancellation: boolean;
  appointmentRescheduled: boolean;
  treatmentReminder: boolean;
  staffAppointmentNotification: boolean;
  lowStockAlert: boolean;
  reminderHoursBefore: number;
}

interface NotificationSettingsProps {
  tenantId: string;
}

interface NotificationOption {
  key: keyof Omit<NotificationPreferences, 'reminderHoursBefore'>;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'customer' | 'staff';
}

const notificationOptions: NotificationOption[] = [
  {
    key: 'appointmentConfirmation',
    title: 'Confirmación de cita',
    description: 'Email enviado al cliente cuando se crea una nueva cita',
    icon: Calendar,
    category: 'customer',
  },
  {
    key: 'appointmentReminder',
    title: 'Recordatorio de cita',
    description: 'Email enviado antes de la cita programada',
    icon: Clock,
    category: 'customer',
  },
  {
    key: 'appointmentCancellation',
    title: 'Cancelación de cita',
    description: 'Email enviado cuando una cita es cancelada',
    icon: XCircle,
    category: 'customer',
  },
  {
    key: 'appointmentRescheduled',
    title: 'Reprogramación de cita',
    description: 'Email enviado cuando cambia la fecha/hora de una cita',
    icon: RefreshCw,
    category: 'customer',
  },
  {
    key: 'treatmentReminder',
    title: 'Recordatorio de tratamiento',
    description: 'Email sobre tratamientos pendientes o próximos',
    icon: Stethoscope,
    category: 'customer',
  },
  {
    key: 'staffAppointmentNotification',
    title: 'Nueva cita asignada',
    description: 'Notificar al veterinario cuando se le asigna una cita',
    icon: Users,
    category: 'staff',
  },
  {
    key: 'lowStockAlert',
    title: 'Alerta de bajo inventario',
    description: 'Email cuando productos llegan al mínimo de stock',
    icon: Package,
    category: 'staff',
  },
];

const reminderHoursOptions = [
  { value: 1, label: '1 hora antes' },
  { value: 2, label: '2 horas antes' },
  { value: 4, label: '4 horas antes' },
  { value: 12, label: '12 horas antes' },
  { value: 24, label: '24 horas antes' },
  { value: 48, label: '48 horas antes' },
  { value: 72, label: '72 horas antes' },
];

export function NotificationSettings({ }: NotificationSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/notifications');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar preferencias');
      }

      setPreferences(result.data);
      setOriginalPreferences(result.data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Error al cargar las preferencias de notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleToggleChange = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [key]: value,
    });
    setHasChanges(true);
  };

  const handleReminderHoursChange = (value: number) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      reminderHoursBefore: value,
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar preferencias');
      }

      setPreferences(result.data);
      setOriginalPreferences(result.data);
      setHasChanges(false);
      toast.success('Preferencias guardadas exitosamente');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Error al guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalPreferences) {
      setPreferences(originalPreferences);
      setHasChanges(false);
      toast.info('Cambios descartados');
    }
  };

  const handleEnableAll = () => {
    if (!preferences) return;

    const updated: NotificationPreferences = {
      ...preferences,
      appointmentConfirmation: true,
      appointmentReminder: true,
      appointmentCancellation: true,
      appointmentRescheduled: true,
      treatmentReminder: true,
      staffAppointmentNotification: true,
      lowStockAlert: true,
    };

    setPreferences(updated);
    setHasChanges(true);
    toast.success('Todas las notificaciones habilitadas');
  };

  const handleDisableAll = () => {
    if (!preferences) return;

    const updated: NotificationPreferences = {
      ...preferences,
      appointmentConfirmation: false,
      appointmentReminder: false,
      appointmentCancellation: false,
      appointmentRescheduled: false,
      treatmentReminder: false,
      staffAppointmentNotification: false,
      lowStockAlert: false,
    };

    setPreferences(updated);
    setHasChanges(true);
    toast.info('Todas las notificaciones deshabilitadas');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Error al cargar las preferencias de notificaciones</p>
        <Button onClick={fetchPreferences} variant="outline" className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const customerNotifications = notificationOptions.filter((n) => n.category === 'customer');
  const staffNotifications = notificationOptions.filter((n) => n.category === 'staff');

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Preferencias de Notificaciones</h3>
          <p className="text-sm text-muted-foreground">
            Configura qué emails deseas enviar automáticamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEnableAll} variant="outline" size="sm">
            Habilitar todas
          </Button>
          <Button onClick={handleDisableAll} variant="outline" size="sm">
            Deshabilitar todas
          </Button>
        </div>
      </div>

      {/* Customer Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificaciones a Clientes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Emails enviados automáticamente a los dueños de mascotas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {customerNotifications.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.key}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor={option.key} className="text-sm font-medium cursor-pointer">
                      {option.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Switch
                  id={option.key}
                  checked={preferences[option.key] as boolean}
                  onCheckedChange={(checked) => handleToggleChange(option.key, checked)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Staff Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Notificaciones Internas (Staff)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Emails enviados al personal de la clínica
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {staffNotifications.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.key}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor={option.key} className="text-sm font-medium cursor-pointer">
                      {option.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Switch
                  id={option.key}
                  checked={preferences[option.key] as boolean}
                  onCheckedChange={(checked) => handleToggleChange(option.key, checked)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Reminder Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuración de Recordatorios
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configura cuándo enviar los recordatorios automáticos
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="reminderHours" className="whitespace-nowrap">
              Enviar recordatorio de cita:
            </Label>
            <select
              id="reminderHours"
              value={preferences.reminderHoursBefore}
              onChange={(e) => handleReminderHoursChange(parseInt(e.target.value))}
              className="flex h-10 w-full max-w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reminderHoursOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            <Button onClick={handleReset} variant="outline" size="sm" disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button onClick={handleSave} size="sm" disabled={saving}>
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
