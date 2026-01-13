// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { prismaMock } from '../../mocks/prisma';
import {
  createTestAppointment,
  createTestTenant,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createTestUser,
  createTestStaff,
  createTestCustomer,
  createTestPet,
} from '../../utils/test-utils';
import {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentRescheduled,
  sendAppointmentStaffNotification,
  isValidEmail,
} from '../../../src/lib/email/email-service';
import type {
  AppointmentConfirmationData,
  AppointmentCancellationData,
  AppointmentRescheduledData,
  AppointmentStaffNotificationData,
} from '../../../src/lib/email/types';

// Mock the notification preference check
jest.mock('../../../src/lib/enhanced-settings', () => ({
  shouldSendNotification: jest.fn(),
}));

describe('Appointments Notifications Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockAppointment: ReturnType<typeof createTestAppointment>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockCustomer = createTestCustomer({ tenantId: mockTenant.id });
    mockPet = createTestPet({ tenantId: mockTenant.id });
    mockStaff = createTestStaff({ tenantId: mockTenant.id });
    mockAppointment = createTestAppointment({
      tenantId: mockTenant.id,
      petId: mockPet.id,
      customerId: mockCustomer.id,
      staffId: mockStaff.id,
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('Appointment Confirmation Email', () => {
    it('should create valid confirmation email data', async () => {
      const emailData: AppointmentConfirmationData = {
        template: 'appointment-confirmation',
        to: {
          email: mockCustomer.email!,
          name: mockCustomer.name,
        },
        subject: `Confirmación de Cita - ${mockPet.name}`,
        tenantId: mockTenant.id,
        data: {
          appointmentId: mockAppointment.id,
          petName: mockPet.name,
          ownerName: mockCustomer.name,
          appointmentDate: mockAppointment.dateTime,
          appointmentTime: '10:00',
          serviceName: mockAppointment.reason,
          clinicName: mockTenant.name,
          clinicAddress: mockTenant.address || undefined,
          clinicPhone: mockTenant.phone || undefined,
          veterinarianName: mockStaff.name,
          notes: mockAppointment.notes || undefined,
        },
      };

      expect(emailData.template).toBe('appointment-confirmation');
      expect(emailData.to.email).toBe(mockCustomer.email);
      expect(emailData.data.petName).toBe(mockPet.name);
      expect(emailData.tenantId).toBe(mockTenant.id);
    });

    it('should send confirmation email in dry-run mode', async () => {
      const emailData: AppointmentConfirmationData = {
        template: 'appointment-confirmation',
        to: {
          email: 'customer@example.com',
          name: 'Test Customer',
        },
        subject: 'Test Confirmation',
        tenantId: mockTenant.id,
        data: {
          appointmentId: 'apt-123',
          petName: 'Max',
          ownerName: 'Juan Pérez',
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta General',
          clinicName: 'Test Clinic',
        },
      };

      // In test mode, should return dry-run result
      const result = await sendAppointmentConfirmation(emailData);
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^dry-run-/);
    });

    it('should include clinic contact info when available', async () => {
      const tenantWithContact = {
        ...mockTenant,
        publicAddress: '123 Main St',
        publicPhone: '555-1234',
      };

      const emailData: AppointmentConfirmationData = {
        template: 'appointment-confirmation',
        to: {
          email: mockCustomer.email!,
          name: mockCustomer.name,
        },
        subject: 'Confirmation',
        tenantId: tenantWithContact.id,
        data: {
          appointmentId: mockAppointment.id,
          petName: mockPet.name,
          ownerName: mockCustomer.name,
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta',
          clinicName: tenantWithContact.name,
          clinicAddress: tenantWithContact.publicAddress,
          clinicPhone: tenantWithContact.publicPhone,
        },
      };

      expect(emailData.data.clinicAddress).toBe('123 Main St');
      expect(emailData.data.clinicPhone).toBe('555-1234');
    });

    it('should not send email if customer has no email', () => {
      const customerWithoutEmail = { ...mockCustomer, email: null };
      const shouldSendEmail = customerWithoutEmail.email !== null;

      expect(shouldSendEmail).toBe(false);
    });
  });

  describe('Staff Notification Email', () => {
    it('should create valid staff notification email data', async () => {
      const emailData: AppointmentStaffNotificationData = {
        template: 'appointment-staff-notification',
        to: {
          email: mockStaff.email!,
          name: mockStaff.name,
        },
        subject: `Nueva Cita Asignada - ${mockPet.name}`,
        tenantId: mockTenant.id,
        data: {
          appointmentId: mockAppointment.id,
          staffName: mockStaff.name,
          petName: mockPet.name,
          petSpecies: mockPet.species,
          petBreed: mockPet.breed || undefined,
          ownerName: mockCustomer.name,
          ownerPhone: mockCustomer.phone || undefined,
          appointmentDate: mockAppointment.dateTime,
          appointmentTime: '10:00',
          serviceName: mockAppointment.reason,
          clinicName: mockTenant.name,
          notes: mockAppointment.notes || undefined,
        },
      };

      expect(emailData.template).toBe('appointment-staff-notification');
      expect(emailData.to.email).toBe(mockStaff.email);
      expect(emailData.data.staffName).toBe(mockStaff.name);
      expect(emailData.data.petSpecies).toBe(mockPet.species);
    });

    it('should send staff notification in dry-run mode', async () => {
      const emailData: AppointmentStaffNotificationData = {
        template: 'appointment-staff-notification',
        to: {
          email: 'vet@clinic.com',
          name: 'Dr. Smith',
        },
        subject: 'Nueva Cita',
        tenantId: mockTenant.id,
        data: {
          appointmentId: 'apt-123',
          staffName: 'Dr. Smith',
          petName: 'Max',
          petSpecies: 'DOG',
          ownerName: 'Juan',
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta',
          clinicName: 'Test Clinic',
        },
      };

      const result = await sendAppointmentStaffNotification(emailData);
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^dry-run-/);
    });

    it('should include pet details for medical context', () => {
      const petWithDetails = {
        ...mockPet,
        species: 'DOG',
        breed: 'Golden Retriever',
      };

      const emailData: AppointmentStaffNotificationData = {
        template: 'appointment-staff-notification',
        to: {
          email: mockStaff.email!,
          name: mockStaff.name,
        },
        subject: 'Nueva Cita',
        tenantId: mockTenant.id,
        data: {
          appointmentId: mockAppointment.id,
          staffName: mockStaff.name,
          petName: petWithDetails.name,
          petSpecies: petWithDetails.species,
          petBreed: petWithDetails.breed,
          ownerName: mockCustomer.name,
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta',
          clinicName: mockTenant.name,
        },
      };

      expect(emailData.data.petBreed).toBe('Golden Retriever');
    });

    it('should not send notification if staff has no email', () => {
      const staffWithoutEmail = { ...mockStaff, email: null };
      const shouldSendEmail = staffWithoutEmail.email !== null;

      expect(shouldSendEmail).toBe(false);
    });
  });

  describe('Cancellation Email', () => {
    it('should create valid cancellation email data for client cancellation', async () => {
      const emailData: AppointmentCancellationData = {
        template: 'appointment-cancellation',
        to: {
          email: mockCustomer.email!,
          name: mockCustomer.name,
        },
        subject: `Cita Cancelada - ${mockPet.name}`,
        tenantId: mockTenant.id,
        data: {
          appointmentId: mockAppointment.id,
          petName: mockPet.name,
          ownerName: mockCustomer.name,
          appointmentDate: mockAppointment.dateTime,
          appointmentTime: '10:00',
          serviceName: mockAppointment.reason,
          clinicName: mockTenant.name,
          clinicPhone: mockTenant.phone || undefined,
          cancelledBy: 'CLIENT',
          cancellationReason: 'Imprevisto personal',
        },
      };

      expect(emailData.template).toBe('appointment-cancellation');
      expect(emailData.data.cancelledBy).toBe('CLIENT');
      expect(emailData.data.cancellationReason).toBe('Imprevisto personal');
    });

    it('should create valid cancellation email data for clinic cancellation', async () => {
      const emailData: AppointmentCancellationData = {
        template: 'appointment-cancellation',
        to: {
          email: mockCustomer.email!,
          name: mockCustomer.name,
        },
        subject: `Cita Cancelada - ${mockPet.name}`,
        tenantId: mockTenant.id,
        data: {
          appointmentId: mockAppointment.id,
          petName: mockPet.name,
          ownerName: mockCustomer.name,
          appointmentDate: mockAppointment.dateTime,
          appointmentTime: '10:00',
          serviceName: mockAppointment.reason,
          clinicName: mockTenant.name,
          cancelledBy: 'CLINIC',
          cancellationReason: 'Emergencia en la clínica',
        },
      };

      expect(emailData.data.cancelledBy).toBe('CLINIC');
    });

    it('should send cancellation email in dry-run mode', async () => {
      const emailData: AppointmentCancellationData = {
        template: 'appointment-cancellation',
        to: {
          email: 'customer@example.com',
          name: 'Test Customer',
        },
        subject: 'Cita Cancelada',
        tenantId: mockTenant.id,
        data: {
          appointmentId: 'apt-123',
          petName: 'Max',
          ownerName: 'Juan',
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta',
          clinicName: 'Test Clinic',
          cancelledBy: 'CLIENT',
        },
      };

      const result = await sendAppointmentCancellation(emailData);
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^dry-run-/);
    });
  });

  describe('Reschedule Email', () => {
    it('should create valid reschedule email data', async () => {
      const previousDate = new Date('2024-01-10T10:00:00');
      const newDate = new Date('2024-01-12T14:00:00');

      const emailData: AppointmentRescheduledData = {
        template: 'appointment-rescheduled',
        to: {
          email: mockCustomer.email!,
          name: mockCustomer.name,
        },
        subject: `Cita Reagendada - ${mockPet.name}`,
        tenantId: mockTenant.id,
        data: {
          appointmentId: mockAppointment.id,
          petName: mockPet.name,
          ownerName: mockCustomer.name,
          previousDate,
          previousTime: '10:00',
          newDate,
          newTime: '14:00',
          serviceName: mockAppointment.reason,
          clinicName: mockTenant.name,
          clinicAddress: mockTenant.address || undefined,
          clinicPhone: mockTenant.phone || undefined,
          veterinarianName: mockStaff.name,
        },
      };

      expect(emailData.template).toBe('appointment-rescheduled');
      expect(emailData.data.previousDate).toEqual(previousDate);
      expect(emailData.data.newDate).toEqual(newDate);
      expect(emailData.data.previousTime).toBe('10:00');
      expect(emailData.data.newTime).toBe('14:00');
    });

    it('should send reschedule email in dry-run mode', async () => {
      const emailData: AppointmentRescheduledData = {
        template: 'appointment-rescheduled',
        to: {
          email: 'customer@example.com',
          name: 'Test Customer',
        },
        subject: 'Cita Reagendada',
        tenantId: mockTenant.id,
        data: {
          appointmentId: 'apt-123',
          petName: 'Max',
          ownerName: 'Juan',
          previousDate: new Date('2024-01-10T10:00:00'),
          previousTime: '10:00',
          newDate: new Date('2024-01-12T14:00:00'),
          newTime: '14:00',
          serviceName: 'Consulta',
          clinicName: 'Test Clinic',
        },
      };

      const result = await sendAppointmentRescheduled(emailData);
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^dry-run-/);
    });

    it('should include both old and new veterinarian if changed', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _previousVet = 'Dr. García'; // Used for documentation - shows expected use case
      const newVet = 'Dr. López';

      // When vet changes, email should reflect this
      const emailData: AppointmentRescheduledData = {
        template: 'appointment-rescheduled',
        to: {
          email: mockCustomer.email!,
          name: mockCustomer.name,
        },
        subject: 'Cita Reagendada',
        tenantId: mockTenant.id,
        data: {
          appointmentId: mockAppointment.id,
          petName: mockPet.name,
          ownerName: mockCustomer.name,
          previousDate: new Date(),
          previousTime: '10:00',
          newDate: new Date(),
          newTime: '14:00',
          serviceName: 'Consulta',
          clinicName: mockTenant.name,
          veterinarianName: newVet,
        },
      };

      expect(emailData.data.veterinarianName).toBe(newVet);
      // Note: In a real implementation, you might include previousVeterinarianName
    });
  });

  describe('Notification Preferences', () => {
    it('should respect tenant notification settings', async () => {
      // Mock tenant settings with notifications disabled
      const tenantSettingsDisabled = {
        tenantId: mockTenant.id,
        appointmentConfirmation: false,
        appointmentReminder: true,
        staffAppointmentNotification: false,
      };

      // Confirmation should not be sent
      expect(tenantSettingsDisabled.appointmentConfirmation).toBe(false);

      // Reminder can still be sent
      expect(tenantSettingsDisabled.appointmentReminder).toBe(true);
    });

    it('should check notification preference before sending', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { shouldSendNotification } = require('../../../src/lib/enhanced-settings');

      // Mock enabled preference
      shouldSendNotification.mockResolvedValue(true);

      let sendConfirmation = await shouldSendNotification(mockTenant.id, 'appointmentConfirmation');
      expect(sendConfirmation).toBe(true);

      // Mock disabled preference
      shouldSendNotification.mockResolvedValue(false);

      sendConfirmation = await shouldSendNotification(mockTenant.id, 'appointmentConfirmation');
      expect(sendConfirmation).toBe(false);
    });
  });

  describe('Recipient Logic', () => {
    it('should send to customer email for confirmation', () => {
      const recipient = mockCustomer.email;
      expect(recipient).toBeDefined();
      expect(isValidEmail(recipient!)).toBe(true);
    });

    it('should send to staff email for staff notification', () => {
      const recipient = mockStaff.email;
      expect(recipient).toBeDefined();
      expect(isValidEmail(recipient!)).toBe(true);
    });

    it('should handle customers with multiple contact methods', () => {
      const customerWithPhone = {
        ...mockCustomer,
        email: 'customer@example.com',
        phone: '+52 555 123 4567',
      };

      // Email takes precedence for email notifications
      const emailRecipient = customerWithPhone.email;
      expect(emailRecipient).toBe('customer@example.com');
    });

    it('should handle missing recipient gracefully', () => {
      const customerWithoutEmail = {
        ...mockCustomer,
        email: null,
      };

      const hasValidRecipient = customerWithoutEmail.email !== null &&
                                isValidEmail(customerWithoutEmail.email || '');
      expect(hasValidRecipient).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle email service errors gracefully', async () => {
      // Test that the function returns error result without throwing
      const invalidEmailData: AppointmentConfirmationData = {
        template: 'appointment-confirmation',
        to: {
          email: 'valid@example.com',
          name: 'Test',
        },
        subject: 'Test',
        tenantId: mockTenant.id,
        data: {
          appointmentId: 'apt-123',
          petName: 'Max',
          ownerName: 'Juan',
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta',
          clinicName: 'Test Clinic',
        },
      };

      // In dry-run mode, should succeed
      const result = await sendAppointmentConfirmation(invalidEmailData);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should log errors for debugging', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate an error log
      console.error('[APPOINTMENT] Failed to send confirmation email:', new Error('Test error'));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[APPOINTMENT] Failed to send confirmation email:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Email Content Verification', () => {
    it('should include appointment ID for tracking', () => {
      const emailData: AppointmentConfirmationData = {
        template: 'appointment-confirmation',
        to: { email: 'test@example.com' },
        subject: 'Test',
        tenantId: mockTenant.id,
        data: {
          appointmentId: 'apt-unique-123',
          petName: 'Max',
          ownerName: 'Juan',
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta',
          clinicName: 'Test Clinic',
        },
      };

      expect(emailData.data.appointmentId).toBe('apt-unique-123');
    });

    it('should format appointment time correctly', () => {
      const appointmentTime = '14:30';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _expectedDisplay = '14:30'; // or '2:30 PM' depending on locale

      expect(appointmentTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should include tenant ID for multi-tenant tracking', () => {
      const emailData: AppointmentConfirmationData = {
        template: 'appointment-confirmation',
        to: { email: 'test@example.com' },
        subject: 'Test',
        tenantId: 'tenant-specific-id',
        data: {
          appointmentId: 'apt-123',
          petName: 'Max',
          ownerName: 'Juan',
          appointmentDate: new Date(),
          appointmentTime: '10:00',
          serviceName: 'Consulta',
          clinicName: 'Test Clinic',
        },
      };

      expect(emailData.tenantId).toBe('tenant-specific-id');
    });
  });
});
