import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Try to find user in database
  let user = await prisma.user.findUnique({
    where: {
      id: kindeUser.id,
    },
    include: {
      tenant: {
        include: {
          tenantSubscription: {
            include: { plan: true }
          }
        }
      }
    }
  });

  // If user doesn't exist, create them (sync from Kinde)
  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          id: kindeUser.id,
          email: kindeUser.email || '',
          firstName: kindeUser.given_name,
          lastName: kindeUser.family_name,
          name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || kindeUser.email?.split('@')[0],
          isActive: true,
        },
        include: {
          tenant: {
            include: {
              tenantSubscription: {
                include: { plan: true }
              }
            }
          }
        }
      });
      
      console.log('User synced from Kinde to local database:', user.email);
    } catch (error) {
      console.error('Error syncing user from Kinde:', error);
      return new NextResponse("Error syncing user", { status: 500 });
    }
  }

  return NextResponse.json(user);
} 