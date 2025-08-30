'use server';

import { z } from 'zod';
import { assignSuperAdmin, removeSuperAdmin } from '../../../lib/super-admin';
import { revalidatePath } from 'next/cache';

const emailSchema = z.string().email();

export async function assignSuperAdminAction(email: string) {
  // TODO: Add validation and error handling
  const validatedEmail = emailSchema.parse(email);
  await assignSuperAdmin(validatedEmail);
  revalidatePath('/admin/super-admins');
}

export async function removeSuperAdminAction(userId: string) {
  // TODO: Add validation and error handling
  await removeSuperAdmin(userId);
  revalidatePath('/admin/super-admins');
} 