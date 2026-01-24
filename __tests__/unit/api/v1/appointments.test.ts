/**
 * Tests for API v1 Appointments Endpoints
 *
 * VETIF-98: Unit tests for /api/v1/appointments
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    pet: {
      findFirst: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    staff: {
      findFirst: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
    tenantApiKey: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

// Mock rate limiter
const mockLimit = jest.fn();
jest.mock('@upstash/ratelimit', () => {
  const MockRatelimit = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
    redis: {},
  }));
  MockRatelimit.slidingWindow = jest.fn().mockReturnValue({});
  return { Ratelimit: MockRatelimit };
});

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

import { prisma } from '@/lib/prisma';
import { GET as listAppointments, POST as createAppointment } from '@/app/api/v1/appointments/route';
import { GET as getAppointment, PUT as updateAppointment, DELETE as deleteAppointment } from '@/app/api/v1/appointments/[id]/route';
import { NextRequest } from 'next/server';
import type { AuthenticatedApiKey } from '@/lib/api/api-key-auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper to create mock NextRequest
function createMockRequest(
  url: string,
  options: { headers?: Record<string, string>; body?: Record<string, unknown> } = {}
): NextRequest {
  const init: RequestInit = { headers: options.headers || {} };
  if (options.body) {
    init.method = 'POST';
    init.body = JSON.stringify(options.body);
  }
  return new NextRequest(url, init);
}

// Helper to create mock API key
function createMockApiKey(overrides: Partial<AuthenticatedApiKey> = {}): AuthenticatedApiKey {
  return {
    id: 'key-id',
    tenantId: TEST_TENANT_ID,
    name: 'Test Key',
    keyHash: 'hashed-value',
    keyPrefix: 'vfy_abc12345',
    scopes: ['read:appointments', 'write:appointments'],
    isActive: true,
    rateLimit: 1000,
    expiresAt: null,
    locationId: null,
    lastUsed: null,
    createdAt: new Date(),
    createdById: null,
    tenant: { id: TEST_TENANT_ID, name: 'Test Clinic' } as AuthenticatedApiKey['tenant'],
    location: null,
    ...overrides,
  };
}

// Helper to create mock appointment
function createMockAppointment(overrides = {}) {
  return {
    id: TEST_APPOINTMENT_ID,
    tenantId: TEST_TENANT_ID,
    locationId: null,
    petId: TEST_PET_ID,
    customerId: TEST_CUSTOMER_ID,
    staffId: null,
    userId: null,
    dateTime: new Date('2024-06-15T10:00:00Z'),
    duration: 30,
    reason: 'Annual checkup',
    notes: 'Routine exam',
    status: 'SCHEDULED',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Helper to create mock appointment with relations
function createMockAppointmentWithRelations(overrides = {}) {
  return {
    ...createMockAppointment(overrides),
    pet: { id: TEST_PET_ID, name: 'Max', species: 'Dog', breed: 'Labrador' },
    customer: { id: TEST_CUSTOMER_ID, name: 'John', email: 'john@test.com', phone: '555-1234' },
    staff: null,
    location: null,
  };
}

const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

// Valid UUIDs for testing
const TEST_TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_CUSTOMER_ID = '123e4567-e89b-12d3-a456-426614174001';
const TEST_PET_ID = '123e4567-e89b-12d3-a456-426614174002';
const TEST_APPOINTMENT_ID = '123e4567-e89b-12d3-a456-426614174003';
const TEST_STAFF_ID = '123e4567-e89b-12d3-a456-426614174004';

describe('API v1 Appointments', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    };
    mockLimit.mockResolvedValue({ success: true, remaining: 99, reset: Date.now() + 60000 });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/v1/appointments', () => {
    it('should return paginated list of appointments with relations', async () => {
      const mockApiKey = createMockApiKey();
      const mockAppointments = [
        createMockAppointmentWithRelations({ id: TEST_APPOINTMENT_ID }),
        createMockAppointmentWithRelations({ id: '123e4567-e89b-12d3-a456-426614174099', reason: 'Vaccination' }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);
      (mockPrisma.appointment.count as jest.Mock).mockResolvedValue(2);

      const request = createMockRequest('https://api.vetify.com/api/v1/appointments', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await listAppointments(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].pet).toBeDefined();
      expect(body.data[0].customer).toBeDefined();
      expect(body.data[0]).not.toHaveProperty('tenantId');
    });

    it('should filter by date range', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.appointment.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/appointments?start_date=2024-06-01&end_date=2024-06-30',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listAppointments(request);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dateTime: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter by status', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.appointment.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/appointments?status=SCHEDULED',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listAppointments(request);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SCHEDULED',
          }),
        })
      );
    });

    it('should filter by petId', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.appointment.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        `https://api.vetify.com/api/v1/appointments?petId=${TEST_PET_ID}`,
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listAppointments(request);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            petId: TEST_PET_ID,
          }),
        })
      );
    });
  });

  describe('POST /api/v1/appointments', () => {
    it('should create a new appointment', async () => {
      const mockApiKey = createMockApiKey();
      const mockPet = {
        id: TEST_PET_ID,
        tenantId: TEST_TENANT_ID,
        locationId: null,
        isDeceased: false,
        customer: { id: TEST_CUSTOMER_ID },
      };
      const newAppointment = createMockAppointmentWithRelations();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(mockPet);
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null); // No conflicts
      (mockPrisma.appointment.create as jest.Mock).mockResolvedValue(newAppointment);

      const request = createMockRequest('https://api.vetify.com/api/v1/appointments', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          dateTime: '2024-06-15T10:00:00Z',
          reason: 'Annual checkup',
          petId: TEST_PET_ID,
        },
      });

      const response = await createAppointment(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.reason).toBe('Annual checkup');
    });

    it('should validate required fields', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/appointments', {
        headers: { authorization: `Bearer ${validKey}` },
        body: { dateTime: '2024-06-15T10:00:00Z' }, // Missing petId and reason
      });

      const response = await createAppointment(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for deceased pet', async () => {
      const deceasedPetId = '123e4567-e89b-12d3-a456-426614174999';
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(null); // Pet not found (or deceased)

      const request = createMockRequest('https://api.vetify.com/api/v1/appointments', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          dateTime: '2024-06-15T10:00:00Z',
          reason: 'Checkup',
          petId: deceasedPetId,
        },
      });

      const response = await createAppointment(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain('Pet');
    });

    it('should detect staff schedule conflicts', async () => {
      const mockApiKey = createMockApiKey();
      const mockPet = {
        id: TEST_PET_ID,
        tenantId: TEST_TENANT_ID,
        locationId: null,
        isDeceased: false,
        customer: { id: TEST_CUSTOMER_ID },
      };
      const mockStaff = { id: TEST_STAFF_ID, tenantId: TEST_TENANT_ID, isActive: true };
      const existingAppointment = createMockAppointment({
        staffId: TEST_STAFF_ID,
        dateTime: new Date('2024-06-15T10:15:00Z'),
      });

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(mockPet);
      (mockPrisma.staff.findFirst as jest.Mock).mockResolvedValue(mockStaff);
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(existingAppointment);

      const request = createMockRequest('https://api.vetify.com/api/v1/appointments', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          dateTime: '2024-06-15T10:00:00Z',
          reason: 'Checkup',
          petId: TEST_PET_ID,
          staffId: TEST_STAFF_ID,
        },
      });

      const response = await createAppointment(request);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/appointments/:id', () => {
    it('should return a single appointment with relations', async () => {
      const mockApiKey = createMockApiKey();
      const mockAppointment = createMockAppointmentWithRelations();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(mockAppointment);

      const request = createMockRequest(`https://api.vetify.com/api/v1/appointments/${TEST_APPOINTMENT_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getAppointment(request, {
        params: Promise.resolve({ id: TEST_APPOINTMENT_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe(TEST_APPOINTMENT_ID);
      expect(body.data.pet).toBeDefined();
    });

    it('should return 404 for non-existent appointment', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest(`https://api.vetify.com/api/v1/appointments/${nonExistentId}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getAppointment(request, {
        params: Promise.resolve({ id: nonExistentId }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/appointments/:id', () => {
    it('should update an appointment', async () => {
      const mockApiKey = createMockApiKey();
      const existingAppointment = createMockAppointment();
      const updatedAppointment = createMockAppointmentWithRelations({ status: 'CONFIRMED' });

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findFirst as jest.Mock)
        .mockResolvedValueOnce(existingAppointment) // First call: check exists
        .mockResolvedValueOnce(null); // Second call: no conflicts
      (mockPrisma.appointment.update as jest.Mock).mockResolvedValue(updatedAppointment);

      const request = createMockRequest(`https://api.vetify.com/api/v1/appointments/${TEST_APPOINTMENT_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
        body: { status: 'CONFIRMED' },
      });

      const response = await updateAppointment(request, {
        params: Promise.resolve({ id: TEST_APPOINTMENT_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.status).toBe('CONFIRMED');
    });

    it('should not allow modifying completed appointments', async () => {
      const mockApiKey = createMockApiKey();
      const completedAppointment = createMockAppointment({ status: 'COMPLETED' });

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      // Reset to clear any previous mockResolvedValueOnce queue
      (mockPrisma.appointment.findFirst as jest.Mock).mockReset();
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(completedAppointment);

      const request = createMockRequest(`https://api.vetify.com/api/v1/appointments/${TEST_APPOINTMENT_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
        body: { reason: 'Updated reason' },
      });

      const response = await updateAppointment(request, {
        params: Promise.resolve({ id: TEST_APPOINTMENT_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/v1/appointments/:id', () => {
    it('should cancel an appointment', async () => {
      const mockApiKey = createMockApiKey();
      const existingAppointment = createMockAppointment();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(existingAppointment);
      (mockPrisma.appointment.update as jest.Mock).mockResolvedValue({
        ...existingAppointment,
        status: 'CANCELLED_CLINIC',
      });

      const request = createMockRequest(`https://api.vetify.com/api/v1/appointments/${TEST_APPOINTMENT_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await deleteAppointment(request, {
        params: Promise.resolve({ id: TEST_APPOINTMENT_ID }),
      });

      expect(response.status).toBe(204);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: TEST_APPOINTMENT_ID },
        data: { status: 'CANCELLED_CLINIC' },
      });
    });

    it('should not cancel already completed appointment', async () => {
      const mockApiKey = createMockApiKey();
      const completedAppointment = createMockAppointment({ status: 'COMPLETED' });

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(completedAppointment);

      const request = createMockRequest(`https://api.vetify.com/api/v1/appointments/${TEST_APPOINTMENT_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await deleteAppointment(request, {
        params: Promise.resolve({ id: TEST_APPOINTMENT_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.code).toBe('CONFLICT');
    });
  });
});
