/**
 * Resend Email Service
 *
 * Main service wrapper for sending transactional emails using Resend.
 * Handles tenant isolation, error handling, and logging.
 */

import { Resend } from 'resend';
import type {
  EmailData,
  EmailSendResult,
  EmailServiceConfig,
  AppointmentConfirmationData,
  AppointmentReminderData,
  LowStockAlertData,
  TreatmentReminderData,
  NewUserRegistrationData,
  NewSubscriptionPaymentData,
} from './types';
import { logEmailSend } from '../notifications/notification-logger';

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
  replyToEmail: process.env.RESEND_REPLY_TO || 'support@vetify.pro',
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
 * Render email template to HTML
 * For now, we'll use simple HTML templates.
 * In Phase 2, we can integrate React Email for more sophisticated templates.
 */
async function renderTemplate(emailData: EmailData): Promise<string> {
  const brandColor = '#75a99c';

  switch (emailData.template) {
    case 'appointment-confirmation':
      return renderAppointmentConfirmationTemplate(emailData, brandColor);

    case 'appointment-reminder':
      return renderAppointmentReminderTemplate(emailData, brandColor);

    case 'low-stock-alert':
      return renderLowStockAlertTemplate(emailData, brandColor);

    case 'treatment-reminder':
      return renderTreatmentReminderTemplate(emailData, brandColor);

    case 'new-user-registration':
      return renderNewUserRegistrationTemplate(emailData, brandColor);

    case 'new-subscription-payment':
      return renderNewSubscriptionPaymentTemplate(emailData, brandColor);

    default:
      throw new Error(`Unknown template: ${(emailData as EmailData).template}`);
  }
}

/**
 * Render appointment confirmation template
 */
function renderAppointmentConfirmationTemplate(
  emailData: AppointmentConfirmationData,
  brandColor: string
): string {
  const { data: d } = emailData;
  const appointmentDateStr = d.appointmentDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Cita Confirmada ✅
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                Hola <strong>${d.ownerName}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Tu cita para <strong>${d.petName}</strong> ha sido confirmada exitosamente.
              </p>

              <!-- Appointment Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${appointmentDateStr}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🕐 Hora:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.appointmentTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🐾 Mascota:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.petName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">💉 Servicio:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.serviceName}</strong>
                        </td>
                      </tr>
                      ${
                        d.veterinarianName
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👨‍⚕️ Veterinario:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.veterinarianName}</strong>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Clinic Information -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                  📍 Información de la Clínica
                </h3>
                <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
                  <strong>${d.clinicName}</strong>
                </p>
                ${
                  d.clinicAddress
                    ? `<p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">${d.clinicAddress}</p>`
                    : ''
                }
                ${
                  d.clinicPhone
                    ? `<p style="margin: 0; color: #666666; font-size: 14px;">📞 ${d.clinicPhone}</p>`
                    : ''
                }
              </div>

              ${
                d.notes
                  ? `
              <div style="background-color: #fff9e6; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Nota:</strong> ${d.notes}
                </p>
              </div>
              `
                  : ''
              }

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Recibirás un recordatorio 24 horas antes de tu cita. Si necesitas cancelar o reprogramar, por favor contáctanos lo antes posible.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                ${d.clinicName}
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Enviado por Vetify - Sistema de Gestión Veterinaria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Render appointment reminder template
 */
function renderAppointmentReminderTemplate(
  emailData: AppointmentReminderData,
  brandColor: string
): string {
  const { data: d } = emailData;
  const appointmentDateStr = d.appointmentDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Recordatorio de Cita ⏰
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                Hola <strong>${d.ownerName}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Te recordamos que tienes una cita para <strong>${d.petName}</strong> en aproximadamente <strong>${d.hoursUntilAppointment} horas</strong>.
              </p>

              <!-- Reminder Alert Box -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #856404; font-size: 16px; text-align: center;">
                  <strong>⏰ Tu cita es mañana</strong>
                </p>
              </div>

              <!-- Appointment Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${appointmentDateStr}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🕐 Hora:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.appointmentTime}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🐾 Mascota:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.petName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">💉 Servicio:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.serviceName}</strong>
                        </td>
                      </tr>
                      ${
                        d.veterinarianName
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👨‍⚕️ Veterinario:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.veterinarianName}</strong>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Clinic Information -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                  📍 Información de la Clínica
                </h3>
                <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
                  <strong>${d.clinicName}</strong>
                </p>
                ${
                  d.clinicAddress
                    ? `<p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">${d.clinicAddress}</p>`
                    : ''
                }
                ${
                  d.clinicPhone
                    ? `<p style="margin: 0; color: #666666; font-size: 14px;">📞 ${d.clinicPhone}</p>`
                    : ''
                }
              </div>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Si necesitas cancelar o reprogramar, por favor contáctanos lo antes posible. ¡Te esperamos!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                ${d.clinicName}
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Enviado por Vetify - Sistema de Gestión Veterinaria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Render low stock alert template
 */
function renderLowStockAlertTemplate(
  emailData: LowStockAlertData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  brandColor: string
): string {
  const { data: d } = emailData;
  const alertDateStr = d.alertDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Inventario Bajo</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #dc3545; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ⚠️ Alerta de Inventario Bajo
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                Hola,
              </p>

              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Se han detectado <strong>${d.totalLowStockItems} productos</strong> con stock bajo en tu inventario de <strong>${d.clinicName}</strong>.
              </p>

              <!-- Alert Info -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Fecha de alerta:</strong> ${alertDateStr}
                </p>
              </div>

              <!-- Products Table -->
              <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                Productos con Stock Bajo:
              </h3>

              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden; margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; color: #333333; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e9ecef;">
                      Producto
                    </th>
                    <th style="padding: 12px; text-align: center; color: #333333; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e9ecef;">
                      Stock Actual
                    </th>
                    <th style="padding: 12px; text-align: center; color: #333333; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e9ecef;">
                      Stock Mínimo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${d.items
                    .map(
                      (item, index) => `
                  <tr style="${index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8f9fa;'}">
                    <td style="padding: 12px; color: #333333; font-size: 14px; border-bottom: 1px solid #e9ecef;">
                      <strong>${item.productName}</strong>
                      ${item.category ? `<br><span style="color: #999999; font-size: 12px;">${item.category}</span>` : ''}
                    </td>
                    <td style="padding: 12px; text-align: center; color: #dc3545; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef;">
                      ${item.currentStock} ${item.unit}
                    </td>
                    <td style="padding: 12px; text-align: center; color: #666666; font-size: 14px; border-bottom: 1px solid #e9ecef;">
                      ${item.minimumStock} ${item.unit}
                    </td>
                  </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Por favor, revisa tu inventario y realiza los pedidos necesarios para mantener el stock adecuado.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                ${d.clinicName}
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Enviado por Vetify - Sistema de Gestión Veterinaria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Render treatment reminder template
 */
function renderTreatmentReminderTemplate(
  emailData: TreatmentReminderData,
  brandColor: string
): string {
  const { data: d } = emailData;
  const dueDateStr = d.dueDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const treatmentTypeEmoji = {
    VACCINATION: '💉',
    MEDICATION: '💊',
    CHECKUP: '🩺',
    OTHER: '📋',
  }[d.treatmentType];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Tratamiento</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${treatmentTypeEmoji} Recordatorio de Tratamiento
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                Hola <strong>${d.ownerName}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Te recordamos que <strong>${d.petName}</strong> tiene un tratamiento próximo que requiere tu atención.
              </p>

              <!-- Reminder Alert Box -->
              <div style="background-color: #d1ecf1; border-left: 4px solid #0dcaf0; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #055160; font-size: 16px; text-align: center;">
                  <strong>📅 Faltan ${d.daysUntilDue} días</strong>
                </p>
              </div>

              <!-- Treatment Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🐾 Mascota:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.petName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">${treatmentTypeEmoji} Tratamiento:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.treatmentName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha prevista:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${dueDateStr}</strong>
                        </td>
                      </tr>
                      ${
                        d.veterinarianName
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👨‍⚕️ Veterinario:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.veterinarianName}</strong>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              ${
                d.notes
                  ? `
              <div style="background-color: #e7f3ff; border-left: 4px solid #0d6efd; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #084298; font-size: 14px;">
                  <strong>Nota:</strong> ${d.notes}
                </p>
              </div>
              `
                  : ''
              }

              <!-- Clinic Information -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                  📍 Información de la Clínica
                </h3>
                <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
                  <strong>${d.clinicName}</strong>
                </p>
                ${
                  d.clinicPhone
                    ? `<p style="margin: 0; color: #666666; font-size: 14px;">📞 ${d.clinicPhone}</p>`
                    : ''
                }
              </div>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Por favor, agenda una cita para este tratamiento. Si tienes alguna duda o necesitas reprogramar, no dudes en contactarnos.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                ${d.clinicName}
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Enviado por Vetify - Sistema de Gestión Veterinaria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Render new user registration template
 */
function renderNewUserRegistrationTemplate(
  emailData: NewUserRegistrationData,
  brandColor: string
): string {
  const { data: d } = emailData;
  const registrationDateStr = d.registrationDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const trialEndsStr = d.trialEndsAt
    ? d.trialEndsAt.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Usuario Registrado - Vetify</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🎉 Nuevo Usuario Registrado
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px;">
                ¡Hola Emmanuel! Un nuevo usuario se ha registrado en Vetify.
              </p>

              <!-- User Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👤 Usuario:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.userName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📧 Email:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.userEmail}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🏥 Clínica:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.tenantName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🔗 Slug:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.tenantSlug}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${registrationDateStr}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📋 Tipo:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: ${d.planType === 'TRIAL' ? '#ffc107' : '#28a745'}; font-size: 14px;">
                            ${d.planType === 'TRIAL' ? '🎁 Período de Prueba' : '💳 Suscripción Pagada'}
                          </strong>
                        </td>
                      </tr>
                      ${
                        d.trialEndsAt
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">⏰ Prueba termina:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${trialEndsStr}</strong>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Quick Actions -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                  🔗 Enlaces Rápidos
                </h3>
                <p style="margin: 0 0 8px 0;">
                  <a href="https://app.vetify.pro/${d.tenantSlug}" style="color: ${brandColor}; text-decoration: none; font-size: 14px;">
                    📊 Ver Dashboard del Tenant
                  </a>
                </p>
                <p style="margin: 0;">
                  <a href="mailto:${d.userEmail}" style="color: ${brandColor}; text-decoration: none; font-size: 14px;">
                    📧 Contactar Usuario
                  </a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                Notificación automática de Vetify
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Render new subscription payment template
 */
function renderNewSubscriptionPaymentTemplate(
  emailData: NewSubscriptionPaymentData,
  brandColor: string
): string {
  const { data: d } = emailData;
  const paymentDateStr = d.paymentDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedAmount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: d.currency.toUpperCase(),
  }).format(d.planAmount / 100); // Amount is in cents

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Suscripción Pagada - Vetify</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #28a745; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                💰 Nueva Suscripción Pagada
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px;">
                ¡Excelente! Un usuario ha pagado una suscripción en Vetify.
              </p>

              <!-- Payment Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #d4edda; border-radius: 6px; margin-bottom: 30px; border: 2px solid #28a745;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #155724; font-size: 14px; font-weight: 600;">
                      Monto Pagado
                    </p>
                    <p style="margin: 0; color: #155724; font-size: 32px; font-weight: bold;">
                      ${formattedAmount}
                    </p>
                    <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">
                      ${d.billingInterval === 'month' ? 'Mensual' : 'Anual'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- User Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👤 Usuario:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.userName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📧 Email:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.userEmail}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🏥 Clínica:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.tenantName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🔗 Slug:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${d.tenantSlug}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📋 Plan:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #28a745; font-size: 14px;">${d.planName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha de pago:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${paymentDateStr}</strong>
                        </td>
                      </tr>
                      ${
                        d.stripeCustomerId
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">💳 Stripe Customer:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <a href="https://dashboard.stripe.com/customers/${d.stripeCustomerId}" style="color: ${brandColor}; font-size: 14px; text-decoration: none;">
                            ${d.stripeCustomerId}
                          </a>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                      ${
                        d.stripeSubscriptionId
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">🔄 Stripe Subscription:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <a href="https://dashboard.stripe.com/subscriptions/${d.stripeSubscriptionId}" style="color: ${brandColor}; font-size: 14px; text-decoration: none;">
                            ${d.stripeSubscriptionId}
                          </a>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Quick Actions -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                  🔗 Enlaces Rápidos
                </h3>
                <p style="margin: 0 0 8px 0;">
                  <a href="https://app.vetify.pro/${d.tenantSlug}" style="color: ${brandColor}; text-decoration: none; font-size: 14px;">
                    📊 Ver Dashboard del Tenant
                  </a>
                </p>
                <p style="margin: 0 0 8px 0;">
                  <a href="mailto:${d.userEmail}" style="color: ${brandColor}; text-decoration: none; font-size: 14px;">
                    📧 Contactar Usuario
                  </a>
                </p>
                ${
                  d.stripeCustomerId
                    ? `
                <p style="margin: 0;">
                  <a href="https://dashboard.stripe.com/customers/${d.stripeCustomerId}" style="color: ${brandColor}; text-decoration: none; font-size: 14px;">
                    💳 Ver en Stripe Dashboard
                  </a>
                </p>
                `
                    : ''
                }
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                Notificación automática de Vetify
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
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
