import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppointmentDetailClient from './AppointmentDetailClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAppointmentData(appointmentId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    redirect('/api/auth/login');
  }

  const { tenant } = await requireAuth();

  if (!tenant) {
    throw new Error('No se encontró información del tenant');
  }

  // Obtener la cita con todos sus detalles
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      pet: {
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
          position: true,
        },
      },
    },
  });

  if (!appointment) {
    notFound();
  }

  // Obtener datos adicionales para edición
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: tenant.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const pets = await prisma.pet.findMany({
    where: {
      tenantId: tenant.id,
    },
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      customerId: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const staff = await prisma.staff.findMany({
    where: {
      tenantId: tenant.id,
    },
    select: {
      id: true,
      name: true,
      position: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return {
    appointment: {
      ...appointment,
      dateTime: appointment.dateTime,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    },
    customers,
    pets,
    staff,
  };
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAppointmentData(id);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <AppointmentDetailClient
          appointment={data.appointment}
          customers={data.customers}
          pets={data.pets}
          staff={data.staff}
        />
      </Suspense>
    </div>
  );
}
