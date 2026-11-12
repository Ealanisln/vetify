/**
 * Map staff create/update errors to Spanish messages for the API response.
 */

import { ZodError, type ZodIssue } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  name: 'El nombre',
  position: 'La posición',
  email: 'El email',
  phone: 'El teléfono',
  licenseNumber: 'La cédula profesional',
  isActive: 'El estado',
  publicBio: 'La biografía',
  publicPhoto: 'La foto',
  specialties: 'Las especialidades',
  showOnPublicPage: 'La visibilidad en la página pública',
};

export interface StaffFieldError {
  field: string;
  message: string;
}

function issueMessage(issue: ZodIssue): string {
  const field = String(issue.path[0] ?? '');
  const label = FIELD_LABELS[field] ?? 'Un campo';

  // zod's built-in messages are English; schema-defined ones are Spanish
  if (issue.code === 'invalid_type') {
    return issue.received === 'undefined' ? `${label} es requerido` : `${label} tiene un formato inválido`;
  }
  if (issue.code === 'invalid_string' && issue.validation === 'url') {
    return `${label} debe ser una URL válida`;
  }
  return issue.message;
}

/**
 * @returns A status and body for known errors, or null to fall through.
 */
export function staffErrorResponse(
  error: unknown
): { status: number; body: { message: string; errors?: StaffFieldError[] } } | null {
  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issueMessage(issue),
    }));
    return {
      status: 400,
      body: { message: errors.map((e) => e.message).join('. '), errors },
    };
  }

  if (error && typeof error === 'object' && 'code' in error && (error as { code: unknown }).code === 'P2002') {
    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    const fields = Array.isArray(target) ? target.map(String) : [String(target ?? '')];
    if (fields.some((f) => f.includes('email'))) {
      return {
        status: 409,
        body: {
          message:
            'Este email ya está registrado para otro miembro del personal en Vetify. Usa un email distinto.',
        },
      };
    }
    return { status: 409, body: { message: 'Ya existe un registro con estos datos' } };
  }

  return null;
}
