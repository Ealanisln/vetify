 

// Mock web-push before importing the module
const mockSendNotification = jest.fn();
const mockSetVapidDetails = jest.fn();
class MockWebPushError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'WebPushError';
  }
}

jest.mock('web-push', () => ({
  sendNotification: mockSendNotification,
  setVapidDetails: mockSetVapidDetails,
  WebPushError: MockWebPushError,
}));

// Store original env
const originalEnv = process.env;

describe('Push Notifications Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup default env
    process.env = {
      ...originalEnv,
      VAPID_PUBLIC_KEY: 'test-public-key',
      VAPID_PRIVATE_KEY: 'test-private-key',
      VAPID_SUBJECT: 'mailto:test@example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isPushConfigured()', () => {
    it('should return true when VAPID keys are configured', async () => {
      const { isPushConfigured } = await import('@/lib/push-notifications');

      expect(isPushConfigured()).toBe(true);
    });

    it('should return false when VAPID_PUBLIC_KEY is missing', async () => {
      process.env.VAPID_PUBLIC_KEY = '';
      jest.resetModules();

      const { isPushConfigured } = await import('@/lib/push-notifications');

      expect(isPushConfigured()).toBe(false);
    });

    it('should return false when VAPID_PRIVATE_KEY is missing', async () => {
      process.env.VAPID_PRIVATE_KEY = '';
      jest.resetModules();

      const { isPushConfigured } = await import('@/lib/push-notifications');

      expect(isPushConfigured()).toBe(false);
    });

    it('should return false when both keys are missing', async () => {
      process.env.VAPID_PUBLIC_KEY = '';
      process.env.VAPID_PRIVATE_KEY = '';
      jest.resetModules();

      const { isPushConfigured } = await import('@/lib/push-notifications');

      expect(isPushConfigured()).toBe(false);
    });
  });

  describe('getVapidPublicKey()', () => {
    it('should return the public key', async () => {
      const { getVapidPublicKey } = await import('@/lib/push-notifications');

      expect(getVapidPublicKey()).toBe('test-public-key');
    });

    it('should return empty string when not configured', async () => {
      process.env.VAPID_PUBLIC_KEY = '';
      jest.resetModules();

      const { getVapidPublicKey } = await import('@/lib/push-notifications');

      expect(getVapidPublicKey()).toBe('');
    });
  });

  describe('sendPushNotification()', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh',
        auth: 'test-auth',
      },
    };

    const mockPayload = {
      title: 'Test Notification',
      body: 'Test body',
    };

    it('should send notification successfully', async () => {
      mockSendNotification.mockResolvedValue({});
      const { sendPushNotification } = await import('@/lib/push-notifications');

      const result = await sendPushNotification(mockSubscription, mockPayload);

      expect(result.success).toBe(true);
      expect(mockSendNotification).toHaveBeenCalledWith(
        {
          endpoint: mockSubscription.endpoint,
          keys: mockSubscription.keys,
        },
        JSON.stringify(mockPayload)
      );
    });

    it('should return error when push is not configured', async () => {
      process.env.VAPID_PUBLIC_KEY = '';
      process.env.VAPID_PRIVATE_KEY = '';
      jest.resetModules();

      const { sendPushNotification } = await import('@/lib/push-notifications');

      const result = await sendPushNotification(mockSubscription, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Push notifications not configured');
    });

    it('should handle subscription expired error (410)', async () => {
      const webPushError = new MockWebPushError('Gone', 410);
      mockSendNotification.mockRejectedValue(webPushError);

      const { sendPushNotification } = await import('@/lib/push-notifications');

      const result = await sendPushNotification(mockSubscription, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('subscription_expired');
    });

    it('should handle subscription not found error (404)', async () => {
      const webPushError = new MockWebPushError('Not Found', 404);
      mockSendNotification.mockRejectedValue(webPushError);

      const { sendPushNotification } = await import('@/lib/push-notifications');

      const result = await sendPushNotification(mockSubscription, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('subscription_expired');
    });

    it('should handle generic errors', async () => {
      mockSendNotification.mockRejectedValue(new Error('Network error'));

      const { sendPushNotification } = await import('@/lib/push-notifications');

      const result = await sendPushNotification(mockSubscription, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendBulkNotifications()', () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        subscription: {
          endpoint: 'https://endpoint-1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      },
      {
        id: 'sub-2',
        subscription: {
          endpoint: 'https://endpoint-2',
          keys: { p256dh: 'key2', auth: 'auth2' },
        },
      },
    ];

    const mockPayload = {
      title: 'Bulk Test',
      body: 'Bulk body',
    };

    it('should send to multiple subscriptions', async () => {
      mockSendNotification.mockResolvedValue({});
      const { sendBulkNotifications } = await import('@/lib/push-notifications');

      const results = await sendBulkNotifications(mockSubscriptions, mockPayload);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].id).toBe('sub-1');
      expect(results[1].success).toBe(true);
      expect(results[1].id).toBe('sub-2');
    });

    it('should handle partial failures', async () => {
      mockSendNotification
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Failed'));

      const { sendBulkNotifications } = await import('@/lib/push-notifications');

      const results = await sendBulkNotifications(mockSubscriptions, mockPayload);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it('should return empty array for empty subscriptions', async () => {
      const { sendBulkNotifications } = await import('@/lib/push-notifications');

      const results = await sendBulkNotifications([], mockPayload);

      expect(results).toHaveLength(0);
    });
  });

  describe('NotificationTypes', () => {
    it('should export all notification types', async () => {
      const { NotificationTypes } = await import('@/lib/push-notifications');

      expect(NotificationTypes.APPOINTMENT_REMINDER).toBe('appointment_reminder');
      expect(NotificationTypes.APPOINTMENT_CONFIRMATION).toBe('appointment_confirmation');
      expect(NotificationTypes.APPOINTMENT_CANCELLED).toBe('appointment_cancelled');
      expect(NotificationTypes.LOW_STOCK_ALERT).toBe('low_stock_alert');
      expect(NotificationTypes.TREATMENT_REMINDER).toBe('treatment_reminder');
      expect(NotificationTypes.NEW_APPOINTMENT_REQUEST).toBe('new_appointment_request');
    });
  });

  describe('createNotificationPayload()', () => {
    it('should create appointment reminder payload', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.APPOINTMENT_REMINDER, {
        petName: 'Luna',
        appointmentId: 'apt-123',
      });

      expect(payload.title).toBe('Recordatorio de Cita');
      expect(payload.body).toContain('Luna');
      expect(payload.tag).toBe('appointment-apt-123');
      expect(payload.actions).toHaveLength(2);
    });

    it('should create appointment confirmation payload', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.APPOINTMENT_CONFIRMATION, {
        petName: 'Max',
        appointmentId: 'apt-456',
      });

      expect(payload.title).toBe('Cita Confirmada');
      expect(payload.body).toContain('Max');
      expect(payload.body).toContain('confirmada');
    });

    it('should create appointment cancelled payload', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.APPOINTMENT_CANCELLED, {
        petName: 'Buddy',
        appointmentId: 'apt-789',
      });

      expect(payload.title).toBe('Cita Cancelada');
      expect(payload.body).toContain('cancelada');
    });

    it('should create low stock alert payload', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.LOW_STOCK_ALERT, {
        itemName: 'Vacuna Antirrábica',
        itemId: 'item-123',
        quantity: 5,
      });

      expect(payload.title).toBe('Alerta de Stock Bajo');
      expect(payload.body).toContain('Vacuna Antirrábica');
      expect(payload.body).toContain('5 unidades');
    });

    it('should create treatment reminder payload', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.TREATMENT_REMINDER, {
        petName: 'Rocky',
        treatmentType: 'desparasitación',
        scheduleId: 'sch-123',
      });

      expect(payload.title).toBe('Recordatorio de Tratamiento');
      expect(payload.body).toContain('Rocky');
      expect(payload.body).toContain('desparasitación');
    });

    it('should create new appointment request payload', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.NEW_APPOINTMENT_REQUEST, {
        customerName: 'Juan García',
        requestId: 'req-123',
      });

      expect(payload.title).toBe('Nueva Solicitud de Cita');
      expect(payload.body).toContain('Juan García');
    });

    it('should include default icon and badge', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.APPOINTMENT_REMINDER, {
        petName: 'Luna',
        appointmentId: 'apt-123',
      });

      expect(payload.icon).toBe('/favicon/android-chrome-192x192.png');
      expect(payload.badge).toBe('/favicon/favicon-96x96.png');
    });

    it('should include notification type in data', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.LOW_STOCK_ALERT, {
        itemName: 'Test Item',
        itemId: 'item-1',
        quantity: 3,
      });

      expect(payload.data?.type).toBe('low_stock_alert');
    });

    it('should use fallback text when pet name not provided', async () => {
      const { createNotificationPayload, NotificationTypes } = await import(
        '@/lib/push-notifications'
      );

      const payload = createNotificationPayload(NotificationTypes.APPOINTMENT_REMINDER, {
        appointmentId: 'apt-123',
      });

      expect(payload.body).toContain('tu mascota');
    });
  });
});
