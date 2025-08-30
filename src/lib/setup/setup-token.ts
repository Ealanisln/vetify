import { nanoid } from 'nanoid';
import { addMinutes, isBefore } from 'date-fns';
import { prisma } from '../prisma';

/**
 * Generates a secure setup token tied to an email address. Tokens expire after `expirationMinutes`.
 * If a valid, unused token already exists for the same email we reuse it to avoid spamming.
 */
export async function generateSetupToken(email: string, expirationMinutes = 15) {
  // Reuse existing active token if available
  const existing = await prisma.setupToken.findFirst({
    where: {
      email: email.toLowerCase(),
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return existing;
  }

  const token = nanoid(32);
  const expiresAt = addMinutes(new Date(), expirationMinutes);

  return prisma.setupToken.create({
    data: {
      token,
      email: email.toLowerCase(),
      expiresAt,
    },
  });
}

/**
 * Validates whether the provided token string is valid, not expired, and not used.
 */
export async function validateSetupToken(token: string) {
  const record = await prisma.setupToken.findUnique({
    where: { token },
  });

  if (!record) return { valid: false, reason: 'Token not found' } as const;
  if (record.used) return { valid: false, reason: 'Token already used' } as const;
  if (isBefore(record.expiresAt, new Date()))
    return { valid: false, reason: 'Token expired' } as const;

  return { valid: true, token: record } as const;
}

/**
 * Marks the token as used and links it to the user who completed setup.
 */
export async function consumeSetupToken(token: string, usedByUserId: string) {
  return prisma.setupToken.update({
    where: { token },
    data: {
      used: true,
      usedAt: new Date(),
      usedBy: usedByUserId,
    },
  });
} 