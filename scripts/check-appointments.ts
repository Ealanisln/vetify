import { prisma } from '../src/lib/prisma';

async function main() {
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: 'b665648c-b48d-479e-8e64-61f073a81aec',
    },
    select: {
      id: true,
      dateTime: true,
      duration: true,
      status: true,
    },
    orderBy: { dateTime: 'asc' }
  });

  console.log('Appointments in DB:');
  for (const a of appointments) {
    console.log(`- ${a.dateTime.toISOString()} | duration: ${a.duration} | status: ${a.status}`);
  }

  // Simulate the conflict check for Dec 6 at 11:30
  const requestedDateTime = new Date(2025, 11, 6, 11, 30, 0, 0);
  const appointmentDuration = 30;
  const requestedEndTime = new Date(requestedDateTime.getTime() + appointmentDuration * 60000);

  console.log('\nConflict check simulation:');
  console.log('Requested start:', requestedDateTime.toISOString());
  console.log('Requested end:', requestedEndTime.toISOString());

  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: 'b665648c-b48d-479e-8e64-61f073a81aec',
      status: {
        notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']
      },
      AND: [
        {
          dateTime: {
            lt: requestedEndTime
          }
        },
        {
          dateTime: {
            gte: new Date(requestedDateTime.getTime() - (appointmentDuration * 60000))
          }
        }
      ]
    },
    select: {
      id: true,
      dateTime: true,
      duration: true,
      status: true,
    }
  });

  console.log('\nConflict found:', conflict);
}

main().catch(console.error).finally(() => prisma.$disconnect());
