import { Resend } from 'resend';
import { generateSetupToken } from './setup-token';

// Lazy-load Resend client to avoid initialization during build
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.SETUP_FROM_EMAIL || 'soporte@vetify.pro';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendSetupVerificationEmail(email: string) {
  // Create or reuse active token
  const tokenRecord = await generateSetupToken(email);

  const verifyUrl = `${APP_URL}/setup?token=${tokenRecord.token}`;

  const html = `
    <p>Hola,</p>
    <p>Haz clic en el siguiente enlace para completar la configuración inicial de Vetify y convertirte en super administrador:</p>
    <p><a href="${verifyUrl}" target="_blank" rel="noopener">Completar configuración</a></p>
    <p>Este enlace expirará en 15 minutos.</p>
    <p>Si no solicitaste este mensaje, puedes ignorarlo.</p>
    <br/>
    <p>— Equipo Vetify</p>
  `;

  const resend = getResendClient();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Completa la configuración inicial de Vetify',
    html,
  });

  return { success: true } as const;
} 