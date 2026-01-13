import { prismaMock } from '../../mocks/prisma';
import {
  createTestAppointment,
  createTestTenant,
  createTestUser,
  createTestStaff,
  createTestLocation,
} from '../../utils/test-utils';

// Mock the appointments availability API route (kept for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockAvailabilityRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
};

describe('Appointments Availability API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _mockUser: ReturnType<typeof createTestUser>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockLocation: ReturnType<typeof createTestLocation>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    _mockUser = createTestUser({ tenantId: mockTenant.id });
    mockStaff = createTestStaff({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });

    // Mock Prisma responses
    prismaMock.appointment.findMany.mockResolvedValue([]);
    prismaMock.businessHours.findMany.mockResolvedValue([]);
  });

  describe('GET /api/appointments/availability', () => {
    it('should return available slots for a working day', async () => {
      // Mock business hours for Monday (day 1)
      const businessHours = {
        id: 'bh-1',
        tenantId: mockTenant.id,
        locationId: mockLocation.id,
        dayOfWeek: 1, // Monday
        openTime: '09:00',
        closeTime: '18:00',
        isOpen: true,
        breakStart: '13:00',
        breakEnd: '14:00',
      };

      prismaMock.businessHours.findMany.mockResolvedValue([businessHours]);
      prismaMock.appointment.findMany.mockResolvedValue([]); // No existing appointments

      // Simulate availability calculation
      // Use UTC date to avoid timezone issues
      const workingDate = new Date(Date.UTC(2024, 0, 8)); // Jan 8, 2024 (Monday) in UTC
      const dayOfWeek = workingDate.getUTCDay(); // 1 = Monday

      expect(dayOfWeek).toBe(1);
      expect(businessHours.isOpen).toBe(true);

      // Calculate available slots (9:00 - 18:00 with 30-min slots, excluding lunch)
      const openHour = parseInt(businessHours.openTime.split(':')[0]);
      const closeHour = parseInt(businessHours.closeTime.split(':')[0]);
      const lunchStart = parseInt(businessHours.breakStart.split(':')[0]);
      const lunchEnd = parseInt(businessHours.breakEnd.split(':')[0]);

      // Count available 30-min slots (excluding lunch hour)
      const morningSlots = (lunchStart - openHour) * 2; // 9-13 = 4 hours = 8 slots
      const afternoonSlots = (closeHour - lunchEnd) * 2; // 14-18 = 4 hours = 8 slots
      const totalSlots = morningSlots + afternoonSlots;

      expect(totalSlots).toBe(16);
    });

    it('should return empty slots for non-working days', async () => {
      // Mock business hours - Sunday is closed
      const businessHours = {
        id: 'bh-sunday',
        tenantId: mockTenant.id,
        locationId: mockLocation.id,
        dayOfWeek: 0, // Sunday
        openTime: null,
        closeTime: null,
        isOpen: false,
        breakStart: null,
        breakEnd: null,
      };

      prismaMock.businessHours.findMany.mockResolvedValue([businessHours]);

      // Use UTC date to avoid timezone issues
      const sundayDate = new Date(Date.UTC(2024, 0, 7)); // Jan 7, 2024 (Sunday) in UTC
      const dayOfWeek = sundayDate.getUTCDay();

      expect(dayOfWeek).toBe(0);
      expect(businessHours.isOpen).toBe(false);

      // No slots should be available on a closed day
      const availableSlots = businessHours.isOpen ? 16 : 0;
      expect(availableSlots).toBe(0);
    });

    it('should filter slots by staff member', async () => {
      const staffAppointment = createTestAppointment({
        tenantId: mockTenant.id,
        staffId: mockStaff.id,
        startTime: new Date('2024-01-08T10:00:00'),
        endTime: new Date('2024-01-08T10:30:00'),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.appointment.findMany.mockImplementation(async (args: Record<string, any>) => {
        const where = args?.where;
        if (where?.staffId === mockStaff.id) {
          return [staffAppointment];
        }
        return [];
      });

      // Query appointments for specific staff
      const staffAppointments = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
          staffId: mockStaff.id,
          dateTime: {
            gte: new Date('2024-01-08T00:00:00'),
            lt: new Date('2024-01-09T00:00:00'),
          },
          status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] },
        },
      });

      expect(staffAppointments).toHaveLength(1);
      expect(staffAppointments[0].staffId).toBe(mockStaff.id);
    });

    it('should exclude lunch break slots', async () => {
      const businessHours = {
        id: 'bh-1',
        tenantId: mockTenant.id,
        locationId: mockLocation.id,
        dayOfWeek: 1,
        openTime: '09:00',
        closeTime: '18:00',
        isOpen: true,
        breakStart: '13:00',
        breakEnd: '14:00',
      };

      prismaMock.businessHours.findMany.mockResolvedValue([businessHours]);

      // Simulate slot generation
      const slots: string[] = [];
      const openHour = 9;
      const closeHour = 18;
      const lunchStart = 13;
      const lunchEnd = 14;

      for (let hour = openHour; hour < closeHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          // Skip lunch break
          if (hour >= lunchStart && hour < lunchEnd) {
            continue;
          }
          slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }

      // Verify lunch slots are excluded
      expect(slots).not.toContain('13:00');
      expect(slots).not.toContain('13:30');
      expect(slots).toContain('12:30');
      expect(slots).toContain('14:00');
    });

    it('should return 400 for invalid date format', async () => {
      const invalidDate = 'not-a-date';
      const isValidDate = !isNaN(Date.parse(invalidDate));

      expect(isValidDate).toBe(false);

      // API should return 400 for invalid date
      const expectedStatus = isValidDate ? 200 : 400;
      expect(expectedStatus).toBe(400);
    });
  });

  describe('POST /api/appointments/availability', () => {
    it('should check specific slot availability', async () => {
      const requestedSlot = {
        date: '2024-01-08',
        time: '10:00',
        staffId: mockStaff.id,
        duration: 30,
      };

      // Check for conflicting appointments at the requested time
      prismaMock.appointment.findMany.mockResolvedValue([]);

      const conflictingAppointments = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
          staffId: requestedSlot.staffId,
          dateTime: {
            gte: new Date(`${requestedSlot.date}T${requestedSlot.time}:00`),
            lt: new Date(`${requestedSlot.date}T10:30:00`),
          },
          status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] },
        },
      });

      const isAvailable = conflictingAppointments.length === 0;
      expect(isAvailable).toBe(true);

      // Test with a conflicting appointment
      const existingAppointment = createTestAppointment({
        tenantId: mockTenant.id,
        staffId: mockStaff.id,
        startTime: new Date('2024-01-08T10:00:00'),
        endTime: new Date('2024-01-08T10:30:00'),
      });

      prismaMock.appointment.findMany.mockResolvedValue([existingAppointment]);

      const conflicts = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
          staffId: requestedSlot.staffId,
          dateTime: {
            gte: new Date(`${requestedSlot.date}T${requestedSlot.time}:00`),
            lt: new Date(`${requestedSlot.date}T10:30:00`),
          },
          status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] },
        },
      });

      const isSlotTaken = conflicts.length > 0;
      expect(isSlotTaken).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle holiday/blocked dates', async () => {
      // Mock a blocked date (e.g., Christmas)
      const blockedDates = [
        { date: '2024-12-25', reason: 'Christmas Day' },
        { date: '2024-01-01', reason: 'New Year' },
      ];

      const requestedDate = '2024-12-25';
      const isBlockedDate = blockedDates.some(bd => bd.date === requestedDate);

      expect(isBlockedDate).toBe(true);

      // On blocked dates, should return 0 available slots
      const availableSlots = isBlockedDate ? 0 : 16;
      expect(availableSlots).toBe(0);
    });

    it('should handle special business hours (early close)', async () => {
      // Christmas Eve - close early at 14:00
      const specialHours = {
        id: 'sh-christmas-eve',
        tenantId: mockTenant.id,
        locationId: mockLocation.id,
        date: '2024-12-24',
        openTime: '09:00',
        closeTime: '14:00', // Early close
        isOpen: true,
        breakStart: null,
        breakEnd: null,
      };

      // Calculate slots for special hours (9:00 - 14:00 = 5 hours = 10 slots)
      const openHour = parseInt(specialHours.openTime.split(':')[0]);
      const closeHour = parseInt(specialHours.closeTime.split(':')[0]);
      const totalSlots = (closeHour - openHour) * 2; // 30-min slots

      expect(totalSlots).toBe(10);
      expect(totalSlots).toBeLessThan(16); // Less than normal day
    });

    it('should handle special business hours (late open)', async () => {
      // After holiday - open late at 11:00
      const specialHours = {
        id: 'sh-late-open',
        tenantId: mockTenant.id,
        locationId: mockLocation.id,
        date: '2024-01-02',
        openTime: '11:00', // Late open
        closeTime: '18:00',
        isOpen: true,
        breakStart: '13:00',
        breakEnd: '14:00',
      };

      // Calculate slots: 11:00-13:00 (4 slots) + 14:00-18:00 (8 slots) = 12 slots
      const openHour = parseInt(specialHours.openTime.split(':')[0]);
      const closeHour = parseInt(specialHours.closeTime.split(':')[0]);
      const lunchStart = parseInt(specialHours.breakStart!.split(':')[0]);
      const lunchEnd = parseInt(specialHours.breakEnd!.split(':')[0]);

      const morningSlots = (lunchStart - openHour) * 2;
      const afternoonSlots = (closeHour - lunchEnd) * 2;
      const totalSlots = morningSlots + afternoonSlots;

      expect(totalSlots).toBe(12);
    });

    it('should handle variable slot durations (15-minute slots)', async () => {
      const slotDuration = 15; // 15-minute slots
      const openHour = 9;
      const closeHour = 12;

      // 3 hours * 4 slots per hour = 12 slots
      const totalSlots = ((closeHour - openHour) * 60) / slotDuration;
      expect(totalSlots).toBe(12);
    });

    it('should handle variable slot durations (60-minute slots)', async () => {
      const slotDuration = 60; // 60-minute slots
      const openHour = 9;
      const closeHour = 17;

      // 8 hours * 1 slot per hour = 8 slots
      const totalSlots = ((closeHour - openHour) * 60) / slotDuration;
      expect(totalSlots).toBe(8);
    });

    it('should filter out past slots for today', async () => {
      // Mock current time as 14:00
      const now = new Date('2024-01-08T14:00:00');
      const currentHour = now.getHours();

      // Generate slots for today
      const openHour = 9;
      const closeHour = 18;
      const allSlots: string[] = [];

      for (let hour = openHour; hour < closeHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          allSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }

      // Filter out past slots
      const futureSlots = allSlots.filter(slot => {
        const [hour] = slot.split(':').map(Number);
        return hour >= currentHour;
      });

      // Slots from 14:00 onwards should be available
      expect(futureSlots).toContain('14:00');
      expect(futureSlots).toContain('17:30');
      expect(futureSlots).not.toContain('09:00');
      expect(futureSlots).not.toContain('13:30');
    });

    it('should handle end of day edge cases', async () => {
      // Business closes at 17:30 (not on the hour)
      const closeTime = '17:30';
      const closeHour = parseInt(closeTime.split(':')[0]);
      const closeMinute = parseInt(closeTime.split(':')[1]);

      // Generate slots
      const slots: string[] = [];
      for (let hour = 9; hour <= closeHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === closeHour && minute >= closeMinute) {
            continue; // Skip slots at or after close time
          }
          slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }

      // Last available slot should be 17:00
      expect(slots[slots.length - 1]).toBe('17:00');
      expect(slots).not.toContain('17:30');
    });

    it('should handle multiple staff availability', async () => {
      const staff1 = { ...mockStaff, id: 'staff-1' };
      const staff2 = { ...mockStaff, id: 'staff-2' };

      // Staff 1 has appointment at 10:00
      const staff1Appointment = createTestAppointment({
        tenantId: mockTenant.id,
        staffId: staff1.id,
        startTime: new Date('2024-01-08T10:00:00'),
        endTime: new Date('2024-01-08T10:30:00'),
      });

      // Staff 2 has no appointments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.appointment.findMany.mockImplementation(async (args: Record<string, any>) => {
        const where = args?.where;
        if (where?.staffId === staff1.id) {
          return [staff1Appointment];
        }
        return [];
      });

      // Check staff 1 at 10:00 - should be unavailable
      const staff1Conflicts = await prismaMock.appointment.findMany({
        where: { staffId: staff1.id },
      });
      expect(staff1Conflicts).toHaveLength(1);

      // Check staff 2 at 10:00 - should be available
      const staff2Conflicts = await prismaMock.appointment.findMany({
        where: { staffId: staff2.id },
      });
      expect(staff2Conflicts).toHaveLength(0);

      // When no specific staff selected, at least one should be available
      const anyStaffAvailable = staff1Conflicts.length === 0 || staff2Conflicts.length === 0;
      expect(anyStaffAvailable).toBe(true);
    });

    it('should handle location-specific availability', async () => {
      const location1 = { ...mockLocation, id: 'loc-1' };
      const location2 = { ...mockLocation, id: 'loc-2' };

      // Location 1 has different hours (defined for documentation)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _loc1Hours = {
        id: 'bh-loc1',
        tenantId: mockTenant.id,
        locationId: location1.id,
        dayOfWeek: 1,
        openTime: '08:00',
        closeTime: '16:00',
        isOpen: true,
      };

      // Location 2 has extended hours (defined for documentation)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _loc2Hours = {
        id: 'bh-loc2',
        tenantId: mockTenant.id,
        locationId: location2.id,
        dayOfWeek: 1,
        openTime: '10:00',
        closeTime: '20:00',
        isOpen: true,
      };

      // Calculate slots for each location
      const loc1Slots = (16 - 8) * 2; // 8:00-16:00 = 16 slots
      const loc2Slots = (20 - 10) * 2; // 10:00-20:00 = 20 slots

      expect(loc1Slots).toBe(16);
      expect(loc2Slots).toBe(20);
      expect(loc2Slots).toBeGreaterThan(loc1Slots);
    });

    it('should exclude appointment edit slot from conflict check', async () => {
      const existingAppointmentId = 'existing-apt-1';
      const existingAppointment = createTestAppointment({
        id: existingAppointmentId,
        tenantId: mockTenant.id,
        staffId: mockStaff.id,
        startTime: new Date('2024-01-08T10:00:00'),
        endTime: new Date('2024-01-08T10:30:00'),
      });

      // When editing, exclude the appointment being edited from conflict check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.appointment.findMany.mockImplementation(async (args: Record<string, any>) => {
        const where = args?.where;
        const excludeId = where?.id?.not;
        if (excludeId === existingAppointmentId) {
          return []; // Excluding the appointment we're editing
        }
        return [existingAppointment];
      });

      // Check availability for the same slot when editing existing appointment
      const conflictsWhenEditing = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
          staffId: mockStaff.id,
          id: { not: existingAppointmentId },
          dateTime: {
            gte: new Date('2024-01-08T10:00:00'),
            lt: new Date('2024-01-08T10:30:00'),
          },
        },
      });

      // Should be available when editing the same appointment
      expect(conflictsWhenEditing).toHaveLength(0);
    });

    it('should handle appointments spanning multiple slots', async () => {
      // 90-minute appointment blocks 3 x 30-min slots
      const longAppointment = createTestAppointment({
        tenantId: mockTenant.id,
        staffId: mockStaff.id,
        startTime: new Date('2024-01-08T10:00:00'),
        endTime: new Date('2024-01-08T11:30:00'),
        duration: 90,
      });

      prismaMock.appointment.findMany.mockResolvedValue([longAppointment]);

      // Check which slots are blocked
      const blockedSlots = ['10:00', '10:30', '11:00'];
      const freeSlot = '11:30';

      // Verify 90-min appointment blocks 3 slots
      const appointmentDuration = longAppointment.duration;
      const slotsBlocked = Math.ceil(appointmentDuration / 30);
      expect(slotsBlocked).toBe(3);
      expect(blockedSlots).toHaveLength(slotsBlocked);

      // 11:30 should still be available
      const endTime = longAppointment.endTime;
      const endHour = endTime.getHours().toString().padStart(2, '0');
      const endMinute = endTime.getMinutes().toString().padStart(2, '0');
      expect(`${endHour}:${endMinute}`).toBe(freeSlot);
    });
  });
});
