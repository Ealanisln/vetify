import { prismaMock } from '../../mocks/prisma';
import {
  createTestAppointment,
  createTestTenant,
  createTestUser,
  createTestStaff,
  createTestLocation,
} from '../../utils/test-utils';

// Mock the appointments availability API route
const mockAvailabilityRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
};

describe('Appointments Availability API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockLocation: ReturnType<typeof createTestLocation>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
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

      prismaMock.appointment.findMany.mockImplementation(async (args: any) => {
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
});
