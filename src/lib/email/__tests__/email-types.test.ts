/**
 * Unit tests for email type definitions
 */

import type {
  AppointmentConfirmationData,
  AppointmentReminderData,
  LowStockAlertData,
  TreatmentReminderData,
  NewUserRegistrationData,
  NewSubscriptionPaymentData,
  EmailTemplate,
  EmailStatus,
} from '../types';

describe('Email Types', () => {
  it('should have correct email template types', () => {
    const templates: EmailTemplate[] = [
      'appointment-confirmation',
      'appointment-reminder',
      'low-stock-alert',
      'treatment-reminder',
      'new-user-registration',
      'new-subscription-payment',
    ];

    expect(templates).toHaveLength(6);
  });

  it('should have correct email status types', () => {
    const statuses: EmailStatus[] = [
      'PENDING',
      'SENT',
      'DELIVERED',
      'BOUNCED',
      'FAILED',
    ];

    expect(statuses).toHaveLength(5);
  });

  it('should accept valid appointment confirmation data structure', () => {
    const data: AppointmentConfirmationData = {
      template: 'appointment-confirmation',
      to: {
        email: 'test@example.com',
        name: 'Test User',
      },
      subject: 'Test',
      tenantId: 'tenant-123',
      data: {
        appointmentId: 'appt-123',
        petName: 'Max',
        ownerName: 'Juan Pérez',
        appointmentDate: new Date(),
        appointmentTime: '10:00',
        serviceName: 'Test Service',
        clinicName: 'Test Clinic',
      },
    };

    expect(data.template).toBe('appointment-confirmation');
    expect(data.to.email).toBe('test@example.com');
  });

  it('should accept valid appointment reminder data structure', () => {
    const data: AppointmentReminderData = {
      template: 'appointment-reminder',
      to: {
        email: 'test@example.com',
        name: 'Test User',
      },
      subject: 'Test',
      tenantId: 'tenant-123',
      data: {
        appointmentId: 'appt-123',
        petName: 'Max',
        ownerName: 'Juan Pérez',
        appointmentDate: new Date(),
        appointmentTime: '10:00',
        serviceName: 'Test Service',
        clinicName: 'Test Clinic',
        hoursUntilAppointment: 24,
      },
    };

    expect(data.template).toBe('appointment-reminder');
    expect(data.data.hoursUntilAppointment).toBe(24);
  });

  it('should accept valid low stock alert data structure', () => {
    const data: LowStockAlertData = {
      template: 'low-stock-alert',
      to: {
        email: 'admin@clinic.com',
      },
      subject: 'Low Stock Alert',
      tenantId: 'tenant-123',
      data: {
        clinicName: 'Test Clinic',
        items: [
          {
            productName: 'Test Product',
            currentStock: 5,
            minimumStock: 10,
            unit: 'unidades',
          },
        ],
        alertDate: new Date(),
        totalLowStockItems: 1,
      },
    };

    expect(data.template).toBe('low-stock-alert');
    expect(data.data.items).toHaveLength(1);
  });

  it('should accept valid treatment reminder data structure', () => {
    const data: TreatmentReminderData = {
      template: 'treatment-reminder',
      to: {
        email: 'owner@example.com',
        name: 'Test Owner',
      },
      subject: 'Treatment Reminder',
      tenantId: 'tenant-123',
      data: {
        reminderId: 'reminder-123',
        petName: 'Max',
        ownerName: 'Juan Pérez',
        treatmentName: 'Vaccination',
        treatmentType: 'VACCINATION',
        dueDate: new Date(),
        clinicName: 'Test Clinic',
        daysUntilDue: 7,
      },
    };

    expect(data.template).toBe('treatment-reminder');
    expect(data.data.treatmentType).toBe('VACCINATION');
  });

  it('should support all treatment types', () => {
    const types: Array<'VACCINATION' | 'MEDICATION' | 'CHECKUP' | 'OTHER'> = [
      'VACCINATION',
      'MEDICATION',
      'CHECKUP',
      'OTHER',
    ];

    types.forEach((type) => {
      const data: TreatmentReminderData = {
        template: 'treatment-reminder',
        to: { email: 'test@example.com' },
        subject: 'Test',
        tenantId: 'tenant-123',
        data: {
          reminderId: 'reminder-123',
          petName: 'Max',
          ownerName: 'Owner',
          treatmentName: 'Treatment',
          treatmentType: type,
          dueDate: new Date(),
          clinicName: 'Clinic',
          daysUntilDue: 7,
        },
      };

      expect(data.data.treatmentType).toBe(type);
    });
  });

  it('should accept valid new user registration data structure', () => {
    const data: NewUserRegistrationData = {
      template: 'new-user-registration',
      to: {
        email: 'admin@vetify.pro',
        name: 'Admin',
      },
      subject: 'New User Registered',
      tenantId: 'tenant-123',
      data: {
        userName: 'Juan Pérez',
        userEmail: 'juan@example.com',
        tenantName: 'Veterinaria Ejemplo',
        tenantSlug: 'veterinaria-ejemplo',
        registrationDate: new Date(),
        planType: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    };

    expect(data.template).toBe('new-user-registration');
    expect(data.data.planType).toBe('TRIAL');
  });

  it('should accept valid new subscription payment data structure', () => {
    const data: NewSubscriptionPaymentData = {
      template: 'new-subscription-payment',
      to: {
        email: 'admin@vetify.pro',
        name: 'Admin',
      },
      subject: 'New Subscription Payment',
      tenantId: 'tenant-123',
      data: {
        userName: 'Juan Pérez',
        userEmail: 'juan@example.com',
        tenantName: 'Veterinaria Ejemplo',
        tenantSlug: 'veterinaria-ejemplo',
        planName: 'Professional',
        planAmount: 49900, // Amount in cents
        currency: 'mxn',
        billingInterval: 'month',
        paymentDate: new Date(),
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
      },
    };

    expect(data.template).toBe('new-subscription-payment');
    expect(data.data.planAmount).toBe(49900);
    expect(data.data.billingInterval).toBe('month');
  });

  it('should support both billing intervals', () => {
    const intervals: Array<'month' | 'year'> = ['month', 'year'];

    intervals.forEach((interval) => {
      const data: NewSubscriptionPaymentData = {
        template: 'new-subscription-payment',
        to: { email: 'admin@vetify.pro' },
        subject: 'Test',
        tenantId: 'tenant-123',
        data: {
          userName: 'Test User',
          userEmail: 'test@example.com',
          tenantName: 'Test Clinic',
          tenantSlug: 'test-clinic',
          planName: 'Pro',
          planAmount: 49900,
          currency: 'mxn',
          billingInterval: interval,
          paymentDate: new Date(),
        },
      };

      expect(data.data.billingInterval).toBe(interval);
    });
  });

  it('should support both plan types for registration', () => {
    const planTypes: Array<'TRIAL' | 'PAID'> = ['TRIAL', 'PAID'];

    planTypes.forEach((planType) => {
      const data: NewUserRegistrationData = {
        template: 'new-user-registration',
        to: { email: 'admin@vetify.pro' },
        subject: 'Test',
        tenantId: 'tenant-123',
        data: {
          userName: 'Test User',
          userEmail: 'test@example.com',
          tenantName: 'Test Clinic',
          tenantSlug: 'test-clinic',
          registrationDate: new Date(),
          planType,
        },
      };

      expect(data.data.planType).toBe(planType);
    });
  });
});
