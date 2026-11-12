/**
 * Referral Notification Service
 *
 * Simple email notifications for referral events.
 * Uses Resend directly with inline HTML (admin-only, no fancy templates needed).
 */

import { Resend } from 'resend';
import { getAppUrl } from '../app-url';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'emmanuel@vetify.pro';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Vetify <notificaciones@vetify.pro>';

/**
 * Resend resolves (does not throw) on API errors such as an unverified
 * domain, so a missing check would log failures as sent.
 */
function assertSent(response: Awaited<ReturnType<Resend['emails']['send']>>): void {
  if (response.error) {
    throw new Error(`Resend error (${response.error.name}): ${response.error.message}`);
  }
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

/**
 * Notify admin when a referred clinic makes its first payment (conversion).
 */
export async function notifyReferralConversion(data: {
  partnerName: string;
  partnerEmail: string;
  referralCode: string;
  tenantName: string;
  planKey: string;
  subscriptionAmount: number;
  commissionPercent: number;
  commissionAmount: number;
}): Promise<void> {
  try {
    const resend = getResend();
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Referido Convertido: ${data.tenantName} (por ${data.partnerName})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #75a99c;">Nuevo Referido Convertido</h2>
          <p>Una clínica referida acaba de hacer su primer pago.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Partner</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.partnerName} (${data.partnerEmail})</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Código</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.referralCode}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Clínica</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.tenantName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Plan</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.planKey}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Monto Suscripción</td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${data.subscriptionAmount.toFixed(2)} MXN</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Comisión (${data.commissionPercent}%)</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #75a99c; font-weight: bold;">$${data.commissionAmount.toFixed(2)} MXN</td></tr>
          </table>
          <p style="color: #666; font-size: 14px;">Revisa los detalles en el <a href="${getAppUrl()}/admin/referrals">panel de referidos</a>.</p>
        </div>
      `,
    });
    assertSent(response);
    console.log('[REFERRAL_NOTIFICATIONS] Conversion notification sent to admin');
  } catch (error) {
    console.error('[REFERRAL_NOTIFICATIONS] Failed to send conversion notification:', error);
  }
}

/**
 * Notify the partner that their referral converted successfully.
 */
export async function notifyPartnerReferralSuccess(data: {
  partnerEmail: string;
  partnerName: string;
  tenantName: string;
  commissionAmount: number;
}): Promise<void> {
  try {
    const resend = getResend();
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.partnerEmail,
      subject: `Tu referido ${data.tenantName} se ha suscrito a Vetify`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #75a99c;">Tu referido se suscribió</h2>
          <p>Hola ${data.partnerName},</p>
          <p>La clínica <strong>${data.tenantName}</strong> que referiste a Vetify acaba de activar su suscripción.</p>
          <p>Tu comisión por este referido es de <strong style="color: #75a99c;">$${data.commissionAmount.toFixed(2)} MXN</strong>.</p>
          <p>Gracias por ser parte del programa de referidos de Vetify.</p>
          <p style="color: #666; font-size: 14px;">Si tienes preguntas sobre tu comisión, contacta a nuestro equipo.</p>
        </div>
      `,
    });
    assertSent(response);
    console.log('[REFERRAL_NOTIFICATIONS] Partner notification sent');
  } catch (error) {
    console.error('[REFERRAL_NOTIFICATIONS] Failed to send partner notification:', error);
  }
}
