"use server";
import { z } from 'zod';
import { sendSetupVerificationEmail } from '../../lib/setup/setup-email';
import { revalidatePath } from 'next/cache';

const emailSchema = z.string().email();

export async function requestSetupTokenAction(formData: FormData) {
  const email = emailSchema.parse(formData.get('email'));
  await sendSetupVerificationEmail(email);
  // You could set some flash data or cookies here for success message
  revalidatePath('/setup');
} 