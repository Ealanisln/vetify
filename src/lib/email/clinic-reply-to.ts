/**
 * Reply-to for emails a clinic's customers receive.
 *
 * Pet owners reply to appointment and treatment emails expecting to reach
 * their clinic, so those replies must go to the clinic, not to Vetify.
 */
import { prisma } from '@/lib/prisma';
import type { EmailData } from './types';

/** Templates sent to the clinic's customers (pet owners), not to its staff */
export const CUSTOMER_FACING_TEMPLATES: ReadonlySet<EmailData['template']> = new Set<
  EmailData['template']
>([
  'appointment-confirmation',
  'appointment-reminder',
  'appointment-cancellation',
  'appointment-rescheduled',
  'treatment-reminder',
  'testimonial-request',
]);

/** Positions that own or run the clinic (the signup owner is 'Administrador') */
const OWNER_POSITIONS = ['Administrador', 'MANAGER'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function usableEmail(value: string | null | undefined): string | null {
  const email = value?.trim();
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

/**
 * The clinic's contact email: its public email, else its owner's (the
 * oldest active admin with an email). Null when it has neither.
 */
export async function getClinicReplyTo(tenantId: string): Promise<string | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      publicEmail: true,
      staff: {
        where: { isActive: true, email: { not: null }, position: { in: OWNER_POSITIONS } },
        select: { email: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });
  if (!tenant) return null;
  return usableEmail(tenant.publicEmail) ?? usableEmail(tenant.staff[0]?.email);
}

/**
 * Reply-to for an outgoing email when the caller did not set one: the
 * clinic's contact email for customer-facing templates, otherwise null
 * (the sender's default). Never throws; a failed lookup falls back too.
 */
export async function resolveDefaultReplyTo(emailData: EmailData): Promise<string | null> {
  if (!CUSTOMER_FACING_TEMPLATES.has(emailData.template)) return null;
  try {
    return await getClinicReplyTo(emailData.tenantId);
  } catch (error) {
    console.error('[EMAIL] Could not resolve the clinic reply-to:', error);
    return null;
  }
}
