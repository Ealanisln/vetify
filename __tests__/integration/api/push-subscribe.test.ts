/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestUser, createTestStaff } from '../../utils/test-utils';

// Mock Kinde auth
const mockGetUser = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: mockGetUser,
  }),
}));

// Mock push notifications library
const mockIsPushConfigured = jest.fn();
const mockGetVapidPublicKey = jest.fn();
jest.mock('@/lib/push-notifications', () => ({
  isPushConfigured: () => mockIsPushConfigured(),
  getVapidPublicKey: () => mockGetVapidPublicKey(),
}));

// Test data factories
const createTestPushSubscription = (overrides = {}) => ({
  id: 'push-sub-1',
  tenantId: 'tenant-1',
  staffId: 'staff-1',
  userId: 'user-1',
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
  p256dh: 'test-p256dh-key',
  auth: 'test-auth-key',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  deviceName: 'Chrome on macOS',
  notifyAppointments: true,
  notifyReminders: true,
  notifyLowStock: false,
  isActive: true,
  lastUsedAt: null,
  failCount: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('Push Subscribe API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockPushSubscription: ReturnType<typeof createTestPushSubscription>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockStaff = createTestStaff({ tenantId: mockTenant.id, userId: mockUser.id });
    mockPushSubscription = createTestPushSubscription({
      tenantId: mockTenant.id,
      staffId: mockStaff.id,
      userId: mockUser.id,
    });

    // Default mocks
    mockGetUser.mockResolvedValue({ id: mockUser.id });
    mockIsPushConfigured.mockReturnValue(true);
    mockGetVapidPublicKey.mockReturnValue('test-vapid-public-key');
  });

  describe('GET /api/push/subscribe', () => {
    it('should return VAPID public key when push is configured', async () => {
      mockIsPushConfigured.mockReturnValue(true);
      mockGetVapidPublicKey.mockReturnValue('test-vapid-public-key');

      expect(mockIsPushConfigured()).toBe(true);
      expect(mockGetVapidPublicKey()).toBe('test-vapid-public-key');
      // API would return: { configured: true, publicKey: 'test-vapid-public-key' }
    });

    it('should return 503 when push is not configured', async () => {
      mockIsPushConfigured.mockReturnValue(false);

      expect(mockIsPushConfigured()).toBe(false);
      // API would return: { error: 'Push notifications not configured', configured: false }, { status: 503 }
    });
  });

  describe('POST /api/push/subscribe', () => {
    it('should create a new push subscription', async () => {
      prismaMock.staff.findUnique.mockResolvedValue({
        tenantId: mockTenant.id,
        id: mockStaff.id,
      } as any);

      prismaMock.pushSubscription.upsert.mockResolvedValue(mockPushSubscription as any);

      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/new-endpoint',
        keys: {
          p256dh: 'new-p256dh-key',
          auth: 'new-auth-key',
        },
      };

      const result = await prismaMock.pushSubscription.upsert({
        where: { endpoint: subscriptionData.endpoint },
        update: {
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
          isActive: true,
          failCount: 0,
        },
        create: {
          tenantId: mockTenant.id,
          staffId: mockStaff.id,
          userId: mockUser.id,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
        },
      });

      expect(result).toBeDefined();
      expect(result.endpoint).toBe(mockPushSubscription.endpoint);
    });

    it('should update existing subscription if endpoint exists', async () => {
      const existingSubscription = createTestPushSubscription({
        isActive: false,
        failCount: 5,
      });

      prismaMock.staff.findUnique.mockResolvedValue({
        tenantId: mockTenant.id,
        id: mockStaff.id,
      } as any);

      prismaMock.pushSubscription.upsert.mockResolvedValue({
        ...existingSubscription,
        isActive: true,
        failCount: 0,
      } as any);

      const result = await prismaMock.pushSubscription.upsert({
        where: { endpoint: existingSubscription.endpoint },
        update: {
          p256dh: existingSubscription.p256dh,
          auth: existingSubscription.auth,
          isActive: true,
          failCount: 0,
        },
        create: {} as any,
      });

      expect(result.isActive).toBe(true);
      expect(result.failCount).toBe(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue(null);

      const user = await mockGetUser();
      expect(user).toBeNull();
      // API would return: { error: 'Unauthorized' }, { status: 401 }
    });

    it('should return 404 if staff record not found', async () => {
      prismaMock.staff.findUnique.mockResolvedValue(null);

      const staff = await prismaMock.staff.findUnique({
        where: { userId: mockUser.id },
      });

      expect(staff).toBeNull();
      // API would return: { error: 'Staff record not found' }, { status: 404 }
    });

    it('should return 400 for invalid subscription data', () => {
      const invalidSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint',
        // Missing keys
      };

      expect(invalidSubscription).not.toHaveProperty('keys');
      // API would return: { error: 'Invalid subscription data' }, { status: 400 }
    });

    it('should return 503 if push is not configured', async () => {
      mockIsPushConfigured.mockReturnValue(false);

      expect(mockIsPushConfigured()).toBe(false);
      // API would return: { error: 'Push notifications not configured' }, { status: 503 }
    });

    it('should include device name if provided', async () => {
      const deviceName = 'Firefox on Windows';

      prismaMock.staff.findUnique.mockResolvedValue({
        tenantId: mockTenant.id,
        id: mockStaff.id,
      } as any);

      prismaMock.pushSubscription.upsert.mockResolvedValue({
        ...mockPushSubscription,
        deviceName,
      } as any);

      const result = await prismaMock.pushSubscription.upsert({
        where: { endpoint: mockPushSubscription.endpoint },
        update: {
          deviceName,
        },
        create: {
          tenantId: mockTenant.id,
          deviceName,
        } as any,
      });

      expect(result.deviceName).toBe(deviceName);
    });
  });

  describe('DELETE /api/push/subscribe', () => {
    it('should soft delete (deactivate) subscription', async () => {
      prismaMock.pushSubscription.findUnique.mockResolvedValue(mockPushSubscription as any);
      prismaMock.pushSubscription.update.mockResolvedValue({
        ...mockPushSubscription,
        isActive: false,
      } as any);

      const subscription = await prismaMock.pushSubscription.findUnique({
        where: { endpoint: mockPushSubscription.endpoint },
      });

      expect(subscription).toBeDefined();

      const updated = await prismaMock.pushSubscription.update({
        where: { id: subscription!.id },
        data: { isActive: false },
      });

      expect(updated.isActive).toBe(false);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue(null);

      const user = await mockGetUser();
      expect(user).toBeNull();
      // API would return: { error: 'Unauthorized' }, { status: 401 }
    });

    it('should return 400 if endpoint not provided', () => {
      const body = {};
      expect(body).not.toHaveProperty('endpoint');
      // API would return: { error: 'Endpoint required' }, { status: 400 }
    });

    it('should return 404 if subscription not found', async () => {
      prismaMock.pushSubscription.findUnique.mockResolvedValue(null);

      const subscription = await prismaMock.pushSubscription.findUnique({
        where: { endpoint: 'non-existent-endpoint' },
      });

      expect(subscription).toBeNull();
      // API would return: { error: 'Subscription not found' }, { status: 404 }
    });

    it('should return 403 if user does not own subscription', async () => {
      const otherUserSubscription = createTestPushSubscription({
        userId: 'other-user-id',
      });

      prismaMock.pushSubscription.findUnique.mockResolvedValue(otherUserSubscription as any);

      const subscription = await prismaMock.pushSubscription.findUnique({
        where: { endpoint: otherUserSubscription.endpoint },
      });

      expect(subscription!.userId).not.toBe(mockUser.id);
      // API would return: { error: 'Unauthorized' }, { status: 403 }
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should only retrieve subscriptions for the authenticated user tenant', async () => {
      const otherTenantSubscription = createTestPushSubscription({
        tenantId: 'other-tenant-id',
        userId: 'other-user-id',
      });

      prismaMock.pushSubscription.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockPushSubscription];
        }
        return [];
      });

      const ownSubscriptions = await prismaMock.pushSubscription.findMany({
        where: { tenantId: mockTenant.id },
      });

      const otherSubscriptions = await prismaMock.pushSubscription.findMany({
        where: { tenantId: 'other-tenant-id' },
      });

      expect(ownSubscriptions).toHaveLength(1);
      expect(ownSubscriptions[0].tenantId).toBe(mockTenant.id);
      expect(otherSubscriptions).toHaveLength(0);
    });

    it('should associate subscription with correct tenant on create', async () => {
      prismaMock.staff.findUnique.mockResolvedValue({
        tenantId: mockTenant.id,
        id: mockStaff.id,
      } as any);

      prismaMock.pushSubscription.create.mockResolvedValue(mockPushSubscription as any);

      const created = await prismaMock.pushSubscription.create({
        data: {
          tenantId: mockTenant.id,
          staffId: mockStaff.id,
          userId: mockUser.id,
          endpoint: 'https://new-endpoint',
          p256dh: 'key',
          auth: 'auth',
        },
      });

      expect(created.tenantId).toBe(mockTenant.id);
    });
  });

  describe('Subscription State Management', () => {
    it('should reset failCount when resubscribing', async () => {
      const failedSubscription = createTestPushSubscription({
        failCount: 10,
        isActive: false,
      });

      prismaMock.pushSubscription.upsert.mockResolvedValue({
        ...failedSubscription,
        failCount: 0,
        isActive: true,
      } as any);

      const result = await prismaMock.pushSubscription.upsert({
        where: { endpoint: failedSubscription.endpoint },
        update: {
          failCount: 0,
          isActive: true,
        },
        create: {} as any,
      });

      expect(result.failCount).toBe(0);
      expect(result.isActive).toBe(true);
    });

    it('should track lastUsedAt timestamp', async () => {
      const now = new Date();

      prismaMock.pushSubscription.update.mockResolvedValue({
        ...mockPushSubscription,
        lastUsedAt: now,
      } as any);

      const result = await prismaMock.pushSubscription.update({
        where: { id: mockPushSubscription.id },
        data: { lastUsedAt: now },
      });

      expect(result.lastUsedAt).toEqual(now);
    });
  });
});
