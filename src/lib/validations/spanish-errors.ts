/**
 * Turns Zod validation errors into Spanish, per-field messages for the
 * dashboard forms. Zod's built-in messages are English, so the codes that
 * schemas do not customize (missing value, wrong type, bad date) are
 * rewritten here; every other message comes from the schema itself.
 */

import type { ZodError, ZodIssue } from 'zod';

export interface FieldLabel {
  /** Shown when the value is missing. */
  required: string;
  /** Shown when the value has the wrong type or cannot be parsed. */
  invalid: string;
}

export interface ValidationErrorBody {
  message: string;
  errors: Array<{ field: string; message: string }>;
}

function issueMessage(issue: ZodIssue, labels: Record<string, FieldLabel>): string {
  const field = String(issue.path[0] ?? '');
  const label = labels[field];

  if (issue.code === 'invalid_type') {
    const missing = issue.received === 'undefined' || issue.received === 'null';
    if (label) return missing ? label.required : label.invalid;
    return missing ? 'Falta un campo requerido' : 'Un campo tiene un formato inválido';
  }
  if (issue.code === 'invalid_date') {
    return label?.invalid ?? 'La fecha no es válida';
  }
  return issue.message;
}

export function spanishValidationError(
  error: ZodError,
  labels: Record<string, FieldLabel>
): ValidationErrorBody {
  const errors = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issueMessage(issue, labels),
  }));
  return { message: errors.map((e) => e.message).join('. '), errors };
}

/** Field errors keyed by field name, keeping the first message per field. */
export function fieldErrorsByName(
  errors: Array<{ field: string; message: string }> | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { field, message } of errors ?? []) {
    if (field && !(field in result)) result[field] = message;
  }
  return result;
}
