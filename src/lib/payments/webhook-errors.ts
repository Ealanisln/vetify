import Stripe from 'stripe';
import { Prisma } from '@prisma/client';

/**
 * Classifies an error thrown while processing a Stripe webhook as either
 * worth retrying (transient) or not (permanent).
 *
 * Stripe redelivers any event we answer with a non-2xx status, backing off for
 * up to ~3 days. That retry loop is exactly what we want for a dropped DB
 * connection or a Stripe rate-limit — but it is pure noise for a code/data bug
 * that will fail identically on every attempt. For those permanent failures we
 * acknowledge the event (2xx) and rely on Sentry to surface it, instead of
 * burning days of retries.
 *
 * The default is deliberately conservative: anything we don't explicitly
 * recognise as permanent is treated as transient, so an unfamiliar failure
 * still gets retried rather than silently dropped.
 */
export function isPermanentError(error: unknown): boolean {
  // Bad query shape / wrong arguments — a code bug. Retrying never helps.
  if (error instanceof Prisma.PrismaClientValidationError) {
    return true;
  }

  // Stripe rejected the request itself (unknown id, bad params). The same
  // request will be rejected on every retry.
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return true;
  }

  return false;
}

/** Inverse of {@link isPermanentError}; provided for call-site readability. */
export function isTransientError(error: unknown): boolean {
  return !isPermanentError(error);
}
