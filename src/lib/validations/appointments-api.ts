import { z } from 'zod';

// Helper to normalize empty strings and null to undefined
const optionalId = z
  .string()
  .nullish()
  .transform(val => (val === '' || val == null ? undefined : val));

// Schema de validación para POST /api/appointments
export const appointmentSchema = z.object({
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  duration: z.number().min(15).max(300).default(30),
  customerId: z.string(),
  petId: z.string(),
  reason: z.string(),
  status: z
    .enum([
      'SCHEDULED',
      'CONFIRMED',
      'CHECKED_IN',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED_CLIENT',
      'CANCELLED_CLINIC',
      'NO_SHOW',
    ])
    .default('SCHEDULED'),
  notes: z.string().optional(),
  staffId: optionalId,
  locationId: optionalId,
});
