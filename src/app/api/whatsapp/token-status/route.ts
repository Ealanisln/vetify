import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp';

interface TokenStatusResponse {
  valid: boolean;
  error?: string;
  data?: Record<string, unknown>;
  tokenInfo?: {
    configured: boolean;
    length: number;
    prefix: string;
    expires_at?: string;
    expires_in_days?: number;
    app_id?: string;
  };
  autoRefresh?: {
    attempted: boolean;
    successful: boolean;
    newToken?: string;
    error?: string;
  };
}

export async function GET(): Promise<NextResponse<TokenStatusResponse>> {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'WHATSAPP_ACCESS_TOKEN not configured in environment variables',
        tokenInfo: {
          configured: false,
          length: 0,
          prefix: ''
        }
      });
    }

    // Información del token (sin exponer el token completo)
    const tokenInfo = {
      configured: true,
      length: token.length,
      prefix: token.substring(0, 10) + '...'
    };

    console.log('🔍 Checking WhatsApp token status...');

    // Get detailed token information
    const detailedInfo = await whatsappService.getTokenInfo();

    if (detailedInfo.valid) {
      console.log('✅ WhatsApp token is valid');
      
      // Calculate days until expiration
      let expiresInDays: number | undefined;
      if (detailedInfo.expires_at) {
        const expiresAt = new Date(detailedInfo.expires_at);
        const now = new Date();
        expiresInDays = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return NextResponse.json({
        valid: true,
        data: {
          app_id: detailedInfo.app_id,
          checked_at: new Date().toISOString(),
          expires_at: detailedInfo.expires_at,
          expires_in_days: expiresInDays
        },
        tokenInfo: {
          ...tokenInfo,
          expires_at: detailedInfo.expires_at,
          expires_in_days: expiresInDays,
          app_id: detailedInfo.app_id
        }
      });
    } else {
      console.error('❌ WhatsApp token is invalid:', detailedInfo.error);
      
      return NextResponse.json({
        valid: false,
        error: detailedInfo.error || 'Token validation failed',
        tokenInfo
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error checking token status:', error);
    
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      tokenInfo: {
        configured: !!process.env.WHATSAPP_ACCESS_TOKEN,
        length: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
        prefix: process.env.WHATSAPP_ACCESS_TOKEN?.substring(0, 10) + '...' || ''
      }
    }, { status: 500 });
  }
}

export async function POST(): Promise<NextResponse<TokenStatusResponse>> {
  try {
    console.log('🔄 Checking token status with auto-refresh...');

    // Attempt auto-refresh
    const refreshResult = await whatsappService.autoRefreshToken();
    
    // Get current token status
    const detailedInfo = await whatsappService.getTokenInfo();
    
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const tokenInfo = {
      configured: !!token,
      length: token?.length || 0,
      prefix: token ? token.substring(0, 10) + '...' : ''
    };

    if (detailedInfo.valid) {
      let expiresInDays: number | undefined;
      if (detailedInfo.expires_at) {
        const expiresAt = new Date(detailedInfo.expires_at);
        const now = new Date();
        expiresInDays = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return NextResponse.json({
        valid: true,
        data: {
          app_id: detailedInfo.app_id,
          checked_at: new Date().toISOString(),
          expires_at: detailedInfo.expires_at,
          expires_in_days: expiresInDays
        },
        tokenInfo: {
          ...tokenInfo,
          expires_at: detailedInfo.expires_at,
          expires_in_days: expiresInDays,
          app_id: detailedInfo.app_id
        },
        autoRefresh: {
          attempted: true,
          successful: refreshResult.refreshed,
          newToken: refreshResult.refreshed ? 'Token was refreshed (check logs for new token)' : undefined,
          error: refreshResult.error
        }
      });
    } else {
      return NextResponse.json({
        valid: false,
        error: detailedInfo.error || 'Token validation failed',
        tokenInfo,
        autoRefresh: {
          attempted: true,
          successful: refreshResult.refreshed,
          error: refreshResult.error || detailedInfo.error
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in auto-refresh token check:', error);
    
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      tokenInfo: {
        configured: !!process.env.WHATSAPP_ACCESS_TOKEN,
        length: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
        prefix: process.env.WHATSAPP_ACCESS_TOKEN?.substring(0, 10) + '...' || ''
      },
      autoRefresh: {
        attempted: true,
        successful: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 