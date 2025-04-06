import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function syncUser() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser) {
    return null;
  }

  // Buscar o crear el usuario en nuestra base de datos
  const user = await prisma.user.upsert({
    where: {
      id: kindeUser.id,
    },
    update: {
      email: kindeUser.email || undefined,
      firstName: kindeUser.given_name || undefined,
      lastName: kindeUser.family_name || undefined,
      name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || undefined,
      updatedAt: new Date(),
    },
    create: {
      id: kindeUser.id,
      email: kindeUser.email || '',
      firstName: kindeUser.given_name || undefined,
      lastName: kindeUser.family_name || undefined,
      name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || undefined,
      isActive: true,
    },
  });

  return user;
} 