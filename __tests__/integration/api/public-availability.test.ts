/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant } from '../../utils/test-utils';
import { GET } from '@/app/api/public/availability/route';

// Helper to create mock business hours for a tenant
function createMockBusinessHours(tenantId: string, dayOfWeek: number, overrides?: Partial<{
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  lunchStart: string | null;
  lunchEnd: string | null;
  slotDuration: number;
}>) {
  return {
    id: `bh-${dayOfWeek}`,
    tenantId,
    dayOfWeek,
    isWorkingDay: overrides?.isWorkingDay ?? true,
    startTime: overrides?.startTime ?? '09:00',
    endTime: overrides?.endTime ?? '18:00',
    lunchStart: overrides?.lunchStart ?? '13:00',
    lunchEnd: overrides?.lunchEnd ?? '14:00',
    slotDuration: overrides?.slotDuration ?? 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper to create mock tenant settings
function createMockTenantSettings(tenantId: string, businessHours: ReturnType<typeof createMockBusinessHours>[]) {
  return {
    id: 'settings-test',
    tenantId,
    defaultSlotDuration: 30,
    businessHours,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper to create a mock Request with query parameters
function createMockRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost:3000/api/public/availability');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new Request(url.toString());
}

describe('Public Availability API', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test tenant
    mockTenant = createTestTenant({
      id: 'tenant-availability-test',
      slug: 'test-clinic',
      status: 'ACTIVE',
      publicPageEnabled: true,
      publicBookingEnabled: true,
    });
  });

  describe('GET /api/public/availability', () => {
    it('should return available slots for a working day', async () => {
      // Use a future date to ensure slots aren't filtered as past
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.workingDay).toBe(true);
      expect(data.data.availableSlots).toBeDefined();
      expect(data.data.availableSlots.length).toBeGreaterThan(0);
    });

    it('should return empty slots for non-working day', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek, { isWorkingDay: false }),
        ]) as any
      );

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.workingDay).toBe(false);
      expect(data.data.availableSlots).toEqual([]);
      expect(data.data.message).toBe('Día no laborable');
    });

    it('should return empty slots for past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const dateString = pastDate.toISOString().split('T')[0];

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.workingDay).toBe(false);
      expect(data.data.availableSlots).toEqual([]);
      expect(data.data.message).toBe('No se pueden agendar citas en el pasado');
    });

    it('should exclude slots with existing appointments', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      // Create a mock appointment at 10:00
      const appointmentDateTime = new Date(futureDate);
      appointmentDateTime.setHours(10, 0, 0, 0);

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([
        {
          id: 'appt-1',
          dateTime: appointmentDateTime,
          duration: 30,
        },
      ] as any);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // 10:00 slot should not be in available slots
      const slotAt10 = data.data.availableSlots.find(
        (slot: { time: string }) => slot.time === '10:00'
      );
      expect(slotAt10).toBeUndefined();
    });

    it('should exclude slots with confirmed appointment requests', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      // Create a confirmed request at 11:00
      const requestDate = new Date(futureDate);
      requestDate.setHours(0, 0, 0, 0);

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([
        {
          id: 'req-1',
          preferredDate: requestDate,
          preferredTime: '11:00',
          status: 'CONFIRMED',
        },
      ] as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // 11:00 slot should not be in available slots
      const slotAt11 = data.data.availableSlots.find(
        (slot: { time: string }) => slot.time === '11:00'
      );
      expect(slotAt11).toBeUndefined();
    });

    it('should accept custom duration parameter', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
        duration: '60',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.duration).toBe(60);
    });

    it('should group slots by morning/afternoon periods', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek, {
            startTime: '09:00',
            endTime: '18:00',
            lunchStart: '13:00',
            lunchEnd: '14:00',
          }),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Should have both morning and afternoon slots
      const morningSlots = data.data.availableSlots.filter(
        (slot: { period: string }) => slot.period === 'morning'
      );
      const afternoonSlots = data.data.availableSlots.filter(
        (slot: { period: string }) => slot.period === 'afternoon'
      );

      expect(morningSlots.length).toBeGreaterThan(0);
      expect(afternoonSlots.length).toBeGreaterThan(0);
    });

    it('should return business hours information', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek, {
            startTime: '08:30',
            endTime: '19:00',
            lunchStart: '13:30',
            lunchEnd: '14:30',
          }),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.businessHours).toEqual({
        open: '08:30',
        close: '19:00',
        lunchStart: '13:30',
        lunchEnd: '14:30',
      });
    });

    it('should return 400 when tenantSlug is missing', async () => {
      const request = createMockRequest({
        date: '2025-01-15',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('tenantSlug y date son requeridos');
    });

    it('should return 400 when date is missing', async () => {
      const request = createMockRequest({
        tenantSlug: 'test-clinic',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('tenantSlug y date son requeridos');
    });

    it('should return 400 for invalid date format', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: 'not-a-date',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 404 for non-existent tenant', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        tenantSlug: 'non-existent-clinic',
        date: '2025-01-15',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Clínica no encontrada');
    });

    it('should return 403 when publicBookingEnabled is false', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        publicBookingEnabled: false,
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: '2025-01-15',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Reservas públicas no habilitadas');
    });

    it('should return 403 when publicPageEnabled is false', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        publicPageEnabled: false,
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: '2025-01-15',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Reservas públicas no habilitadas');
    });

    it('should return slot counts in response', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(typeof data.data.totalSlots).toBe('number');
      expect(typeof data.data.availableCount).toBe('number');
      expect(data.data.availableCount).toBeLessThanOrEqual(data.data.totalSlots);
    });

    it('should format slot times correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: dateString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.data.availableSlots.length > 0) {
        const slot = data.data.availableSlots[0];
        // Should have ISO dateTime
        expect(slot.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        // Should have 24h time format
        expect(slot.time).toMatch(/^\d{2}:\d{2}$/);
        // Should have display time (12h format)
        expect(slot.displayTime).toBeDefined();
        // Should have period
        expect(['morning', 'afternoon']).toContain(slot.period);
      }
    });

    it('should handle date with ISO format (with T)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const isoString = futureDate.toISOString();
      const dayOfWeek = futureDate.getDay();

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.tenantSettings.findUnique.mockResolvedValue(
        createMockTenantSettings(mockTenant.id, [
          createMockBusinessHours(mockTenant.id, dayOfWeek),
        ]) as any
      );
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        date: isoString,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
