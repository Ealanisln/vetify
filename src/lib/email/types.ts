/**
 * Email Service Type Definitions
 *
 * Comprehensive types for the Resend transactional email system
 */

export type EmailTemplate =
  | 'appointment-confirmation'
  | 'appointment-reminder'
  | 'low-stock-alert'
  | 'treatment-reminder'
  | 'new-user-registration'
  | 'new-subscription-payment';

export type EmailStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'BOUNCED'
  | 'FAILED';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Base email data structure
 */
export interface BaseEmailData {
  to: EmailRecipient;
  subject: string;
  tenantId: string;
  from?: {
    email: string;
    name: string;
  };
  replyTo?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  attachments?: EmailAttachment[];
}

/**
 * Appointment Confirmation Email Data
 */
export interface AppointmentConfirmationData extends BaseEmailData {
  template: 'appointment-confirmation';
  data: {
    appointmentId: string;
    petName: string;
    ownerName: string;
    appointmentDate: Date;
    appointmentTime: string;
    serviceName: string;
    clinicName: string;
    clinicAddress?: string;
    clinicPhone?: string;
    veterinarianName?: string;
    notes?: string;
  };
}

/**
 * Appointment Reminder Email Data
 */
export interface AppointmentReminderData extends BaseEmailData {
  template: 'appointment-reminder';
  data: {
    appointmentId: string;
    petName: string;
    ownerName: string;
    appointmentDate: Date;
    appointmentTime: string;
    serviceName: string;
    clinicName: string;
    clinicAddress?: string;
    clinicPhone?: string;
    veterinarianName?: string;
    hoursUntilAppointment: number;
  };
}

/**
 * Low Stock Alert Email Data
 */
export interface LowStockAlertData extends BaseEmailData {
  template: 'low-stock-alert';
  data: {
    clinicName: string;
    items: Array<{
      productName: string;
      currentStock: number;
      minimumStock: number;
      unit: string;
      category?: string;
    }>;
    alertDate: Date;
    totalLowStockItems: number;
  };
}

/**
 * Treatment Reminder Email Data
 */
export interface TreatmentReminderData extends BaseEmailData {
  template: 'treatment-reminder';
  data: {
    reminderId: string;
    petName: string;
    ownerName: string;
    treatmentName: string;
    treatmentType: 'VACCINATION' | 'MEDICATION' | 'CHECKUP' | 'OTHER';
    dueDate: Date;
    clinicName: string;
    clinicPhone?: string;
    veterinarianName?: string;
    notes?: string;
    daysUntilDue: number;
  };
}

/**
 * New User Registration Alert Email Data
 */
export interface NewUserRegistrationData extends BaseEmailData {
  template: 'new-user-registration';
  data: {
    userName: string;
    userEmail: string;
    tenantName: string;
    tenantSlug: string;
    registrationDate: Date;
    planType: 'TRIAL' | 'PAID';
    trialEndsAt?: Date;
  };
}

/**
 * New Subscription Payment Alert Email Data
 */
export interface NewSubscriptionPaymentData extends BaseEmailData {
  template: 'new-subscription-payment';
  data: {
    userName: string;
    userEmail: string;
    tenantName: string;
    tenantSlug: string;
    planName: string;
    planAmount: number;
    currency: string;
    billingInterval: 'month' | 'year';
    paymentDate: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

/**
 * Union type for all email data types
 */
export type EmailData =
  | AppointmentConfirmationData
  | AppointmentReminderData
  | LowStockAlertData
  | TreatmentReminderData
  | NewUserRegistrationData
  | NewSubscriptionPaymentData;

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Email log entry for database
 */
export interface EmailLogEntry {
  tenantId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  template: EmailTemplate;
  status: EmailStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  resendId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  enableLogging?: boolean;
  dryRun?: boolean;
}

/**
 * Template rendering context
 */
export interface TemplateContext {
  tenantId: string;
  locale?: string;
  timezone?: string;
  brandColor?: string;
  logoUrl?: string;
}
