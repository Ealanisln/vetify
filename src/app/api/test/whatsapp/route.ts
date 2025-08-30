import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '../../../../lib/whatsapp';

interface WhatsAppTestRequest {
  phone: string;
  message: string;
}

interface WhatsAppErrorResponse {
  success: false;
  message: string;
  errorType: 'TOKEN_EXPIRED' | 'VALIDATION_ERROR' | 'API_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN';
  errorDetails?: Record<string, unknown>;
  suggestions?: string[];
}

interface WhatsAppSuccessResponse {
  success: true;
  message: string;
  phone: string;
  timestamp: string;
}

type WhatsAppResponse = WhatsAppSuccessResponse | WhatsAppErrorResponse;

export async function POST(request: NextRequest): Promise<NextResponse<WhatsAppResponse>> {
  try {
    const body: WhatsAppTestRequest = await request.json();
    
    if (!body.phone || !body.message) {
      return NextResponse.json<WhatsAppErrorResponse>(
        { 
          success: false, 
          message: 'Phone and message are required',
          errorType: 'VALIDATION_ERROR',
          suggestions: [
            'Provide a valid phone number in format: 5215512345678',
            'Include a message to send'
          ]
        },
        { status: 400 }
      );
    }

    console.log('🧪 Testing WhatsApp direct API:', { phone: body.phone });

    // Verificar token antes de enviar
    const tokenStatus = await whatsappService.verifyToken();
    if (!tokenStatus.valid) {
      return NextResponse.json<WhatsAppErrorResponse>(
        {
          success: false,
          message: `Token validation failed: ${tokenStatus.error}`,
          errorType: 'TOKEN_EXPIRED',
          suggestions: [
            'Go to Facebook Developers (developers.facebook.com)',
            'Select your WhatsApp Business app',
            'Navigate to WhatsApp > API Setup',
            'Generate a new temporary access token',
            'Update WHATSAPP_ACCESS_TOKEN in your .env.local file',
            'Restart your development server'
          ]
        },
        { status: 401 }
      );
    }

    // Send WhatsApp message directly
    const success = await whatsappService.sendTextMessage(body.phone, body.message);

    if (success) {
      return NextResponse.json<WhatsAppSuccessResponse>({
        success: true,
        message: 'WhatsApp message sent successfully',
        phone: body.phone,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json<WhatsAppErrorResponse>(
        { 
          success: false, 
          message: 'Failed to send WhatsApp message',
          errorType: 'API_ERROR',
          suggestions: [
            'Check if the phone number is registered with WhatsApp',
            'Verify the phone number format (52 + 10 digits for Mexico)',
            'Check WhatsApp API rate limits'
          ]
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ WhatsApp test API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Detectar tipo de error específico
    let errorType: WhatsAppErrorResponse['errorType'] = 'UNKNOWN';
    let suggestions: string[] = [];
    
    if (errorMessage.includes('Access token expired') || 
        errorMessage.includes('Session has expired') ||
        errorMessage.includes('token expired')) {
      errorType = 'TOKEN_EXPIRED';
      suggestions = [
        '🔑 Your WhatsApp access token has expired',
        '1. Go to developers.facebook.com',
        '2. Select your WhatsApp Business app',
        '3. Go to WhatsApp > API Setup',
        '4. Generate a new access token',
        '5. Update WHATSAPP_ACCESS_TOKEN in .env.local',
        '6. Restart your server with: npm run dev'
      ];
    } else if (errorMessage.includes('not configured')) {
      errorType = 'CONFIGURATION_ERROR';
      suggestions = [
        'Check your .env.local file',
        'Ensure WHATSAPP_ACCESS_TOKEN is set',
        'Ensure WHATSAPP_PHONE_NUMBER_ID is set',
        'Restart your development server'
      ];
    } else if (errorMessage.includes('Invalid parameter') || 
               errorMessage.includes('phone number')) {
      errorType = 'VALIDATION_ERROR';
      suggestions = [
        'Use Mexican phone format: 52 + 10 digits',
        'Example: 5215512345678',
        'Ensure the number is registered with WhatsApp'
      ];
    } else {
      errorType = 'API_ERROR';
      suggestions = [
        'Check your internet connection',
        'Verify WhatsApp Business API status',
        'Check the console for detailed error logs'
      ];
    }
    
    return NextResponse.json<WhatsAppErrorResponse>(
      { 
        success: false, 
        message: errorMessage,
        errorType,
        errorDetails: error instanceof Error ? { 
          name: error.name, 
          stack: error.stack?.split('\n').slice(0, 3) // Solo las primeras 3 líneas del stack
        } : { error },
        suggestions
      },
      { status: 500 }
    );
  }
} 