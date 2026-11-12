/**
 * @jest-environment node
 *
 * Vaccine/treatment reminders end to end: saving a vaccination with a next
 * dose must create a Reminder, and the reminder cron must email the real due
 * date, the right number of days and a Spanish treatment name.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { formatInTimeZone } from 'date-fns-tz';
import { TreatmentType, VaccinationStage } from '@prisma/client';

jest.mock('@/lib/email/email-service', () => ({
  sendTreatmentReminder: jest.fn(),
  sendAppointmentReminder: jest.fn(),
}));

import { createTreatment, createVaccination } from '@/lib/medical';
import { processTreatmentReminders } from '@/lib/email/reminder-alerts';
import { sendTreatmentReminder } from '@/lib/email/email-service';
import { createTreatmentSchedule } from '@/lib/treatment-reminders';

const TZ = 'America/Mexico_City';
const DAY = 24 * 60 * 60 * 1000;

const tenant = {
  id: 'tenant-1',
  name: 'Clínica Patitas',
  publicPhone: '5512345678',
  countryCode: 'MX',
  tenantSettings: { timezone: 'UTC' },
};
const customer = { id: 'customer-1', name: 'Ana López', email: 'ana@example.com' };
const pet = { id: 'pet-1', name: 'Firulais', customerId: customer.id };

/** In-memory Reminder table driven by what the real code writes. */
function useReminderTable() {
  const rows: any[] = [];
  prismaMock.reminder.create.mockImplementation((async ({ data }: any) => {
    const row = { id: `reminder-${rows.length + 1}`, status: 'PENDING', ...data };
    rows.push(row);
    return row;
  }) as any);
  prismaMock.reminder.findMany.mockImplementation((async ({ where }: any) =>
    rows
      .filter((r) => r.status === where.status && r.type === where.type)
      .filter((r) => !where.dueDate?.lte || r.dueDate <= where.dueDate.lte)
      .map((r) => ({ ...r, pet, customer, tenant }))) as any);
  prismaMock.reminder.update.mockImplementation((async ({ where, data }: any) => {
    const row = rows.find((r) => r.id === where.id);
    Object.assign(row, data);
    return row;
  }) as any);
  return rows;
}

function vaccinationData(administered: Date, nextDue: Date) {
  return {
    vaccine_type: TreatmentType.VACCINATION,
    vaccine_brand: 'Nobivac Rabia',
    batch_number: 'LOT-1',
    administered_date: administered,
    next_due_date: nextDue,
    veterinarian_id: 'staff-1',
    vaccine_stage: VaccinationStage.BOOSTER,
  } as const;
}

describe('treatment reminders flow', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    prismaMock.$transaction.mockImplementation((async (fn: any) => fn(prismaMock)) as any);
    prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
    prismaMock.pet.findFirst.mockResolvedValue(pet as any);
    prismaMock.treatmentRecord.create.mockImplementation((async ({ data }: any) => ({ id: 'record-1', ...data })) as any);
    prismaMock.treatmentSchedule.create.mockImplementation((async ({ data }: any) => ({ id: 'schedule-1', ...data })) as any);
    (sendTreatmentReminder as jest.Mock).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    logSpy.mockRestore();
  });

  it('creates a Reminder when a vaccination has a next dose, and emails the real due date 7 days before', async () => {
    const rows = useReminderTable();
    // Saved on Nov 12 at 10:00 clinic time; the date inputs send UTC midnight of the picked day.
    const savedAt = new Date('2026-11-12T16:00:00Z');
    jest.setSystemTime(savedAt);

    await createVaccination(
      pet.id,
      tenant.id,
      vaccinationData(new Date('2026-11-12T00:00:00Z'), new Date('2026-11-22T00:00:00Z'))
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId: tenant.id,
      petId: pet.id,
      customerId: customer.id,
      type: 'TREATMENT',
    });
    expect(rows[0].title).not.toMatch(/vaccination/i);
    expect(rows[0].title).toMatch(/Vacuna/);

    // Same day: 10 days ahead, too early for the reminder.
    await processTreatmentReminders();
    expect(sendTreatmentReminder).not.toHaveBeenCalled();

    // Cron run (07:00 UTC) seven days before the due date.
    jest.setSystemTime(new Date('2026-11-15T07:00:00Z'));
    await processTreatmentReminders();

    expect(sendTreatmentReminder).toHaveBeenCalledTimes(1);
    const email = (sendTreatmentReminder as jest.Mock).mock.calls[0][0];
    expect(formatInTimeZone(email.data.dueDate, TZ, 'yyyy-MM-dd')).toBe('2026-11-22');
    // The email service formats the date without a timezone; it must still land on the 22nd.
    expect(email.data.dueDate.toISOString().slice(0, 10)).toBe('2026-11-22');
    expect(email.data.daysUntilDue).toBe(7);
    expect(email.data.treatmentType).toBe('VACCINATION');
    expect(email.data.treatmentName).toContain('Nobivac Rabia');
    expect(email.data.treatmentName).not.toMatch(/vaccination/i);
    expect(rows[0].status).toBe('SENT');

    // Next day's run does not send it again.
    jest.setSystemTime(new Date('2026-11-16T07:00:00Z'));
    await processTreatmentReminders();
    expect(sendTreatmentReminder).toHaveBeenCalledTimes(1);
  });

  it('sends a reminder for a dose due in fewer than 7 days on the next run, with the actual days left', async () => {
    useReminderTable();
    jest.setSystemTime(new Date('2026-11-12T16:00:00Z'));

    await createVaccination(
      pet.id,
      tenant.id,
      vaccinationData(new Date('2026-11-12T00:00:00Z'), new Date('2026-11-15T00:00:00Z'))
    );

    jest.setSystemTime(new Date('2026-11-13T07:00:00Z'));
    await processTreatmentReminders();

    const email = (sendTreatmentReminder as jest.Mock).mock.calls[0][0];
    expect(email.data.daysUntilDue).toBe(2);
    expect(formatInTimeZone(email.data.dueDate, TZ, 'yyyy-MM-dd')).toBe('2026-11-15');
  });

  it('does not email a reminder whose treatment date already passed', async () => {
    const rows = useReminderTable();
    jest.setSystemTime(new Date('2026-11-12T16:00:00Z'));

    await createVaccination(
      pet.id,
      tenant.id,
      vaccinationData(new Date('2026-11-12T00:00:00Z'), new Date('2026-11-14T00:00:00Z'))
    );

    jest.setSystemTime(new Date('2026-11-20T07:00:00Z'));
    await processTreatmentReminders();

    expect(sendTreatmentReminder).not.toHaveBeenCalled();
    expect(rows[0].status).toBe('DISMISSED');
  });

  it('createTreatmentSchedule stores the treatment date and a Spanish title, so the cron emails it correctly', async () => {
    const rows = useReminderTable();
    prismaMock.treatmentSchedule.create.mockImplementation((async ({ data }: any) => ({
      id: 'schedule-2',
      ...data,
      pet: { ...pet, customer },
    })) as any);
    jest.setSystemTime(new Date('2026-11-12T16:00:00Z'));

    await createTreatmentSchedule(tenant.id, {
      petId: '6f9619ff-8b86-4d11-b42d-00c04fc964ff',
      treatmentType: 'DEWORMING',
      productName: 'Drontal',
      scheduledDate: new Date('2026-12-01T00:00:00Z'),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Desparasitación: Drontal');

    jest.setSystemTime(new Date('2026-11-24T07:00:00Z'));
    await processTreatmentReminders();

    const email = (sendTreatmentReminder as jest.Mock).mock.calls[0][0];
    expect(formatInTimeZone(email.data.dueDate, TZ, 'yyyy-MM-dd')).toBe('2026-12-01');
    expect(email.data.daysUntilDue).toBe(7);
    expect(email.data.treatmentType).toBe('MEDICATION');
  });

  function treatmentData(treatmentType: TreatmentType, nextDue?: Date) {
    return {
      medication_name: 'Drontal Plus',
      dosage: '1 tableta',
      frequency: 'Dosis única',
      duration_days: 1,
      instructions: 'Administrar con alimento',
      start_date: new Date('2026-11-12T00:00:00Z'),
      treatment_type: treatmentType,
      veterinarian_id: 'staff-1',
      next_due_date: nextDue,
    };
  }

  it.each([
    [TreatmentType.DEWORMING, 'Desparasitación: Drontal Plus'],
    [TreatmentType.FLEA_TICK, 'Antipulgas y garrapatas: Drontal Plus'],
  ])('creates the schedule and Reminder for the next %s application, and the cron emails it', async (type, title) => {
    const rows = useReminderTable();
    jest.setSystemTime(new Date('2026-11-12T16:00:00Z'));

    await createTreatment(pet.id, tenant.id, treatmentData(type, new Date('2027-02-12T00:00:00Z')));

    expect(prismaMock.treatmentSchedule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        petId: pet.id,
        tenantId: tenant.id,
        treatmentType: type,
        productName: 'Drontal Plus',
        status: 'SCHEDULED',
      }),
    });
    const scheduledDate = (prismaMock.treatmentSchedule.create.mock.calls[0][0] as any).data.scheduledDate;
    expect(formatInTimeZone(scheduledDate, TZ, 'yyyy-MM-dd HH:mm')).toBe('2027-02-12 12:00');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ tenantId: tenant.id, petId: pet.id, customerId: customer.id, type: 'TREATMENT', title });

    jest.setSystemTime(new Date('2027-02-05T07:00:00Z'));
    await processTreatmentReminders();

    const email = (sendTreatmentReminder as jest.Mock).mock.calls[0][0];
    expect(formatInTimeZone(email.data.dueDate, TZ, 'yyyy-MM-dd')).toBe('2027-02-12');
    expect(email.data.daysUntilDue).toBe(7);
  });

  it('does not create a Reminder for a treatment without a next application', async () => {
    const rows = useReminderTable();
    jest.setSystemTime(new Date('2026-11-12T16:00:00Z'));

    await createTreatment(pet.id, tenant.id, treatmentData(TreatmentType.DEWORMING));

    expect(rows).toHaveLength(0);
    expect(prismaMock.treatmentSchedule.create).not.toHaveBeenCalled();
  });

  it('does not create a Reminder when the next dose date is already in the past', async () => {
    const rows = useReminderTable();
    jest.setSystemTime(new Date('2026-11-12T16:00:00Z'));

    await createVaccination(
      pet.id,
      tenant.id,
      vaccinationData(new Date('2026-11-12T00:00:00Z'), new Date('2026-11-01T00:00:00Z'))
    );

    expect(rows).toHaveLength(0);
  });
});
