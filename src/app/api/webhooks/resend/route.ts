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

/**
 * Verify Resend webhook signature
 *
 * Resend uses HMAC-SHA256 to sign webhooks.
 * The signature is in the 'svix-signature' header.
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): boolean {
  if (!signature || !timestamp) {
    return false;
  }

  // Extract signatures from header (format: "v1,signature1 v1,signature2")
  const signatures = signature.split(' ').map((sig) => {
    const [, value] = sig.split(',');
    return value;
  });

  // Create the signed payload
  const signedPayload = `${timestamp}.${payload}`;

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');

  // Check if any signature matches
  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig, 'base64'),
        Buffer.from(expectedSignature, 'base64')
      );
    } catch {
      return false;
    }
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

    // Get the raw body as text for signature verification
    const payload = await request.text();

    // In production, always verify signature
    if (webhookSecret) {
      const signature = request.headers.get('svix-signature');
      const timestamp = request.headers.get('svix-timestamp');

      const isValid = verifyWebhookSignature(
        payload,
        signature,
        timestamp,
        webhookSecret
      );

      if (!isValid) {
        console.error('[RESEND_WEBHOOK] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }

      // Verify timestamp to prevent replay attacks (5 minute tolerance)
      if (timestamp) {
        const eventTime = parseInt(timestamp, 10) * 1000;
        const now = Date.now();
        const tolerance = 5 * 60 * 1000; // 5 minutes

        if (Math.abs(now - eventTime) > tolerance) {
          console.error('[RESEND_WEBHOOK] Timestamp too old');
          return NextResponse.json(
            { error: 'Timestamp too old' },
            { status: 401 }
          );
        }
      }
    } else {
      // Log warning in development if no secret configured
      console.warn(
        '[RESEND_WEBHOOK] RESEND_WEBHOOK_SECRET not configured - skipping signature verification'
      );
    }

    // Parse the event
    const event: ResendWebhookEvent = JSON.parse(payload);

    console.log('[RESEND_WEBHOOK] Received event:', {
      type: event.type,
      emailId: event.data.email_id,
      to: event.data.to,
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
