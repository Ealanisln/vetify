import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'vetify_webhook_verify_2024';

// GET - Webhook verification (Facebook requirement)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 WhatsApp Webhook Verification:', { mode, token, challenge });

    // Verify the webhook
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp Webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error('❌ WhatsApp Webhook verification failed');
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }
  } catch (error) {
    console.error('❌ WhatsApp Webhook verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 WhatsApp Webhook received:', JSON.stringify(body, null, 2));

    // Process WhatsApp webhook data
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const messages = change.value?.messages || [];
            
            for (const message of messages) {
              console.log('📱 New WhatsApp message:', {
                from: message.from,
                type: message.type,
                text: message.text?.body,
                timestamp: message.timestamp
              });
              
              // Here you can add logic to process incoming messages
              // For example, auto-responses, saving to database, etc.
            }
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error) {
    console.error('❌ WhatsApp Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
} 