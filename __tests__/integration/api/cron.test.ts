/**
 * Cron Jobs API Integration Tests
 *
 * Tests for the automation system cron endpoints:
 * - /api/cron/daily-tasks (orchestrator)
 * - /api/cron/appointment-reminders
 * - /api/cron/treatment-reminders
 * - /api/cron/inventory-alerts
 *
 * @see VETIF-55
 */

import { NextRequest } from 'next/server';
import {
  createMockCronRequest,
  createMockInventoryResult,
  createMockAppointmentReminderResult,
  createMockTreatmentReminderResult,
} from '../../utils/test-utils';

// Mock library functions BEFORE importing route handlers
jest.mock('@/lib/email/inventory-alerts', () => ({
  checkAllTenantsInventory: jest.fn(),
}));

jest.mock('@/lib/email/reminder-alerts', () => ({
  processAppointmentReminders: jest.fn(),
  processTreatmentReminders: jest.fn(),
}));

// Import route handlers after mocks are set up
import { GET as dailyTasksHandler } from '@/app/api/cron/daily-tasks/route';
import { GET as appointmentRemindersHandler } from '@/app/api/cron/appointment-reminders/route';
import { GET as treatmentRemindersHandler } from '@/app/api/cron/treatment-reminders/route';
import { GET as inventoryAlertsHandler } from '@/app/api/cron/inventory-alerts/route';

// Import mocked functions for control
import { checkAllTenantsInventory } from '@/lib/email/inventory-alerts';
import {
  processAppointmentReminders,
  processTreatmentReminders,
} from '@/lib/email/reminder-alerts';

const VALID_CRON_SECRET = 'test-cron-secret-12345';

describe('Cron Jobs API Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: VALID_CRON_SECRET };

    // Setup default successful mocks
    (checkAllTenantsInventory as jest.Mock).mockResolvedValue(
      createMockInventoryResult()
    );
    (processAppointmentReminders as jest.Mock).mockResolvedValue(
      createMockAppointmentReminderResult()
    );
    (processTreatmentReminders as jest.Mock).mockResolvedValue(
      createMockTreatmentReminderResult()
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ============================================
  // Section A: Authentication Tests (4 tests)
  // ============================================
  describe('Authentication (All Routes)', () => {
    const routes = [
      { name: 'daily-tasks', handler: dailyTasksHandler },
      { name: 'appointment-reminders', handler: appointmentRemindersHandler },
      { name: 'treatment-reminders', handler: treatmentRemindersHandler },
      { name: 'inventory-alerts', handler: inventoryAlertsHandler },
    ];

    describe('should return 401 without Authorization header', () => {
      it.each(routes)('$name route', async ({ handler }) => {
        const request = createMockCronRequest() as NextRequest;
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('should return 401 with invalid Bearer token', () => {
      it.each(routes)('$name route', async ({ handler }) => {
        const request = createMockCronRequest(
          'Bearer invalid-token'
        ) as NextRequest;
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('should return 401 when CRON_SECRET is not configured', () => {
      it.each(routes)('$name route', async ({ handler }) => {
        delete process.env.CRON_SECRET;

        const request = createMockCronRequest(
          `Bearer ${VALID_CRON_SECRET}`
        ) as NextRequest;
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('should return 200 with valid CRON_SECRET', () => {
      it.each(routes)('$name route', async ({ handler }) => {
        const request = createMockCronRequest(
          `Bearer ${VALID_CRON_SECRET}`
        ) as NextRequest;
        const response = await handler(request);

        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================
  // Section B: Daily Tasks Route Tests (5 tests)
  // ============================================
  describe('GET /api/cron/daily-tasks', () => {
    it('should return 200 when all sub-tasks succeed', async () => {
      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await dailyTasksHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.inventory.success).toBe(true);
      expect(data.results.appointments.success).toBe(true);
      expect(data.results.treatments.success).toBe(true);
      expect(data.timestamp).toBeDefined();
      expect(data.errors).toBeUndefined();
    });

    it('should return 207 Multi-Status on partial failure', async () => {
      // Make appointments fail
      (processAppointmentReminders as jest.Mock).mockRejectedValue(
        new Error('SMTP connection failed')
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await dailyTasksHandler(request);
      const data = await response.json();

      expect(response.status).toBe(207);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
      expect(data.errors).toContain('appointments: SMTP connection failed');
      // Other tasks should still succeed
      expect(data.results.inventory.success).toBe(true);
      expect(data.results.treatments.success).toBe(true);
    });

    it('should aggregate error messages correctly', async () => {
      // Make inventory and treatments fail
      (checkAllTenantsInventory as jest.Mock).mockRejectedValue(
        new Error('Database timeout')
      );
      (processTreatmentReminders as jest.Mock).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await dailyTasksHandler(request);
      const data = await response.json();

      expect(response.status).toBe(207);
      expect(data.errors).toHaveLength(2);
      expect(data.errors).toContain('inventory: Database timeout');
      expect(data.errors).toContain('treatments: Email service unavailable');
      // Appointments should still succeed
      expect(data.results.appointments.success).toBe(true);
    });

    it('should return 207 when all tasks fail', async () => {
      (checkAllTenantsInventory as jest.Mock).mockRejectedValue(
        new Error('Inventory error')
      );
      (processAppointmentReminders as jest.Mock).mockRejectedValue(
        new Error('Appointment error')
      );
      (processTreatmentReminders as jest.Mock).mockRejectedValue(
        new Error('Treatment error')
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await dailyTasksHandler(request);
      const data = await response.json();

      expect(response.status).toBe(207);
      expect(data.success).toBe(false);
      expect(data.errors).toHaveLength(3);
      expect(data.results.inventory.success).toBe(false);
      expect(data.results.appointments.success).toBe(false);
      expect(data.results.treatments.success).toBe(false);
    });

    it('should include correct result structure with all expected keys', async () => {
      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await dailyTasksHandler(request);
      const data = await response.json();

      // Verify top-level structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('timestamp');

      // Verify results structure
      expect(data.results).toHaveProperty('inventory');
      expect(data.results).toHaveProperty('appointments');
      expect(data.results).toHaveProperty('treatments');

      // Verify inventory result structure
      expect(data.results.inventory).toHaveProperty('success');
      expect(data.results.inventory).toHaveProperty('tenantsChecked');
      expect(data.results.inventory).toHaveProperty('alertsSent');

      // Verify appointments result structure
      expect(data.results.appointments).toHaveProperty('success');
      expect(data.results.appointments).toHaveProperty('appointmentsChecked');
      expect(data.results.appointments).toHaveProperty('emailsSent');

      // Verify treatments result structure
      expect(data.results.treatments).toHaveProperty('success');
      expect(data.results.treatments).toHaveProperty('remindersProcessed');
      expect(data.results.treatments).toHaveProperty('emailsSent');
    });
  });

  // ============================================
  // Section C: Appointment Reminders Tests (4 tests)
  // ============================================
  describe('GET /api/cron/appointment-reminders', () => {
    it('should return success with appointments checked and emails sent', async () => {
      (processAppointmentReminders as jest.Mock).mockResolvedValue(
        createMockAppointmentReminderResult({
          appointmentsChecked: 15,
          emailsSent: 12,
        })
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await appointmentRemindersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.appointmentsChecked).toBe(15);
      expect(data.emailsSent).toBe(12);
      expect(data.timestamp).toBeDefined();
      expect(data.errors).toBeUndefined();
    });

    it('should handle no appointments in 24-hour window', async () => {
      (processAppointmentReminders as jest.Mock).mockResolvedValue(
        createMockAppointmentReminderResult({
          appointmentsChecked: 0,
          emailsSent: 0,
        })
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await appointmentRemindersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.appointmentsChecked).toBe(0);
      expect(data.emailsSent).toBe(0);
    });

    it('should return 500 on processing error', async () => {
      (processAppointmentReminders as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await appointmentRemindersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
      expect(data.timestamp).toBeDefined();
    });

    it('should include errors array when partial failures occur', async () => {
      (processAppointmentReminders as jest.Mock).mockResolvedValue(
        createMockAppointmentReminderResult({
          success: false,
          appointmentsChecked: 10,
          emailsSent: 7,
          errors: ['Failed to send email to customer-1', 'Invalid email for customer-5'],
        })
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await appointmentRemindersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.errors).toHaveLength(2);
      expect(data.errors).toContain('Failed to send email to customer-1');
    });
  });

  // ============================================
  // Section D: Treatment Reminders Tests (3 tests)
  // ============================================
  describe('GET /api/cron/treatment-reminders', () => {
    it('should return success with reminders processed and emails sent', async () => {
      (processTreatmentReminders as jest.Mock).mockResolvedValue(
        createMockTreatmentReminderResult({
          remindersProcessed: 8,
          emailsSent: 8,
        })
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await treatmentRemindersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.remindersProcessed).toBe(8);
      expect(data.emailsSent).toBe(8);
      expect(data.timestamp).toBeDefined();
      expect(data.errors).toBeUndefined();
    });

    it('should handle no pending reminders', async () => {
      (processTreatmentReminders as jest.Mock).mockResolvedValue(
        createMockTreatmentReminderResult({
          remindersProcessed: 0,
          emailsSent: 0,
        })
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await treatmentRemindersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.remindersProcessed).toBe(0);
      expect(data.emailsSent).toBe(0);
    });

    it('should return 500 on processing error', async () => {
      (processTreatmentReminders as jest.Mock).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await treatmentRemindersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email service unavailable');
      expect(data.timestamp).toBeDefined();
    });
  });

  // ============================================
  // Section E: Inventory Alerts Tests (2 tests)
  // ============================================
  describe('GET /api/cron/inventory-alerts', () => {
    it('should return success with tenants checked and alerts sent', async () => {
      (checkAllTenantsInventory as jest.Mock).mockResolvedValue(
        createMockInventoryResult({
          tenantsChecked: 10,
          totalAlertsSent: 4,
        })
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await inventoryAlertsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tenantsChecked).toBe(10);
      expect(data.alertsSent).toBe(4);
      expect(data.timestamp).toBeDefined();
      expect(data.errors).toBeUndefined();
    });

    it('should return 500 on processing error', async () => {
      (checkAllTenantsInventory as jest.Mock).mockRejectedValue(
        new Error('Failed to connect to database')
      );

      const request = createMockCronRequest(
        `Bearer ${VALID_CRON_SECRET}`
      ) as NextRequest;
      const response = await inventoryAlertsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to connect to database');
      expect(data.timestamp).toBeDefined();
    });
  });
});
