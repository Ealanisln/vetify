import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';

// Lazy-load Resend client
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Validation schema for bug report
const bugReportSchema = z.object({
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000),
  stepsToReproduce: z
    .string()
    .min(10, 'Los pasos deben tener al menos 10 caracteres')
    .max(2000),
  expectedBehavior: z
    .string()
    .min(10, 'El comportamiento esperado debe tener al menos 10 caracteres')
    .max(2000),
  currentUrl: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const stepsToReproduce = formData.get('stepsToReproduce') as string;
    const expectedBehavior = formData.get('expectedBehavior') as string;
    const currentUrl = formData.get('currentUrl') as string;
    const userAgent = formData.get('userAgent') as string;
    const screenshots = formData.getAll('screenshots') as File[];

    // Validate data
    const validatedData = bugReportSchema.parse({
      description,
      stepsToReproduce,
      expectedBehavior,
      currentUrl,
      userAgent,
    });

    // Get user's tenant info
    let tenantName = 'N/A';
    let tenantSlug = 'N/A';
    try {
      const staff = await prisma.staff.findFirst({
        where: { userId: user.id },
        include: { tenant: true },
      });
      if (staff?.tenant) {
        tenantName = staff.tenant.name;
        tenantSlug = staff.tenant.slug;
      }
    } catch {
      // Continue without tenant info if query fails
    }

    // Process screenshots (convert to base64 for email)
    const screenshotAttachments: { filename: string; content: string }[] = [];
    for (const file of screenshots.slice(0, 3)) {
      // Limit to 3 screenshots
      try {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        screenshotAttachments.push({
          filename: file.name || `screenshot-${Date.now()}.png`,
          content: base64,
        });
      } catch {
        // Skip failed screenshot processing
      }
    }

    // Get environment variables
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const bugReportEmail =
      process.env.BUG_REPORT_EMAIL ||
      process.env.CONTACT_EMAIL ||
      'contacto@vetify.pro';

    if (!fromEmail) {
      console.error('[BUG_REPORT] Missing RESEND_FROM_EMAIL');
      return NextResponse.json(
        { error: 'Servicio de reportes no disponible temporalmente' },
        { status: 503 }
      );
    }

    // Create email HTML
    const emailHtml = renderBugReportEmail({
      userName: user.given_name || user.family_name || 'Usuario',
      userEmail: user.email || 'N/A',
      tenantName,
      tenantSlug,
      description: validatedData.description,
      stepsToReproduce: validatedData.stepsToReproduce,
      expectedBehavior: validatedData.expectedBehavior,
      currentUrl: validatedData.currentUrl || 'N/A',
      userAgent: validatedData.userAgent || 'N/A',
      screenshotCount: screenshotAttachments.length,
      timestamp: new Date().toISOString(),
    });

    // Send email via Resend
    const resend = getResendClient();
    const emailResponse = await resend.emails.send({
      from: `Vetify Bug Reports <${fromEmail}>`,
      to: bugReportEmail,
      replyTo: user.email || undefined,
      subject: `[Bug Report] ${validatedData.description.substring(0, 50)}${validatedData.description.length > 50 ? '...' : ''}`,
      html: emailHtml,
      attachments: screenshotAttachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      })),
    });

    if (!emailResponse.data?.id) {
      throw new Error('Failed to send email: No message ID returned');
    }

    // Log successful send
    console.log('[BUG_REPORT] Report sent successfully:', {
      messageId: emailResponse.data.id,
      userEmail: user.email,
      tenant: tenantSlug,
    });

    return NextResponse.json({
      success: true,
      message: 'Reporte enviado exitosamente',
    });
  } catch (error) {
    console.error('[BUG_REPORT] Failed to process report:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos. Por favor verifica la información.' },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Error al enviar el reporte. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}

/**
 * Render bug report email template
 */
function renderBugReportEmail(data: {
  userName: string;
  userEmail: string;
  tenantName: string;
  tenantSlug: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  currentUrl: string;
  userAgent: string;
  screenshotCount: number;
  timestamp: string;
}): string {
  const errorColor = '#dc2626';

  // HTML escape function for safety
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('es-ES', {
        dateStyle: 'full',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bug Report - Vetify</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${errorColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🐛 Nuevo Reporte de Error
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- User Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Información del Usuario
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #666666; font-size: 13px;">👤 Usuario:</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 13px;">${escapeHtml(data.userName)}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #666666; font-size: 13px;">📧 Email:</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 13px;">${escapeHtml(data.userEmail)}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #666666; font-size: 13px;">🏥 Clínica:</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 13px;">${escapeHtml(data.tenantName)} (${escapeHtml(data.tenantSlug)})</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #666666; font-size: 13px;">🕐 Fecha:</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <strong style="color: #333333; font-size: 13px;">${formatTimestamp(data.timestamp)}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 12px 0; color: #333333; font-size: 16px; font-weight: 600;">
                  📝 Descripción del Error
                </h3>
                <div style="background-color: #fef2f2; padding: 16px; border-radius: 6px; border-left: 4px solid ${errorColor};">
                  <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.description)}</p>
                </div>
              </div>

              <!-- Steps to Reproduce -->
              <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 12px 0; color: #333333; font-size: 16px; font-weight: 600;">
                  🔄 Pasos para Reproducir
                </h3>
                <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; border-left: 4px solid #6b7280;">
                  <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.stepsToReproduce)}</p>
                </div>
              </div>

              <!-- Expected Behavior -->
              <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 12px 0; color: #333333; font-size: 16px; font-weight: 600;">
                  ✅ Comportamiento Esperado
                </h3>
                <div style="background-color: #f0fdf4; padding: 16px; border-radius: 6px; border-left: 4px solid #22c55e;">
                  <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.expectedBehavior)}</p>
                </div>
              </div>

              <!-- Technical Info -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #333333; font-size: 16px; font-weight: 600;">
                  🔧 Información Técnica
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                  <tr>
                    <td style="padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 6px 0;">
                            <span style="color: #666666; font-size: 13px;">🔗 URL:</span>
                          </td>
                          <td style="padding: 6px 0; text-align: right;">
                            <code style="color: #333333; font-size: 12px; background: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${escapeHtml(data.currentUrl)}</code>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0;">
                            <span style="color: #666666; font-size: 13px;">📸 Capturas:</span>
                          </td>
                          <td style="padding: 6px 0; text-align: right;">
                            <strong style="color: #333333; font-size: 13px;">${data.screenshotCount} adjunta(s)</strong>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <span style="color: #666666; font-size: 12px;">🌐 User Agent:</span>
                        <p style="margin: 6px 0 0 0; color: #666666; font-size: 11px; word-break: break-all;">${escapeHtml(data.userAgent)}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Response Reminder -->
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
                Este reporte fue enviado desde el dashboard de Vetify
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
