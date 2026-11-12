/**
 * Resend Webhook Handler
 *
 * Handles email delivery status updates from Resend.
 * Updates EmailLog records to track delivery, bounces, and complaints.
 *
 * Events handled:
 * - email.delivered: Email successfully delivered
 * - email.bounced: Email bounced (hard or soft)
 * - email.complained: Recipient marked as spam
 *
 * @see https://resend.com/docs/dashboard/webhooks/introduction
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateEmailStatus } from '@/lib/notifications/notification-logger';
import type { EmailStatus } from '@prisma/client';

// Resend webhook event types we handle
type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.bounced'
  | 'email.complained'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookEvent {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce-specific fields
    bounce?: {
      message: string;
      type?: string;
    };
    // Complaint-specific fields
    complaint?: {
      message: string;
    };
  };
}

/** Max age of a webhook timestamp, to block replays (Svix uses 5 minutes) */
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Verify a Resend webhook signature. Resend delivers through Svix:
 * - the signed content is `${svix-id}.${svix-timestamp}.${rawBody}`
 * - the HMAC-SHA256 key is the base64 part of the `whsec_...` secret
 * - `svix-signature` holds space-separated `v1,<base64>` entries (several
 *   during key rotation); any match is valid.
 * Implemented with node:crypto because `svix` is not a dependency.
 *
 * @see https://docs.svix.com/receiving/verifying-payloads/how-manual
 */
function verifyWebhookSignature(
  payload: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) {
    return false;
  }

  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64');
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest();

  return signature.split(' ').some((entry) => {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) return false;
    const candidate = Buffer.from(value, 'base64');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  });
}

/**
 * Map Resend event type to EmailStatus
 */
function mapEventToStatus(eventType: ResendEventType): EmailStatus | null {
  switch (eventType) {
    case 'email.delivered':
      return 'DELIVERED';
    case 'email.bounced':
      return 'BOUNCED';
    case 'email.complained':
      return 'BOUNCED'; // Treat complaints as bounces for tracking
    default:
      return null; // We don't need to update status for other events
  }
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // SECURITY FIX: Require webhook secret in production
    // Without verification, attackers could forge email status updates
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[RESEND_WEBHOOK] RESEND_WEBHOOK_SECRET is required in production');
        return NextResponse.json(
          { error: 'Webhook not configured' },
          { status: 503 }
        );
      }
      // Allow development without secret (with warning)
      console.warn('[RESEND_WEBHOOK] RESEND_WEBHOOK_SECRET not configured - skipping verification (dev only)');
    }

    // Get the raw body as text for signature verification
    const payload = await request.text();

    // Verify signature when secret is configured
    if (webhookSecret) {
      const timestamp = request.headers.get('svix-timestamp');

      const isValid = verifyWebhookSignature(
        payload,
        {
          id: request.headers.get('svix-id'),
          timestamp,
          signature: request.headers.get('svix-signature'),
        },
        webhookSecret
      );

      if (!isValid) {
        console.error('[RESEND_WEBHOOK] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }

      // Reject replays: the timestamp is part of the signed content
      const eventTime = Number(timestamp) * 1000;
      if (!Number.isFinite(eventTime) || Math.abs(Date.now() - eventTime) > TIMESTAMP_TOLERANCE_MS) {
        console.error('[RESEND_WEBHOOK] Timestamp outside tolerance');
        return NextResponse.json(
          { error: 'Timestamp too old' },
          { status: 401 }
        );
      }
    }

    // Parse the event
    const event: ResendWebhookEvent = JSON.parse(payload);

    // No recipient addresses in logs: the email id is enough to trace it
    console.log('[RESEND_WEBHOOK] Received event:', {
      type: event.type,
      emailId: event.data.email_id,
    });

    // Map event to status
    const newStatus = mapEventToStatus(event.type);

    if (!newStatus) {
      // Event type we don't need to track (sent, opened, clicked, etc.)
      return NextResponse.json({ received: true, action: 'ignored' });
    }

    // Extract error message for bounces/complaints
    let errorMessage: string | undefined;
    if (event.type === 'email.bounced' && event.data.bounce) {
      errorMessage = event.data.bounce.message;
      if (event.data.bounce.type) {
        errorMessage = `${event.data.bounce.type}: ${errorMessage}`;
      }
    } else if (event.type === 'email.complained' && event.data.complaint) {
      errorMessage = `Spam complaint: ${event.data.complaint.message}`;
    }

    // Update email log status
    await updateEmailStatus(event.data.email_id, newStatus, errorMessage);

    console.log('[RESEND_WEBHOOK] Updated email status:', {
      emailId: event.data.email_id,
      status: newStatus,
      error: errorMessage,
    });

    return NextResponse.json({
      received: true,
      action: 'updated',
      status: newStatus,
    });
  } catch (error) {
    console.error('[RESEND_WEBHOOK] Error processing webhook:', error);

    // Return 200 to prevent Resend from retrying
    // We log the error but don't want to block other webhooks
    return NextResponse.json(
      {
        received: true,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}

// Resend may send GET requests to verify endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Resend webhook endpoint is active',
  });
}
