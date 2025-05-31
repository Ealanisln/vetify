import { NextRequest, NextResponse } from 'next/server';

interface PetWelcomeWebhookPayload {
  trigger?: string;
  data?: {
    petId?: string;
    petName?: string;
    ownerName?: string;
    ownerPhone?: string;
    clinicId?: string;
    automationType?: 'pet-welcome';
    [key: string]: unknown;
  };
  workflowId?: string;
  executionId?: string;
  timestamp?: string;
}

/**
 * Webhook endpoint for n8n pet welcome automation
 * Handles incoming webhooks when a new pet is registered
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming webhook payload
    const payload: PetWelcomeWebhookPayload = await request.json();
    
    console.log('🐾 Pet Welcome webhook received:', {
      trigger: payload.trigger,
      petId: payload.data?.petId,
      petName: payload.data?.petName,
      ownerName: payload.data?.ownerName,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!payload.data?.petId || !payload.data?.ownerPhone) {
      console.error('❌ Missing required fields in pet welcome webhook');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: petId and ownerPhone are required' 
        },
        { status: 400 }
      );
    }

    // Process the pet welcome automation
    await processPetWelcomeAutomation(payload);
    
    // Log successful processing
    console.log(`✅ Pet welcome automation processed successfully for pet: ${payload.data.petName} (ID: ${payload.data.petId})`);
    
    // Return success response to n8n
    return NextResponse.json({ 
      success: true,
      message: 'Pet welcome webhook processed successfully',
      petId: payload.data.petId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Pet welcome webhook processing error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error processing pet welcome webhook',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Process the pet welcome automation logic
 */
async function processPetWelcomeAutomation(payload: PetWelcomeWebhookPayload): Promise<void> {
  try {
    const { data } = payload;
    
    // Here you can add your business logic for pet welcome automation
    // Examples:
    // 1. Send welcome WhatsApp message
    // 2. Create follow-up reminders
    // 3. Update pet status in database
    // 4. Log automation execution
    
    console.log('🔄 Processing pet welcome automation:', {
      petId: data?.petId,
      petName: data?.petName,
      ownerName: data?.ownerName,
      ownerPhone: data?.ownerPhone,
      clinicId: data?.clinicId
    });
    
    // TODO: Implement your specific automation logic here
    // For example:
    // - await sendWelcomeWhatsAppMessage(data.ownerPhone, data.petName);
    // - await createFollowUpReminders(data.petId);
    // - await updatePetWelcomeStatus(data.petId);
    
  } catch (error) {
    console.error('❌ Error in pet welcome automation processing:', error);
    throw error;
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 