/**
 * Content and timing of TREATMENT reminders (vaccines, deworming, etc.).
 *
 * Storage contract (no schema change): for TREATMENT reminders,
 * `Reminder.dueDate` is the date the treatment is due (noon, clinic time),
 * not the date the reminder is sent. The reminder cron emails it once it is
 * within TREATMENT_REMINDER_LEAD_DAYS clinic days, so the email always shows
 * the real due date and days left. The title carries the Spanish treatment
 * name and starts with the type label, which is how the cron recovers the
 * type for the email template.
 */
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import type { Prisma, TreatmentType } from '@prisma/client';

export const TREATMENT_REMINDER_LEAD_DAYS = 7;

export const TREATMENT_TYPE_LABELS: Record<TreatmentType, string> = {
  VACCINATION: 'Vacuna',
  DEWORMING: 'Desparasitación',
  FLEA_TICK: 'Antipulgas y garrapatas',
  OTHER_PREVENTATIVE: 'Tratamiento preventivo',
};

export type EmailTreatmentType = 'VACCINATION' | 'MEDICATION' | 'CHECKUP' | 'OTHER';

export function buildTreatmentReminderTitle(treatmentType: TreatmentType, productName?: string | null): string {
  const label = TREATMENT_TYPE_LABELS[treatmentType];
  const product = productName?.trim();
  return product ? `${label}: ${product}` : label;
}

interface TreatmentReminderInput {
  tenantId: string;
  petId: string;
  petName: string;
  customerId: string | null;
  treatmentType: TreatmentType;
  productName?: string | null;
  /** Treatment due date, already normalized to the clinic day. */
  dueDate: Date;
  timeZone: string;
}

export function buildTreatmentReminderData(input: TreatmentReminderInput): Prisma.ReminderUncheckedCreateInput {
  const title = buildTreatmentReminderTitle(input.treatmentType, input.productName);
  const dueDateText = formatInTimeZone(input.dueDate, input.timeZone, "d 'de' MMMM 'de' yyyy", { locale: es });
  return {
    tenantId: input.tenantId,
    petId: input.petId,
    customerId: input.customerId,
    type: 'TREATMENT',
    title,
    message: `${input.petName} tiene programado: ${title}, el ${dueDateText}.`,
    dueDate: input.dueDate,
    status: 'PENDING',
  };
}

/** Maps a reminder title (Spanish, or legacy English) to the email template type. */
export function emailTreatmentTypeFromTitle(title: string): EmailTreatmentType {
  const normalized = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  if (normalized.includes('vacun') || normalized.includes('vaccin')) return 'VACCINATION';
  if (
    normalized.includes('desparasit') ||
    normalized.includes('deworm') ||
    normalized.includes('antipulgas') ||
    normalized.includes('flea')
  ) {
    return 'MEDICATION';
  }
  if (normalized.includes('revision') || normalized.includes('checkup')) return 'CHECKUP';
  return 'OTHER';
}
