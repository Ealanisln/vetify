/**
 * Double-booking detection shared by every route that creates, moves or
 * checks an appointment slot.
 *
 * - With a staff member: the new slot conflicts with any overlapping active
 *   appointment of that staff member (a vet cannot be in two places).
 * - Without a staff member: the clinic is treated as a single agenda, so the
 *   slot conflicts with any overlapping active appointment of the tenant,
 *   narrowed to the same location (or unlocated ones) when a location is
 *   given. This matches how public booking computes availability.
 *
 * Overlap uses each existing appointment's own duration.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Statuses that no longer hold their time slot */
export const SLOT_RELEASING_STATUSES = ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] as const;

// Validators cap duration at 480 minutes; a day of lookback covers any row
const MAX_LOOKBACK_MS = 24 * 60 * 60 * 1000;

export interface ConflictQuery {
  tenantId: string;
  start: Date;
  durationMinutes: number;
  staffId?: string | null;
  locationId?: string | null;
  excludeAppointmentId?: string | null;
}

export async function findConflictingAppointment(query: ConflictQuery) {
  const { tenantId, start, durationMinutes, staffId, locationId, excludeAppointmentId } = query;
  const startMs = start.getTime();
  const end = new Date(startMs + durationMinutes * 60000);

  const where: Prisma.AppointmentWhereInput = {
    tenantId,
    status: { notIn: [...SLOT_RELEASING_STATUSES] },
    ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
    // Starts before the new slot ends, and recently enough to still be running
    dateTime: { lt: end, gt: new Date(startMs - MAX_LOOKBACK_MS) },
    ...(staffId
      ? { staffId }
      : locationId
        ? { OR: [{ locationId }, { locationId: null }] }
        : {}),
  };

  const candidates = await prisma.appointment.findMany({
    where,
    orderBy: { dateTime: 'asc' },
    select: {
      id: true,
      dateTime: true,
      duration: true,
      staffId: true,
      staff: { select: { name: true } },
      customer: { select: { name: true } },
      pet: { select: { name: true } },
    },
  });

  return (
    candidates.find((appointment) => {
      const otherStart = appointment.dateTime.getTime();
      const otherEnd = otherStart + appointment.duration * 60000;
      return otherStart < end.getTime() && otherEnd > startMs;
    }) ?? null
  );
}

type Conflict = NonNullable<Awaited<ReturnType<typeof findConflictingAppointment>>>;

/** Spanish message for the dashboard when a slot is taken */
export function conflictMessage(staffId: string | null | undefined, conflict: Pick<Conflict, 'staff'>): string {
  if (staffId) {
    return `${conflict.staff?.name || 'este veterinario'} ya tiene una cita en este horario`;
  }
  return 'Ya hay una cita en este horario. Asigna un veterinario para agendar citas al mismo tiempo.';
}

/** English message for the public v1 API, whose errors are all in English */
export function v1ConflictMessage(staffId: string | null | undefined): string {
  return staffId
    ? 'Staff member has a conflicting appointment at this time'
    : 'Another appointment is already booked at this time; assign a staff member to book overlapping appointments';
}
