/**
 * Reminder Alert Email Service
 *
 * Handles sending treatment reminder and appointment reminder emails
 */

import { prisma } from '../prisma';
import {
  sendTreatmentReminder,
  sendAppointmentReminder,
} from './email-service';
import type {
  TreatmentReminderData,
  AppointmentReminderData,
} from './types';

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

    // Get pending reminders that are due
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        type: 'TREATMENT',
        dueDate: {
          lte: now,
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
          },
        },
      },
    });

    console.log(
      `[TREATMENT_REMINDERS] Processing ${pendingReminders.length} reminders`
    );

    for (const reminder of pendingReminders) {
      try {
        // Skip if customer has no email
        if (!reminder.customer.email) {
          console.warn(
            `[TREATMENT_REMINDERS] No email for customer ${reminder.customer.id}`
          );
          continue;
        }

        // Calculate days until treatment
        const treatmentDate = reminder.dueDate;
        const daysUntil = Math.ceil(
          (treatmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get treatment type from reminder title
        let treatmentType: 'VACCINATION' | 'MEDICATION' | 'CHECKUP' | 'OTHER' =
          'OTHER';
        if (reminder.title.toLowerCase().includes('vacun')) {
          treatmentType = 'VACCINATION';
        } else if (reminder.title.toLowerCase().includes('desparasit')) {
          treatmentType = 'MEDICATION';
        } else if (reminder.title.toLowerCase().includes('revision')) {
          treatmentType = 'CHECKUP';
        }

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
            daysUntilDue: Math.max(0, daysUntil),
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

/**
 * Process upcoming appointments and send reminder emails (24 hours before)
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
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Get appointments that are 24-25 hours away and haven't had reminders sent
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: twentyFourHoursFromNow,
          lte: twentyFiveHoursFromNow,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
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
          },
        },
      },
    });

    console.log(
      `[APPOINTMENT_REMINDERS] Processing ${upcomingAppointments.length} appointments`
    );

    for (const appointment of upcomingAppointments) {
      try {
        // Skip if customer has no email
        if (!appointment.customer.email) {
          console.warn(
            `[APPOINTMENT_REMINDERS] No email for customer ${appointment.customer.id}`
          );
          continue;
        }

        // Check if reminder was already sent (look for recent email log)
        const existingReminder = await prisma.emailLog.findFirst({
          where: {
            tenantId: appointment.tenantId,
            recipientEmail: appointment.customer.email,
            template: 'APPOINTMENT_REMINDER',
            metadata: {
              path: ['data', 'appointmentId'],
              equals: appointment.id,
            },
            createdAt: {
              gte: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Last 2 hours
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

        const appointmentTime = appointment.dateTime.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const emailData: AppointmentReminderData = {
          template: 'appointment-reminder',
          to: {
            email: appointment.customer.email,
            name: appointment.customer.name,
          },
          subject: `Recordatorio de Cita - ${appointment.pet.name}`,
          tenantId: appointment.tenantId,
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
