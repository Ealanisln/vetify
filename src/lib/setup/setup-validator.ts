import { prisma } from '../prisma';

export async function hasSuperAdmins() {
  const superAdminRole = await prisma.role.findFirst({
    where: {
      key: 'SUPER_ADMIN',
      userRoles: {
        some: {},
      },
    },
    select: { id: true },
  });
  return Boolean(superAdminRole);
}

export async function assertSetupAllowed() {
  const exists = await hasSuperAdmins();
  if (exists) {
    throw new Error('Setup already completed.');
  }
} 