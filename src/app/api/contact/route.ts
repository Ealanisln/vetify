import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

// Lazy-load Resend client
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

// Validation schema for contact form
const contactFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  asunto: z.enum([
    'informacion',
    'demo',
    'soporte',
    'facturacion',
    'downgrade',
    'otro',
  ]),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

// Map subject values to Spanish
const subjectMap: Record<string, string> = {
  informacion: 'Solicitud de Información',
  demo: 'Solicitud de Demo',
  soporte: 'Soporte Técnico',
  facturacion: 'Consulta de Facturación',
  downgrade: 'Solicitud de Downgrade de Plan',
  otro: 'Consulta General',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = contactFormSchema.parse(body);

    // Get environment variables
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@vetify.pro';
    const contactEmail = process.env.CONTACT_EMAIL || 'contacto@vetify.pro';

    // Create subject line
    const subjectType = subjectMap[validatedData.asunto] || 'Consulta General';
    const emailSubject = `[Vetify Contacto] ${subjectType} - ${validatedData.nombre}`;

    // Create email HTML
    const emailHtml = renderContactEmail(validatedData);

    // Send email via Resend
    const resend = getResendClient();
    const response = await resend.emails.send({
      from: `Vetify <${fromEmail}>`,
      to: contactEmail,
      replyTo: validatedData.email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (!response.data?.id) {
      throw new Error('Failed to send email: No message ID returned');
    }

    // Log successful send (optional - for debugging)
    console.log('[CONTACT] Email sent successfully:', {
      messageId: response.data.id,
      to: contactEmail,
      from: validatedData.email,
      subject: emailSubject,
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      messageId: response.data.id,
    });
  } catch (error) {
    console.error('[CONTACT] Failed to send email:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al enviar el mensaje',
      },
      { status: 500 }
    );
  }
}

/**
 * Render contact email template
 */
function renderContactEmail(data: z.infer<typeof contactFormSchema>): string {
  const brandColor = '#75a99c';
  const subjectType = subjectMap[data.asunto] || 'Consulta General';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mensaje de Contacto - Vetify</title>
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
                📧 Nuevo Mensaje de Contacto
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Contact Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👤 Nombre:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${data.nombre}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📧 Email:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${data.email}</strong>
                        </td>
                      </tr>
                      ${
                        data.telefono
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📞 Teléfono:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${data.telefono}</strong>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📋 Asunto:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 14px;">${subjectType}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Message Content -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                  💬 Mensaje:
                </h3>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid ${brandColor};">
                  <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${data.mensaje}
                  </p>
                </div>
              </div>

              <!-- Response Info -->
              <div style="background-color: #e7f3ff; border-left: 4px solid #0d6efd; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; color: #084298; font-size: 14px;">
                  <strong>💡 Recuerda:</strong> Puedes responder directamente a este email para contactar al usuario.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                Vetify - Sistema de Gestión Veterinaria
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Este mensaje fue enviado desde el formulario de contacto en vetify.pro
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
