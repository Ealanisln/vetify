import { z } from 'zod';

export const appointmentStatus = [
  'SCHEDULED',
  'CONFIRMED', 
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED_CLIENT',
  'CANCELLED_CLINIC',
  'NO_SHOW'
] as const;

export const appointmentFormSchema = z.object({
  customerId: z.string().min(1, 'Cliente es requerido'),
  petId: z.string().min(1, 'Mascota es requerida'),
  dateTime: z.date({
    required_error: 'Fecha y hora son requeridas',
    invalid_type_error: 'Fecha y hora inválidas',
  }),
  duration: z.number()
    .min(15, 'Duración mínima es 15 minutos')
    .max(300, 'Duración máxima es 5 horas')
    .default(30),
  reason: z.string()
    .min(1, 'Motivo de la cita es requerido')
    .max(500, 'Motivo muy largo'),
  notes: z.string()
    .max(1000, 'Notas muy largas')
    .optional(),
  staffId: z.string().optional(),
  status: z.enum(appointmentStatus).default('SCHEDULED'),
  priority: z.enum(['low', 'medium', 'high', 'emergency']).default('medium'),
});

export const updateAppointmentSchema = appointmentFormSchema.partial().extend({
  id: z.string().min(1, 'ID de cita es requerido'),
});

export const appointmentQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(appointmentStatus).optional(),
  staffId: z.string().optional(),
  customerId: z.string().optional(),
  petId: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
});

export const availabilityQuerySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Formato de fecha inválido"
  }),
  duration: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 30)
    .refine(val => val >= 15 && val <= 300, {
      message: "Duración debe estar entre 15 y 300 minutos"
    }),
  staffId: z.string().optional(),
  excludeAppointmentId: z.string().optional(),
});

export const quickActionSchema = z.object({
  action: z.enum(['confirm', 'checkin', 'start', 'complete', 'cancel']),
  notes: z.string().optional(),
  cancelReason: z.enum(['client', 'clinic', 'no_show']).optional(),
});

export const rescheduleSchema = z.object({
  newDateTime: z.date({
    required_error: 'Nueva fecha y hora son requeridas',
    invalid_type_error: 'Nueva fecha y hora inválidas',
  }),
  duration: z.number()
    .min(15, 'Duración mínima es 15 minutos')
    .max(300, 'Duración máxima es 5 horas')
    .optional(),
  notes: z.string()
    .max(500, 'Notas muy largas')
    .optional(),
});

export const recurringAppointmentSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().min(1).max(12), // Para monthly máximo 12 meses
  endDate: z.date().optional(),
  occurrences: z.number().min(1).max(52).optional(), // Máximo 52 semanas
  weekdays: z.array(z.number().min(0).max(6)).optional(), // Para weekly
  monthDay: z.number().min(1).max(31).optional(), // Para monthly
});

export const bulkActionSchema = z.object({
  appointmentIds: z.array(z.string()).min(1, 'Debe seleccionar al menos una cita'),
  action: z.enum(['confirm', 'cancel', 'reschedule', 'change_status']),
  newStatus: z.enum(appointmentStatus).optional(),
  newDateTime: z.date().optional(),
  notes: z.string().optional(),
});

export const appointmentReminderSchema = z.object({
  type: z.enum(['email', 'sms', 'whatsapp']),
  timing: z.enum(['1_hour', '24_hours', '48_hours', '1_week']),
  message: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
});

export const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isWorkingDay: z.boolean(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  lunchStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  lunchEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
});

// Tipos TypeScript inferidos
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type QuickAction = z.infer<typeof quickActionSchema>;
export type RescheduleData = z.infer<typeof rescheduleSchema>;
export type RecurringAppointmentData = z.infer<typeof recurringAppointmentSchema>;
export type BulkActionData = z.infer<typeof bulkActionSchema>;
export type AppointmentReminderData = z.infer<typeof appointmentReminderSchema>;
export type BusinessHoursData = z.infer<typeof businessHoursSchema>;
export type AppointmentStatus = typeof appointmentStatus[number];

// Utilidades para validación
export const validateAppointmentTime = (dateTime: Date) => {
  const now = new Date();
  const appointmentTime = new Date(dateTime);
  
  if (appointmentTime <= now) {
    throw new Error('La cita debe ser en el futuro');
  }
  
  const hour = appointmentTime.getHours();
  const dayOfWeek = appointmentTime.getDay();
  
  // Verificar día laborable (lunes a sábado)
  if (dayOfWeek === 0) {
    throw new Error('No se pueden agendar citas los domingos');
  }
  
  // Verificar horario laboral
  if (hour < 8 || hour >= 18) {
    throw new Error('Las citas deben ser entre 8:00 AM y 6:00 PM');
  }
  
  // Verificar hora de comida
  if (hour >= 13 && hour < 14) {
    throw new Error('No se pueden agendar citas durante la hora de comida (1:00 PM - 2:00 PM)');
  }
  
  return true;
};

export const getAppointmentStatusColor = (status: AppointmentStatus) => {
  const colors = {
    SCHEDULED: 'blue',
    CONFIRMED: 'green',
    CHECKED_IN: 'purple',
    IN_PROGRESS: 'orange',
    COMPLETED: 'emerald',
    CANCELLED_CLIENT: 'red',
    CANCELLED_CLINIC: 'red',
    NO_SHOW: 'gray',
  };
  
  return colors[status] || 'gray';
};

export const getAppointmentStatusLabel = (status: AppointmentStatus) => {
  const labels = {
    SCHEDULED: 'Programada',
    CONFIRMED: 'Confirmada',
    CHECKED_IN: 'Registrado',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completada',
    CANCELLED_CLIENT: 'Cancelada por cliente',
    CANCELLED_CLINIC: 'Cancelada por clínica',
    NO_SHOW: 'No se presentó',
  };
  
  return labels[status] || status;
};

export const getNextAppointmentStatus = (currentStatus: AppointmentStatus): AppointmentStatus[] => {
  const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    SCHEDULED: ['CONFIRMED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC'],
    CONFIRMED: ['CHECKED_IN', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'],
    CHECKED_IN: ['IN_PROGRESS', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED_CLINIC'],
    COMPLETED: [],
    CANCELLED_CLIENT: [],
    CANCELLED_CLINIC: [],
    NO_SHOW: [],
  };
  
  return transitions[currentStatus] || [];
};