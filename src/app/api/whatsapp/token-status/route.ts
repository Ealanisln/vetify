import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { whatsappService } from '../../../../lib/whatsapp';

interface TokenStatusResponse {
  valid: boolean;
  error?: string;
  data?: Record<string, unknown>;
  tokenInfo?: {
    configured: boolean;
    expires_at?: string;
    expires_in_days?: number;
    app_id?: string;
  };
  autoRefresh?: {
    attempted: boolean;
    successful: boolean;
    error?: string;
  };
}

export async function GET(): Promise<NextResponse<TokenStatusResponse>> {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'WHATSAPP_ACCESS_TOKEN not configured in environment variables',
        tokenInfo: {
          configured: false
        }
      });
    }

    const tokenInfo = {
      configured: true
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
        configured: !!process.env.WHATSAPP_ACCESS_TOKEN
      }
    }, { status: 500 });
  }
}

export async function POST(): Promise<NextResponse<TokenStatusResponse>> {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    console.log('🔄 Checking token status with auto-refresh...');

    // Attempt auto-refresh
    const refreshResult = await whatsappService.autoRefreshToken();

    // Get current token status
    const detailedInfo = await whatsappService.getTokenInfo();

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const tokenInfo = {
      configured: !!token
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
        configured: !!process.env.WHATSAPP_ACCESS_TOKEN
      },
      autoRefresh: {
        attempted: true,
        successful: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
