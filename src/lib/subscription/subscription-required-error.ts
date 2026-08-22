import { NextResponse } from 'next/server';

export const SUBSCRIPTION_REQUIRED_CODE = 'SUBSCRIPTION_REQUIRED' as const;

/**
 * Thrown by requireActiveSubscriptionApi() when the tenant has neither an
 * active paid plan nor a valid trial.
 *
 * Lives outside lib/auth so route tests can keep the real class while mocking
 * the auth module wholesale.
 */
export class SubscriptionRequiredError extends Error {
  readonly code = SUBSCRIPTION_REQUIRED_CODE;

  constructor(message = 'Active subscription required') {
    super(message);
    this.name = 'SubscriptionRequiredError';
  }
}

/**
 * The JSON answer every subscription-gated route handler returns for a
 * SubscriptionRequiredError. 403 rather than a redirect: fetch() callers
 * cannot follow a page redirect meaningfully, and the client already knows
 * where to send the user (settings → subscription).
 */
export function subscriptionRequiredResponse() {
  return NextResponse.json(
    { error: 'Suscripción requerida', code: SUBSCRIPTION_REQUIRED_CODE },
    { status: 403 }
  );
}
