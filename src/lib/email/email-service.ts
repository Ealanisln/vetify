/**
 * Resend Email Service
 *
 * Main service wrapper for sending transactional emails using Resend.
 * Handles tenant isolation, error handling, and logging.
 * Uses React Email for template rendering.
 */

import { Resend } from 'resend';
import { render } from '@react-email/components';
import type {
  EmailData,
  EmailSendResult,
  EmailServiceConfig,
  AppointmentConfirmationData,
  AppointmentReminderData,
  AppointmentCancellationData,
  AppointmentRescheduledData,
  AppointmentStaffNotificationData,
  LowStockAlertData,
  TreatmentReminderData,
  TestimonialRequestData,
  StaffInvitationData,
} from './types';
import { logEmailSend } from '../notifications/notification-logger';
import {
  AppointmentConfirmationEmail,
  AppointmentReminderEmail,
  AppointmentCancellationEmail,
  AppointmentRescheduledEmail,
  AppointmentStaffNotificationEmail,
  LowStockAlertEmail,
  TreatmentReminderEmail,
  NewUserRegistrationEmail,
  NewSubscriptionPaymentEmail,
  TestimonialRequestEmail,
  StaffInvitationEmail,
} from './templates';
import { formatDateLong, formatDateTimeLong, formatDate, formatCurrency } from '../utils/date-format';

// Lazy-load Resend client to avoid initialization during build
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY || '';
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Default configuration
const DEFAULT_CONFIG: EmailServiceConfig = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'notifications@vetify.pro',
  fromName: process.env.RESEND_FROM_NAME || 'Vetify',
  replyToEmail: process.env.RESEND_REPLY_TO || 'soporte@vetify.pro',
  enableLogging: true,
  dryRun: process.env.NODE_ENV === 'test',
};

/**
 * Send email using Resend
 */
export async function sendEmail(
  emailData: EmailData
): Promise<EmailSendResult> {
  try {
    // Validate environment variables
    if (!DEFAULT_CONFIG.apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Dry run mode for testing
    if (DEFAULT_CONFIG.dryRun) {
      console.log('[EMAIL] Dry run mode - Email not sent:', {
        to: emailData.to.email,
        subject: emailData.subject,
        template: emailData.template,
      });
      return {
        success: true,
        messageId: 'dry-run-' + Date.now(),
      };
    }

    // Get HTML content based on template
    const htmlContent = await renderTemplate(emailData);

    // Prepare email payload
    const from = emailData.from
      ? `${emailData.from.name} <${emailData.from.email}>`
      : `${DEFAULT_CONFIG.fromName} <${DEFAULT_CONFIG.fromEmail}>`;

    const payload = {
      from,
      to: emailData.to.email,
      subject: emailData.subject,
      html: htmlContent,
      replyTo: emailData.replyTo || DEFAULT_CONFIG.replyToEmail,
      cc: emailData.cc?.map((r) => r.email),
      bcc: emailData.bcc?.map((r) => r.email),
    };

    // Send email via Resend
    const resend = getResendClient();
    const response = await resend.emails.send(payload);

    if (!response.data?.id) {
      throw new Error('Failed to send email: No message ID returned');
    }

    const result: EmailSendResult = {
      success: true,
      messageId: response.data.id,
    };

    // Log successful send
    await logEmailSend(emailData, result);

    return result;
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error);

    const result: EmailSendResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: error instanceof Error && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500,
    };

    // Log failed send
    await logEmailSend(emailData, result);

    return result;
  }
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmation(
  data: AppointmentConfirmationData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Send appointment reminder email
 */
export async function sendAppointmentReminder(
  data: AppointmentReminderData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlert(
  data: LowStockAlertData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Send treatment reminder email
 */
export async function sendTreatmentReminder(
  data: TreatmentReminderData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Send appointment cancellation email
 */
export async function sendAppointmentCancellation(
  data: AppointmentCancellationData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Send appointment rescheduled email
 */
export async function sendAppointmentRescheduled(
  data: AppointmentRescheduledData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Send appointment staff notification email
 */
export async function sendAppointmentStaffNotification(
  data: AppointmentStaffNotificationData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Send testimonial request email
 */
export async function sendTestimonialRequest(
  data: TestimonialRequestData
): Promise<EmailSendResult> {
  return sendEmail(data);
}

/**
 * Render email template to HTML using React Email
 */
async function renderTemplate(emailData: EmailData): Promise<string> {
  switch (emailData.template) {
    case 'appointment-confirmation': {
      const d = emailData.data;
      const appointmentDateStr = formatDateLong(d.appointmentDate);
      return await render(
        AppointmentConfirmationEmail({
          ownerName: d.ownerName,
          petName: d.petName,
          appointmentDate: appointmentDateStr,
          appointmentTime: d.appointmentTime,
          serviceName: d.serviceName,
          clinicName: d.clinicName,
          clinicAddress: d.clinicAddress,
          clinicPhone: d.clinicPhone,
          veterinarianName: d.veterinarianName,
          notes: d.notes,
        })
      );
    }

    case 'appointment-reminder': {
      const d = emailData.data;
      const appointmentDateStr = formatDateLong(d.appointmentDate);
      return await render(
        AppointmentReminderEmail({
          ownerName: d.ownerName,
          petName: d.petName,
          appointmentDate: appointmentDateStr,
          appointmentTime: d.appointmentTime,
          serviceName: d.serviceName,
          clinicName: d.clinicName,
          clinicAddress: d.clinicAddress,
          clinicPhone: d.clinicPhone,
          veterinarianName: d.veterinarianName,
          hoursUntilAppointment: d.hoursUntilAppointment,
        })
      );
    }

    case 'appointment-cancellation': {
      const d = emailData.data;
      const appointmentDateStr = formatDateLong(d.appointmentDate);
      return await render(
        AppointmentCancellationEmail({
          ownerName: d.ownerName,
          petName: d.petName,
          appointmentDate: appointmentDateStr,
          appointmentTime: d.appointmentTime,
          serviceName: d.serviceName,
          clinicName: d.clinicName,
          clinicPhone: d.clinicPhone,
          cancelledBy: d.cancelledBy,
          cancellationReason: d.cancellationReason,
        })
      );
    }

    case 'appointment-rescheduled': {
      const d = emailData.data;
      const previousDateStr = formatDateLong(d.previousDate);
      const newDateStr = formatDateLong(d.newDate);
      return await render(
        AppointmentRescheduledEmail({
          ownerName: d.ownerName,
          petName: d.petName,
          previousDate: previousDateStr,
          previousTime: d.previousTime,
          newDate: newDateStr,
          newTime: d.newTime,
          serviceName: d.serviceName,
          clinicName: d.clinicName,
          clinicAddress: d.clinicAddress,
          clinicPhone: d.clinicPhone,
          veterinarianName: d.veterinarianName,
        })
      );
    }

    case 'appointment-staff-notification': {
      const d = emailData.data;
      const appointmentDateStr = formatDateLong(d.appointmentDate);
      return await render(
        AppointmentStaffNotificationEmail({
          staffName: d.staffName,
          petName: d.petName,
          petSpecies: d.petSpecies,
          petBreed: d.petBreed,
          ownerName: d.ownerName,
          ownerPhone: d.ownerPhone,
          appointmentDate: appointmentDateStr,
          appointmentTime: d.appointmentTime,
          serviceName: d.serviceName,
          clinicName: d.clinicName,
          notes: d.notes,
        })
      );
    }

    case 'low-stock-alert': {
      const d = emailData.data;
      const alertDateStr = formatDateTimeLong(d.alertDate);
      return await render(
        LowStockAlertEmail({
          clinicName: d.clinicName,
          items: d.items,
          alertDate: alertDateStr,
          totalLowStockItems: d.totalLowStockItems,
        })
      );
    }

    case 'treatment-reminder': {
      const d = emailData.data;
      const dueDateStr = formatDateLong(d.dueDate);
      return await render(
        TreatmentReminderEmail({
          ownerName: d.ownerName,
          petName: d.petName,
          treatmentName: d.treatmentName,
          treatmentType: d.treatmentType,
          dueDate: dueDateStr,
          daysUntilDue: d.daysUntilDue,
          clinicName: d.clinicName,
          clinicPhone: d.clinicPhone,
          veterinarianName: d.veterinarianName,
          notes: d.notes,
        })
      );
    }

    case 'new-user-registration': {
      const d = emailData.data;
      const registrationDateStr = formatDateTimeLong(d.registrationDate);
      const trialEndsStr = d.trialEndsAt
        ? formatDate(d.trialEndsAt)
        : undefined;
      return await render(
        NewUserRegistrationEmail({
          userName: d.userName,
          userEmail: d.userEmail,
          tenantName: d.tenantName,
          tenantSlug: d.tenantSlug,
          registrationDate: registrationDateStr,
          planType: d.planType,
          trialEndsAt: trialEndsStr,
        })
      );
    }

    case 'new-subscription-payment': {
      const d = emailData.data;
      const paymentDateStr = formatDateTimeLong(d.paymentDate);
      const formattedAmount = formatCurrency(d.planAmount / 100, d.currency.toUpperCase());
      return await render(
        NewSubscriptionPaymentEmail({
          userName: d.userName,
          userEmail: d.userEmail,
          tenantName: d.tenantName,
          tenantSlug: d.tenantSlug,
          planName: d.planName,
          formattedAmount,
          billingInterval: d.billingInterval,
          paymentDate: paymentDateStr,
          stripeCustomerId: d.stripeCustomerId,
          stripeSubscriptionId: d.stripeSubscriptionId,
        })
      );
    }

    case 'testimonial-request': {
      const d = emailData.data;
      const appointmentDateStr = formatDateLong(d.appointmentDate);
      return await render(
        TestimonialRequestEmail({
          ownerName: d.ownerName,
          petName: d.petName,
          serviceName: d.serviceName,
          appointmentDate: appointmentDateStr,
          clinicName: d.clinicName,
          clinicSlug: d.clinicSlug,
          baseUrl: d.baseUrl,
        })
      );
    }

    case 'staff-invitation': {
      const d = (emailData as StaffInvitationData).data;
      return await render(
        StaffInvitationEmail({
          staffName: d.staffName,
          clinicName: d.clinicName,
          position: d.position,
          inviteUrl: d.inviteUrl,
          expirationDays: d.expirationDays,
        })
      );
    }

    default:
      throw new Error(`Unknown template: ${(emailData as EmailData).template}`);
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get email service configuration
 */
export function getEmailConfig(): EmailServiceConfig {
  return { ...DEFAULT_CONFIG };
}
