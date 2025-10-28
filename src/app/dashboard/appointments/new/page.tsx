import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NewAppointmentClient from './NewAppointmentClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getRequiredData() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    redirect('/api/auth/login');
  }

  const { tenant } = await requireAuth();

  if (!tenant) {
    throw new Error('No se encontró información del tenant');
  }

  // Obtener clientes con sus mascotas
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

  // Obtener todas las mascotas
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

  // Obtener staff (veterinarios)
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
    customers,
    pets,
    staff,
  };
}

export default async function NewAppointmentPage() {
  const data = await getRequiredData();

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nueva Cita</h1>
        <p className="text-muted-foreground mt-2">
          Programa una nueva cita para una mascota
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <NewAppointmentClient
          customers={data.customers}
          pets={data.pets}
          staff={data.staff}
        />
      </Suspense>
    </div>
  );
}
