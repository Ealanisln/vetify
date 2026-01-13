/**
 * Appointment Validation Tests
 * VETIF-193: Add unit tests for appointment validation functions
 *
 * Tests cover:
 * - Zod schemas validation (appointmentFormSchema, updateAppointmentSchema, etc.)
 * - validateAppointmentTime() - time validation logic
 * - getNextAppointmentStatus() - state machine transitions
 * - getAppointmentStatusColor() - utility function
 * - getAppointmentStatusLabel() - utility function
 */

import {
  appointmentFormSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
  availabilityQuerySchema,
  quickActionSchema,
  rescheduleSchema,
  recurringAppointmentSchema,
  bulkActionSchema,
  appointmentReminderSchema,
  businessHoursSchema,
  appointmentStatus,
  validateAppointmentTime,
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
  getNextAppointmentStatus,
  type AppointmentStatus,
} from '@/lib/validations/appointments';

describe('Appointment Validations', () => {
  describe('appointmentFormSchema', () => {
    const validAppointment = {
      customerId: 'cust-123',
      petId: 'pet-456',
      dateTime: new Date('2026-03-15T10:00:00'),
      duration: 30,
      reason: 'Consulta general',
      notes: 'Primera visita',
      staffId: 'staff-789',
      status: 'SCHEDULED' as const,
      priority: 'medium' as const,
    };

    it('should validate a complete valid appointment', () => {
      expect(() => appointmentFormSchema.parse(validAppointment)).not.toThrow();
    });

    it('should validate minimal appointment (required fields only)', () => {
      const minimal = {
        customerId: 'cust-123',
        petId: 'pet-456',
        dateTime: new Date('2026-03-15T10:00:00'),
        reason: 'Vacunación',
      };
      const result = appointmentFormSchema.parse(minimal);
      expect(result.duration).toBe(30); // default
      expect(result.status).toBe('SCHEDULED'); // default
      expect(result.priority).toBe('medium'); // default
    });

    describe('customerId validation', () => {
      it('should reject empty customerId', () => {
        const data = { ...validAppointment, customerId: '' };
        expect(() => appointmentFormSchema.parse(data)).toThrow('Cliente es requerido');
      });

      it('should reject missing customerId', () => {
        const { customerId: _customerId, ...data } = validAppointment;
        expect(() => appointmentFormSchema.parse(data)).toThrow();
      });
    });

    describe('petId validation', () => {
      it('should reject empty petId', () => {
        const data = { ...validAppointment, petId: '' };
        expect(() => appointmentFormSchema.parse(data)).toThrow('Mascota es requerida');
      });
    });

    describe('dateTime validation', () => {
      it('should reject invalid date', () => {
        const data = { ...validAppointment, dateTime: 'invalid-date' };
        expect(() => appointmentFormSchema.parse(data)).toThrow();
      });

      it('should accept valid Date object', () => {
        const data = { ...validAppointment, dateTime: new Date() };
        expect(() => appointmentFormSchema.parse(data)).not.toThrow();
      });
    });

    describe('duration validation', () => {
      it('should reject duration less than 15 minutes', () => {
        const data = { ...validAppointment, duration: 10 };
        expect(() => appointmentFormSchema.parse(data)).toThrow('Duración mínima es 15 minutos');
      });

      it('should reject duration more than 300 minutes', () => {
        const data = { ...validAppointment, duration: 301 };
        expect(() => appointmentFormSchema.parse(data)).toThrow('Duración máxima es 5 horas');
      });

      it('should accept 15 minute duration', () => {
        const data = { ...validAppointment, duration: 15 };
        expect(() => appointmentFormSchema.parse(data)).not.toThrow();
      });

      it('should accept 300 minute duration', () => {
        const data = { ...validAppointment, duration: 300 };
        expect(() => appointmentFormSchema.parse(data)).not.toThrow();
      });
    });

    describe('reason validation', () => {
      it('should reject empty reason', () => {
        const data = { ...validAppointment, reason: '' };
        expect(() => appointmentFormSchema.parse(data)).toThrow('Motivo de la cita es requerido');
      });

      it('should reject reason longer than 500 characters', () => {
        const data = { ...validAppointment, reason: 'x'.repeat(501) };
        expect(() => appointmentFormSchema.parse(data)).toThrow('Motivo muy largo');
      });

      it('should accept 500 character reason', () => {
        const data = { ...validAppointment, reason: 'x'.repeat(500) };
        expect(() => appointmentFormSchema.parse(data)).not.toThrow();
      });
    });

    describe('notes validation', () => {
      it('should accept empty notes', () => {
        const data = { ...validAppointment, notes: undefined };
        expect(() => appointmentFormSchema.parse(data)).not.toThrow();
      });

      it('should reject notes longer than 1000 characters', () => {
        const data = { ...validAppointment, notes: 'x'.repeat(1001) };
        expect(() => appointmentFormSchema.parse(data)).toThrow('Notas muy largas');
      });
    });

    describe('status validation', () => {
      it.each(appointmentStatus)('should accept valid status: %s', (status) => {
        const data = { ...validAppointment, status };
        expect(() => appointmentFormSchema.parse(data)).not.toThrow();
      });

      it('should reject invalid status', () => {
        const data = { ...validAppointment, status: 'INVALID_STATUS' };
        expect(() => appointmentFormSchema.parse(data)).toThrow();
      });
    });

    describe('priority validation', () => {
      it.each(['low', 'medium', 'high', 'emergency'] as const)(
        'should accept valid priority: %s',
        (priority) => {
          const data = { ...validAppointment, priority };
          expect(() => appointmentFormSchema.parse(data)).not.toThrow();
        }
      );

      it('should reject invalid priority', () => {
        const data = { ...validAppointment, priority: 'critical' };
        expect(() => appointmentFormSchema.parse(data)).toThrow();
      });
    });
  });

  describe('updateAppointmentSchema', () => {
    it('should require id for updates', () => {
      const data = { reason: 'Updated reason' };
      // The .extend() method doesn't carry over the custom message, so it throws 'Required'
      expect(() => updateAppointmentSchema.parse(data)).toThrow();
    });

    it('should reject empty id', () => {
      const data = { id: '', reason: 'Updated reason' };
      expect(() => updateAppointmentSchema.parse(data)).toThrow('ID de cita es requerido');
    });

    it('should allow partial updates with id', () => {
      const data = { id: 'apt-123', reason: 'Updated reason' };
      expect(() => updateAppointmentSchema.parse(data)).not.toThrow();
    });

    it('should allow updating only status', () => {
      const data = { id: 'apt-123', status: 'CONFIRMED' as const };
      const result = updateAppointmentSchema.parse(data);
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('appointmentQuerySchema', () => {
    it('should accept empty query', () => {
      expect(() => appointmentQuerySchema.parse({})).not.toThrow();
    });

    it('should transform page string to number', () => {
      const result = appointmentQuerySchema.parse({ page: '5' });
      expect(result.page).toBe(5);
    });

    it('should transform limit string to number', () => {
      const result = appointmentQuerySchema.parse({ limit: '25' });
      expect(result.limit).toBe(25);
    });

    it('should default page to 1 when not provided', () => {
      const result = appointmentQuerySchema.parse({});
      expect(result.page).toBe(1);
    });

    it('should default limit to 50 when not provided', () => {
      const result = appointmentQuerySchema.parse({});
      expect(result.limit).toBe(50);
    });

    it('should accept valid status filter', () => {
      const result = appointmentQuerySchema.parse({ status: 'SCHEDULED' });
      expect(result.status).toBe('SCHEDULED');
    });
  });

  describe('availabilityQuerySchema', () => {
    it('should accept valid date string', () => {
      const result = availabilityQuerySchema.parse({ date: '2026-03-15' });
      expect(result.date).toBe('2026-03-15');
    });

    it('should reject invalid date format', () => {
      expect(() => availabilityQuerySchema.parse({ date: 'invalid' })).toThrow(
        'Formato de fecha inválido'
      );
    });

    it('should default duration to 30 when not provided', () => {
      const result = availabilityQuerySchema.parse({ date: '2026-03-15' });
      expect(result.duration).toBe(30);
    });

    it('should transform duration string to number', () => {
      const result = availabilityQuerySchema.parse({ date: '2026-03-15', duration: '45' });
      expect(result.duration).toBe(45);
    });

    it('should reject duration less than 15', () => {
      expect(() =>
        availabilityQuerySchema.parse({ date: '2026-03-15', duration: '10' })
      ).toThrow('Duración debe estar entre 15 y 300 minutos');
    });

    it('should reject duration greater than 300', () => {
      expect(() =>
        availabilityQuerySchema.parse({ date: '2026-03-15', duration: '350' })
      ).toThrow('Duración debe estar entre 15 y 300 minutos');
    });
  });

  describe('quickActionSchema', () => {
    it.each(['confirm', 'checkin', 'start', 'complete', 'cancel'] as const)(
      'should accept action: %s',
      (action) => {
        expect(() => quickActionSchema.parse({ action })).not.toThrow();
      }
    );

    it('should accept cancel with cancelReason', () => {
      const data = { action: 'cancel' as const, cancelReason: 'client' as const };
      expect(() => quickActionSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid cancelReason', () => {
      const data = { action: 'cancel' as const, cancelReason: 'invalid' };
      expect(() => quickActionSchema.parse(data)).toThrow();
    });
  });

  describe('rescheduleSchema', () => {
    it('should accept valid reschedule data', () => {
      const data = {
        newDateTime: new Date('2026-03-20T14:00:00'),
        duration: 45,
        notes: 'Reagendado por solicitud del cliente',
      };
      expect(() => rescheduleSchema.parse(data)).not.toThrow();
    });

    it('should require newDateTime', () => {
      expect(() => rescheduleSchema.parse({})).toThrow('Nueva fecha y hora son requeridas');
    });

    it('should reject notes longer than 500 characters', () => {
      const data = {
        newDateTime: new Date(),
        notes: 'x'.repeat(501),
      };
      expect(() => rescheduleSchema.parse(data)).toThrow('Notas muy largas');
    });
  });

  describe('recurringAppointmentSchema', () => {
    it('should accept valid daily recurring appointment', () => {
      const data = { type: 'daily' as const, interval: 1 };
      expect(() => recurringAppointmentSchema.parse(data)).not.toThrow();
    });

    it('should accept weekly with weekdays', () => {
      const data = {
        type: 'weekly' as const,
        interval: 1,
        weekdays: [1, 3, 5], // Mon, Wed, Fri
      };
      expect(() => recurringAppointmentSchema.parse(data)).not.toThrow();
    });

    it('should accept monthly with monthDay', () => {
      const data = {
        type: 'monthly' as const,
        interval: 1,
        monthDay: 15,
      };
      expect(() => recurringAppointmentSchema.parse(data)).not.toThrow();
    });

    it('should reject interval greater than 12', () => {
      const data = { type: 'monthly' as const, interval: 13 };
      expect(() => recurringAppointmentSchema.parse(data)).toThrow();
    });

    it('should reject occurrences greater than 52', () => {
      const data = { type: 'weekly' as const, interval: 1, occurrences: 53 };
      expect(() => recurringAppointmentSchema.parse(data)).toThrow();
    });

    it('should reject invalid weekday (> 6)', () => {
      const data = { type: 'weekly' as const, interval: 1, weekdays: [7] };
      expect(() => recurringAppointmentSchema.parse(data)).toThrow();
    });

    it('should reject monthDay greater than 31', () => {
      const data = { type: 'monthly' as const, interval: 1, monthDay: 32 };
      expect(() => recurringAppointmentSchema.parse(data)).toThrow();
    });
  });

  describe('bulkActionSchema', () => {
    it('should accept valid bulk action', () => {
      const data = {
        appointmentIds: ['apt-1', 'apt-2', 'apt-3'],
        action: 'confirm' as const,
      };
      expect(() => bulkActionSchema.parse(data)).not.toThrow();
    });

    it('should reject empty appointmentIds array', () => {
      const data = { appointmentIds: [], action: 'confirm' as const };
      expect(() => bulkActionSchema.parse(data)).toThrow('Debe seleccionar al menos una cita');
    });

    it('should accept change_status with newStatus', () => {
      const data = {
        appointmentIds: ['apt-1'],
        action: 'change_status' as const,
        newStatus: 'CONFIRMED' as const,
      };
      expect(() => bulkActionSchema.parse(data)).not.toThrow();
    });

    it('should accept reschedule with newDateTime', () => {
      const data = {
        appointmentIds: ['apt-1'],
        action: 'reschedule' as const,
        newDateTime: new Date('2026-03-20T10:00:00'),
      };
      expect(() => bulkActionSchema.parse(data)).not.toThrow();
    });
  });

  describe('appointmentReminderSchema', () => {
    it('should accept valid reminder', () => {
      const data = {
        type: 'email' as const,
        timing: '24_hours' as const,
        enabled: true,
      };
      expect(() => appointmentReminderSchema.parse(data)).not.toThrow();
    });

    it.each(['email', 'sms', 'whatsapp'] as const)('should accept type: %s', (type) => {
      const data = { type, timing: '24_hours' as const };
      expect(() => appointmentReminderSchema.parse(data)).not.toThrow();
    });

    it.each(['1_hour', '24_hours', '48_hours', '1_week'] as const)(
      'should accept timing: %s',
      (timing) => {
        const data = { type: 'email' as const, timing };
        expect(() => appointmentReminderSchema.parse(data)).not.toThrow();
      }
    );

    it('should reject message longer than 500 characters', () => {
      const data = {
        type: 'sms' as const,
        timing: '24_hours' as const,
        message: 'x'.repeat(501),
      };
      expect(() => appointmentReminderSchema.parse(data)).toThrow();
    });

    it('should default enabled to true', () => {
      const result = appointmentReminderSchema.parse({
        type: 'email' as const,
        timing: '24_hours' as const,
      });
      expect(result.enabled).toBe(true);
    });
  });

  describe('businessHoursSchema', () => {
    const validBusinessHours = {
      dayOfWeek: 1, // Monday
      isWorkingDay: true,
      startTime: '08:00',
      endTime: '18:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
    };

    it('should accept valid business hours', () => {
      expect(() => businessHoursSchema.parse(validBusinessHours)).not.toThrow();
    });

    it('should accept non-working day', () => {
      const data = {
        dayOfWeek: 0, // Sunday
        isWorkingDay: false,
        startTime: '08:00',
        endTime: '18:00',
      };
      expect(() => businessHoursSchema.parse(data)).not.toThrow();
    });

    it.each([0, 1, 2, 3, 4, 5, 6])('should accept dayOfWeek: %d', (dayOfWeek) => {
      const data = { ...validBusinessHours, dayOfWeek };
      expect(() => businessHoursSchema.parse(data)).not.toThrow();
    });

    it('should reject dayOfWeek > 6', () => {
      const data = { ...validBusinessHours, dayOfWeek: 7 };
      expect(() => businessHoursSchema.parse(data)).toThrow();
    });

    it('should reject dayOfWeek < 0', () => {
      const data = { ...validBusinessHours, dayOfWeek: -1 };
      expect(() => businessHoursSchema.parse(data)).toThrow();
    });

    describe('time format validation', () => {
      it.each(['8:00', '08:00', '00:00', '23:59'])('should accept valid time: %s', (time) => {
        const data = { ...validBusinessHours, startTime: time };
        expect(() => businessHoursSchema.parse(data)).not.toThrow();
      });

      it.each(['24:00', '8:60', 'invalid', '8am', '08:00:00'])(
        'should reject invalid time: %s',
        (time) => {
          const data = { ...validBusinessHours, startTime: time };
          expect(() => businessHoursSchema.parse(data)).toThrow('Formato de hora inválido');
        }
      );
    });
  });

  describe('validateAppointmentTime', () => {
    // Mock the current date for consistent testing
    const mockNow = new Date('2026-01-15T10:00:00');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockNow);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('past date validation', () => {
      it('should throw error for past appointment', () => {
        const pastDate = new Date('2026-01-14T10:00:00'); // Yesterday
        expect(() => validateAppointmentTime(pastDate)).toThrow(
          'La cita debe ser en el futuro'
        );
      });

      it('should throw error for current time appointment', () => {
        const now = new Date(mockNow);
        expect(() => validateAppointmentTime(now)).toThrow('La cita debe ser en el futuro');
      });
    });

    describe('Sunday validation', () => {
      it('should throw error for Sunday appointment', () => {
        // January 18, 2026 is a Sunday
        const sunday = new Date('2026-01-18T10:00:00');
        expect(() => validateAppointmentTime(sunday)).toThrow(
          'No se pueden agendar citas los domingos'
        );
      });

      it('should accept Monday appointment', () => {
        // January 19, 2026 is a Monday
        const monday = new Date('2026-01-19T10:00:00');
        expect(validateAppointmentTime(monday)).toBe(true);
      });

      it('should accept Saturday appointment', () => {
        // January 17, 2026 is a Saturday
        const saturday = new Date('2026-01-17T10:00:00');
        expect(validateAppointmentTime(saturday)).toBe(true);
      });
    });

    describe('business hours validation', () => {
      it('should throw error for appointment before 8:00 AM', () => {
        const earlyMorning = new Date('2026-01-19T07:59:00');
        expect(() => validateAppointmentTime(earlyMorning)).toThrow(
          'Las citas deben ser entre 8:00 AM y 6:00 PM'
        );
      });

      it('should accept appointment at 8:00 AM', () => {
        const morning = new Date('2026-01-19T08:00:00');
        expect(validateAppointmentTime(morning)).toBe(true);
      });

      it('should throw error for appointment at 6:00 PM or later', () => {
        const evening = new Date('2026-01-19T18:00:00');
        expect(() => validateAppointmentTime(evening)).toThrow(
          'Las citas deben ser entre 8:00 AM y 6:00 PM'
        );
      });

      it('should accept appointment at 5:59 PM (17:59)', () => {
        const afternoon = new Date('2026-01-19T17:59:00');
        expect(validateAppointmentTime(afternoon)).toBe(true);
      });
    });

    describe('lunch hour validation', () => {
      it('should throw error for appointment at 1:00 PM (13:00)', () => {
        const lunchStart = new Date('2026-01-19T13:00:00');
        expect(() => validateAppointmentTime(lunchStart)).toThrow(
          'No se pueden agendar citas durante la hora de comida (1:00 PM - 2:00 PM)'
        );
      });

      it('should throw error for appointment at 1:30 PM (13:30)', () => {
        const midLunch = new Date('2026-01-19T13:30:00');
        expect(() => validateAppointmentTime(midLunch)).toThrow(
          'No se pueden agendar citas durante la hora de comida (1:00 PM - 2:00 PM)'
        );
      });

      it('should accept appointment at 2:00 PM (14:00)', () => {
        const afterLunch = new Date('2026-01-19T14:00:00');
        expect(validateAppointmentTime(afterLunch)).toBe(true);
      });

      it('should accept appointment at 12:59 PM (12:59)', () => {
        const beforeLunch = new Date('2026-01-19T12:59:00');
        expect(validateAppointmentTime(beforeLunch)).toBe(true);
      });
    });

    describe('valid appointment times', () => {
      it.each([
        ['2026-01-19T08:00:00', 'Monday 8:00 AM'],
        ['2026-01-19T09:30:00', 'Monday 9:30 AM'],
        ['2026-01-19T12:00:00', 'Monday 12:00 PM'],
        ['2026-01-19T14:00:00', 'Monday 2:00 PM'],
        ['2026-01-19T17:00:00', 'Monday 5:00 PM'],
        ['2026-01-20T10:00:00', 'Tuesday 10:00 AM'],
        ['2026-01-17T15:00:00', 'Saturday 3:00 PM'],
      ])('should accept valid time: %s (%s)', (dateStr) => {
        const date = new Date(dateStr);
        expect(validateAppointmentTime(date)).toBe(true);
      });
    });
  });

  describe('getAppointmentStatusColor', () => {
    it.each([
      ['SCHEDULED', 'blue'],
      ['CONFIRMED', 'green'],
      ['CHECKED_IN', 'purple'],
      ['IN_PROGRESS', 'orange'],
      ['COMPLETED', 'emerald'],
      ['CANCELLED_CLIENT', 'red'],
      ['CANCELLED_CLINIC', 'red'],
      ['NO_SHOW', 'gray'],
    ] as [AppointmentStatus, string][])('should return %s for status %s', (status, color) => {
      expect(getAppointmentStatusColor(status)).toBe(color);
    });

    it('should return gray for unknown status', () => {
      // Using type assertion to test edge case
      expect(getAppointmentStatusColor('UNKNOWN' as AppointmentStatus)).toBe('gray');
    });
  });

  describe('getAppointmentStatusLabel', () => {
    it.each([
      ['SCHEDULED', 'Programada'],
      ['CONFIRMED', 'Confirmada'],
      ['CHECKED_IN', 'Registrado'],
      ['IN_PROGRESS', 'En progreso'],
      ['COMPLETED', 'Completada'],
      ['CANCELLED_CLIENT', 'Cancelada por cliente'],
      ['CANCELLED_CLINIC', 'Cancelada por clínica'],
      ['NO_SHOW', 'No se presentó'],
    ] as [AppointmentStatus, string][])('should return "%s" for status %s', (status, label) => {
      expect(getAppointmentStatusLabel(status)).toBe(label);
    });

    it('should return the status itself for unknown status', () => {
      const unknownStatus = 'UNKNOWN_STATUS' as AppointmentStatus;
      expect(getAppointmentStatusLabel(unknownStatus)).toBe('UNKNOWN_STATUS');
    });
  });

  describe('getNextAppointmentStatus', () => {
    describe('SCHEDULED transitions', () => {
      it('should return valid next statuses for SCHEDULED', () => {
        const nextStatuses = getNextAppointmentStatus('SCHEDULED');
        expect(nextStatuses).toEqual(['CONFIRMED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC']);
      });

      it('should include CONFIRMED as valid transition from SCHEDULED', () => {
        const nextStatuses = getNextAppointmentStatus('SCHEDULED');
        expect(nextStatuses).toContain('CONFIRMED');
      });

      it('should not include COMPLETED as valid transition from SCHEDULED', () => {
        const nextStatuses = getNextAppointmentStatus('SCHEDULED');
        expect(nextStatuses).not.toContain('COMPLETED');
      });
    });

    describe('CONFIRMED transitions', () => {
      it('should return valid next statuses for CONFIRMED', () => {
        const nextStatuses = getNextAppointmentStatus('CONFIRMED');
        expect(nextStatuses).toEqual([
          'CHECKED_IN',
          'CANCELLED_CLIENT',
          'CANCELLED_CLINIC',
          'NO_SHOW',
        ]);
      });

      it('should include NO_SHOW as valid transition from CONFIRMED', () => {
        const nextStatuses = getNextAppointmentStatus('CONFIRMED');
        expect(nextStatuses).toContain('NO_SHOW');
      });
    });

    describe('CHECKED_IN transitions', () => {
      it('should return valid next statuses for CHECKED_IN', () => {
        const nextStatuses = getNextAppointmentStatus('CHECKED_IN');
        expect(nextStatuses).toEqual(['IN_PROGRESS', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC']);
      });

      it('should include IN_PROGRESS as valid transition from CHECKED_IN', () => {
        const nextStatuses = getNextAppointmentStatus('CHECKED_IN');
        expect(nextStatuses).toContain('IN_PROGRESS');
      });
    });

    describe('IN_PROGRESS transitions', () => {
      it('should return valid next statuses for IN_PROGRESS', () => {
        const nextStatuses = getNextAppointmentStatus('IN_PROGRESS');
        expect(nextStatuses).toEqual(['COMPLETED', 'CANCELLED_CLINIC']);
      });

      it('should not include CANCELLED_CLIENT for IN_PROGRESS (too late to cancel)', () => {
        const nextStatuses = getNextAppointmentStatus('IN_PROGRESS');
        expect(nextStatuses).not.toContain('CANCELLED_CLIENT');
      });
    });

    describe('Terminal states', () => {
      it.each(['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] as const)(
        'should return empty array for terminal status: %s',
        (status) => {
          const nextStatuses = getNextAppointmentStatus(status);
          expect(nextStatuses).toEqual([]);
        }
      );
    });

    describe('Unknown status', () => {
      it('should return empty array for unknown status', () => {
        const nextStatuses = getNextAppointmentStatus('UNKNOWN' as AppointmentStatus);
        expect(nextStatuses).toEqual([]);
      });
    });

    describe('State machine integrity', () => {
      it('should not allow going backwards in the workflow', () => {
        const confirmed = getNextAppointmentStatus('CONFIRMED');
        expect(confirmed).not.toContain('SCHEDULED');

        const checkedIn = getNextAppointmentStatus('CHECKED_IN');
        expect(checkedIn).not.toContain('CONFIRMED');
        expect(checkedIn).not.toContain('SCHEDULED');

        const inProgress = getNextAppointmentStatus('IN_PROGRESS');
        expect(inProgress).not.toContain('CHECKED_IN');
        expect(inProgress).not.toContain('CONFIRMED');
        expect(inProgress).not.toContain('SCHEDULED');
      });

      it('should ensure COMPLETED is only reachable from IN_PROGRESS', () => {
        const allStatuses: AppointmentStatus[] = [
          'SCHEDULED',
          'CONFIRMED',
          'CHECKED_IN',
          'IN_PROGRESS',
          'COMPLETED',
          'CANCELLED_CLIENT',
          'CANCELLED_CLINIC',
          'NO_SHOW',
        ];

        const statusesLeadingToCompleted = allStatuses.filter((status) =>
          getNextAppointmentStatus(status).includes('COMPLETED')
        );

        expect(statusesLeadingToCompleted).toEqual(['IN_PROGRESS']);
      });
    });
  });

  describe('appointmentStatus constant', () => {
    it('should have exactly 8 statuses', () => {
      expect(appointmentStatus).toHaveLength(8);
    });

    it('should include all expected statuses', () => {
      expect(appointmentStatus).toContain('SCHEDULED');
      expect(appointmentStatus).toContain('CONFIRMED');
      expect(appointmentStatus).toContain('CHECKED_IN');
      expect(appointmentStatus).toContain('IN_PROGRESS');
      expect(appointmentStatus).toContain('COMPLETED');
      expect(appointmentStatus).toContain('CANCELLED_CLIENT');
      expect(appointmentStatus).toContain('CANCELLED_CLINIC');
      expect(appointmentStatus).toContain('NO_SHOW');
    });
  });
});
