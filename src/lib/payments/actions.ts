'use server';

import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function redirectToCheckout(priceId: string) {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  
  if (!kindeUser) {
    redirect(`/api/auth/login?post_login_redirect_url=${encodeURIComponent(`/precios?checkout=${priceId}`)}`);
  }

  const user = await getAuthenticatedUser();
  const tenant = await getTenantByUserId(user.id);
  
  await createCheckoutSession({
    tenant,
    priceId,
    userId: user.id
  });
}

export async function redirectToCustomerPortal() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const tenant = await getTenantByUserId(user.id);
  if (!tenant) {
    throw new Error('Tenant no encontrado');
  }

  const session = await createCustomerPortalSession(tenant);
  return session.url;
}

async function getTenantByUserId(userId: string) {
  return prisma.tenant.findFirst({
    where: {
      users: {
        some: {
          id: userId
        }
      }
    }
  });
} 