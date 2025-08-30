import { NextResponse } from 'next/server';
import { whatsappService } from '../../../../lib/whatsapp';

interface TokenGenerationResponse {
  success: boolean;
  message: string;
  tokenInfo?: {
    access_token: string;
    expires_in?: number;
    expires_in_days?: number;
    generated_at: string;
    token_type: string;
  };
  instructions?: string[];
  error?: string;
}

export async function POST(): Promise<NextResponse<TokenGenerationResponse>> {
  try {
    console.log('🔄 Generating long-lived WhatsApp token...');

    // Generate the long-lived token
    const tokenInfo = await whatsappService.generateLongLivedToken();

    const expiresInDays = tokenInfo.expires_in ? Math.floor(tokenInfo.expires_in / 86400) : undefined;

    return NextResponse.json<TokenGenerationResponse>({
      success: true,
      message: 'Long-lived token generated successfully',
      tokenInfo: {
        access_token: tokenInfo.access_token,
        expires_in: tokenInfo.expires_in,
        expires_in_days: expiresInDays,
        generated_at: tokenInfo.generated_at,
        token_type: tokenInfo.token_type
      },
      instructions: [
        '🔑 Your new long-lived token has been generated',
        '📋 Copy the access_token below',
        '⚙️ Update WHATSAPP_ACCESS_TOKEN in your .env.local file',
        '🔄 Restart your development server',
        `📅 This token will expire in ${expiresInDays || 'unknown'} days`,
        '🔔 Set up automatic renewal before expiration'
      ]
    });

  } catch (error) {
    console.error('❌ Error generating long-lived token:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    let instructions: string[] = [];
    
    if (errorMessage.includes('App ID') || errorMessage.includes('App Secret')) {
      instructions = [
        '⚙️ Check your environment variables:',
        '1. Ensure FACEBOOK_APP_ID is set in .env.local',
        '2. Ensure FACEBOOK_APP_SECRET is set in .env.local',
        '3. Restart your development server',
        '4. Get these values from developers.facebook.com'
      ];
    } else if (errorMessage.includes('exchange token')) {
      instructions = [
        '🔑 Token exchange failed:',
        '1. Ensure your current WHATSAPP_ACCESS_TOKEN is valid',
        '2. Check that the token belongs to the same app',
        '3. Verify App ID and App Secret are correct',
        '4. Try generating a fresh temporary token first'
      ];
    } else {
      instructions = [
        '🔍 General troubleshooting:',
        '1. Check your internet connection',
        '2. Verify all environment variables are set',
        '3. Ensure Facebook app permissions are correct',
        '4. Check the console for detailed error logs'
      ];
    }
    
    return NextResponse.json<TokenGenerationResponse>(
      {
        success: false,
        message: `Failed to generate long-lived token: ${errorMessage}`,
        error: errorMessage,
        instructions
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse<{ message: string; method: string }>> {
  return NextResponse.json({
    message: 'Use POST method to generate a new long-lived WhatsApp token',
    method: 'POST'
  });
} 