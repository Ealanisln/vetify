/**
 * Reminder Alert Email Service
 *
 * Handles sending treatment reminder and appointment reminder emails
 */

import { prisma } from '../prisma';
import { clinicDaysBetween, getClinicTimeZoneFor } from '../clinical-dates';
import {
  TREATMENT_REMINDER_LEAD_DAYS,
  emailTreatmentTypeFromTitle,
} from '../treatment-reminder-content';
import {
  sendTreatmentReminder,
  sendAppointmentReminder,
} from './email-service';
import type {
  TreatmentReminderData,
  AppointmentReminderData,
} from './types';
import { formatTime } from '../utils/date-format';
import { clinicDayRange, clinicToday, getClinicTimeZone } from '../clinic-timezone';
import { shouldSendNotification } from '../enhanced-settings';
import type { AppointmentStatus } from '@prisma/client';

/**
 * Process pending treatment reminders and send emails
 */
export async function processTreatmentReminders(): Promise<{
  success: boolean;
  remindersProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let emailsSent = 0;

  try {
    const now = new Date();

    // Reminder.dueDate is the treatment date (see treatment-reminder-content.ts).
    // Fetch one extra day so clinic-day rounding never skips the first send day.
    const windowEnd = new Date(
      now.getTime() + (TREATMENT_REMINDER_LEAD_DAYS + 1) * 24 * 60 * 60 * 1000
    );
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        type: 'TREATMENT',
        dueDate: {
          lte: windowEnd,
        },
      },
      include: {
        pet: {
          include: {
            customer: true,
          },
        },
        customer: true,
        tenant: {
          select: {
            id: true,
            name: true,
            publicPhone: true,
            countryCode: true,
            tenantSettings: { select: { timezone: true } },
          },
        },
      },
    });

    console.log(
      `[TREATMENT_REMINDERS] Processing ${pendingReminders.length} reminders`
    );

    for (const reminder of pendingReminders) {
      try {
        const treatmentDate = reminder.dueDate;
        const timeZone = getClinicTimeZoneFor(reminder.tenant);
        const daysUntil = clinicDaysBetween(now, treatmentDate, timeZone);

        // Not yet within the reminder window
        if (daysUntil > TREATMENT_REMINDER_LEAD_DAYS) continue;

        // The treatment date already passed: an email would be useless
        if (daysUntil < 0) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: 'DISMISSED' },
          });
          continue;
        }

        // Skip if there is no owner email or the pet was removed
        if (!reminder.customer?.email || !reminder.pet) {
          console.warn(
            `[TREATMENT_REMINDERS] No customer email or pet for reminder ${reminder.id}`
          );
          continue;
        }

        const treatmentType = emailTreatmentTypeFromTitle(reminder.title);

        const emailData: TreatmentReminderData = {
          template: 'treatment-reminder',
          to: {
            email: reminder.customer.email,
            name: reminder.customer.name,
          },
          subject: `Recordatorio: ${reminder.title} - ${reminder.pet.name}`,
          tenantId: reminder.tenantId,
          data: {
            reminderId: reminder.id,
            petName: reminder.pet.name,
            ownerName: reminder.customer.name,
            treatmentName: reminder.title,
            treatmentType,
            dueDate: treatmentDate,
            clinicName: reminder.tenant.name,
            clinicPhone: reminder.tenant.publicPhone || undefined,
            notes: reminder.message || undefined,
            daysUntilDue: daysUntil,
          },
        };

        const result = await sendTreatmentReminder(emailData);

        if (result.success) {
          // Mark reminder as sent
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          emailsSent++;
        } else {
          errors.push(
            `Failed to send reminder ${reminder.id}: ${result.error}`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Reminder ${reminder.id}: ${errorMessage}`);
        console.error('[TREATMENT_REMINDERS] Error:', errorMessage);
      }
    }

    return {
      success: errors.length === 0,
      remindersProcessed: pendingReminders.length,
      emailsSent,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[TREATMENT_REMINDERS] Fatal error:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      remindersProcessed: 0,
      emailsSent: 0,
      errors,
    };
  }
}

/** Statuses that still expect the client to show up */
const REMINDABLE_APPOINTMENT_STATUSES: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED'];

/**
 * The cron runs once a day, so the candidate window must cover "tomorrow" in
 * every clinic timezone (UTC-12..UTC+14): the next 3 days are always enough.
 * The exact clinic-local day is checked per appointment.
 */
const CANDIDATE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/** The calendar day after `date` (yyyy-MM-dd) */
function nextCalendarDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * Send a reminder for every appointment on the NEXT clinic-local calendar
 * day. Meant to run once a day; each appointment gets at most one reminder
 * (a non-failed APPOINTMENT_REMINDER EmailLog row blocks a second one), so
 * re-running the cron the same day is safe.
 */
export async function processAppointmentReminders(): Promise<{
  success: boolean;
  appointmentsChecked: number;
  emailsSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let emailsSent = 0;

  try {
    const now = new Date();

    const candidates = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gt: now,
          lte: new Date(now.getTime() + CANDIDATE_WINDOW_MS),
        },
        status: {
          in: REMINDABLE_APPOINTMENT_STATUSES,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            publicPhone: true,
            publicAddress: true,
            countryCode: true,
            tenantSettings: { select: { timezone: true } },
          },
        },
      },
    });

    // Keep only appointments on tomorrow's date in their clinic's timezone
    const upcomingAppointments = candidates
      .map((appointment) => ({
        appointment,
        timeZone: getClinicTimeZone(appointment.tenant),
      }))
      .filter(({ appointment, timeZone }) => {
        const tomorrow = nextCalendarDay(clinicToday(timeZone, now));
        const { start, end } = clinicDayRange(tomorrow, timeZone);
        return appointment.dateTime >= start && appointment.dateTime <= end;
      });

    console.log(
      `[APPOINTMENT_REMINDERS] Processing ${upcomingAppointments.length} appointments`
    );

    const reminderEnabled = new Map<string, boolean>();

    for (const { appointment, timeZone } of upcomingAppointments) {
      try {
        // Skip if customer has no email
        if (!appointment.customer.email) {
          console.warn(
            `[APPOINTMENT_REMINDERS] No email for customer ${appointment.customer.id}`
          );
          continue;
        }

        if (!reminderEnabled.has(appointment.tenantId)) {
          reminderEnabled.set(
            appointment.tenantId,
            await shouldSendNotification(appointment.tenantId, 'appointmentReminder')
          );
        }
        if (!reminderEnabled.get(appointment.tenantId)) continue;

        // At most one reminder per appointment, ever. Failed attempts don't
        // count, so a re-run the same day retries them.
        const existingReminder = await prisma.emailLog.findFirst({
          where: {
            tenantId: appointment.tenantId,
            template: 'APPOINTMENT_REMINDER',
            status: { not: 'FAILED' },
            metadata: {
              path: ['data', 'appointmentId'],
              equals: appointment.id,
            },
          },
        });

        if (existingReminder) {
          console.log(
            `[APPOINTMENT_REMINDERS] Reminder already sent for appointment ${appointment.id}`
          );
          continue;
        }

        // Calculate hours until appointment
        const hoursUntil = Math.ceil(
          (appointment.dateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        const appointmentTime = formatTime(appointment.dateTime, timeZone);

        const emailData: AppointmentReminderData = {
          template: 'appointment-reminder',
          to: {
            email: appointment.customer.email,
            name: appointment.customer.name,
          },
          subject: `Recordatorio de Cita - ${appointment.pet.name}`,
          tenantId: appointment.tenantId,
          timeZone,
          data: {
            appointmentId: appointment.id,
            petName: appointment.pet.name,
            ownerName: appointment.customer.name,
            appointmentDate: appointment.dateTime,
            appointmentTime,
            serviceName: appointment.reason,
            clinicName: appointment.tenant.name,
            clinicAddress: appointment.tenant.publicAddress || undefined,
            clinicPhone: appointment.tenant.publicPhone || undefined,
            veterinarianName: appointment.staff?.name,
            hoursUntilAppointment: hoursUntil,
          },
        };

        const result = await sendAppointmentReminder(emailData);

        if (result.success) {
          emailsSent++;
        } else {
          errors.push(
            `Failed to send reminder for appointment ${appointment.id}: ${result.error}`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Appointment ${appointment.id}: ${errorMessage}`);
        console.error('[APPOINTMENT_REMINDERS] Error:', errorMessage);
      }
    }

    return {
      success: errors.length === 0,
      appointmentsChecked: upcomingAppointments.length,
      emailsSent,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[APPOINTMENT_REMINDERS] Fatal error:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      appointmentsChecked: 0,
      emailsSent: 0,
      errors,
    };
  }
}

/**
 * Process all reminders (both treatment and appointment)
 * This should be called by a cron job every hour
 */
export async function processAllReminders(): Promise<{
  success: boolean;
  treatmentReminders: {
    processed: number;
    sent: number;
  };
  appointmentReminders: {
    processed: number;
    sent: number;
  };
  errors: string[];
}> {
  const [treatmentResult, appointmentResult] = await Promise.all([
    processTreatmentReminders(),
    processAppointmentReminders(),
  ]);

  return {
    success: treatmentResult.success && appointmentResult.success,
    treatmentReminders: {
      processed: treatmentResult.remindersProcessed,
      sent: treatmentResult.emailsSent,
    },
    appointmentReminders: {
      processed: appointmentResult.appointmentsChecked,
      sent: appointmentResult.emailsSent,
    },
    errors: [
...treatmentResult.errors,
      ...appointmentResult.errors,
    ],
  };
}
