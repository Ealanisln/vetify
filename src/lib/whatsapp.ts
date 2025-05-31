export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'media';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Record<string, unknown>[];
  };
}

export interface WhatsAppError {
  code: number;
  message: string;
  type: string;
  fbtrace_id?: string;
}

export interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
  error?: WhatsAppError;
}

export interface TokenInfo {
  access_token: string;
  token_type: string;
  expires_in?: number;
  generated_at: string;
}

export class WhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private appId: string;
  private appSecret: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';
  private debugMode: boolean = false; // Add debug mode to disable auto-refresh

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.debugMode = process.env.WHATSAPP_DEBUG_MODE === 'true'; // Enable debug mode via env
    
    if (!this.phoneNumberId) {
      console.warn('⚠️ WHATSAPP_PHONE_NUMBER_ID not configured');
    }
    
    if (!this.accessToken) {
      console.warn('⚠️ WHATSAPP_ACCESS_TOKEN not configured');
    }

    if (!this.appId) {
      console.warn('⚠️ FACEBOOK_APP_ID not configured');
    }

    if (!this.appSecret) {
      console.warn('⚠️ FACEBOOK_APP_SECRET not configured');
    }

    if (this.debugMode) {
      console.log('🐛 WhatsApp Debug Mode: Auto-refresh disabled');
    }
  }

  /**
   * Generate a long-lived access token using App ID and App Secret
   */
  async generateLongLivedToken(): Promise<TokenInfo> {
    try {
      if (!this.appId || !this.appSecret) {
        throw new Error('Facebook App ID and App Secret are required for generating long-lived tokens');
      }

      console.log('🔄 Generating long-lived WhatsApp access token...');

      // Exchange the current user token for a long-lived one
      const longLivedResponse = await fetch(
        `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${this.accessToken}`
      );

      if (!longLivedResponse.ok) {
        const errorData = await longLivedResponse.json();
        throw new Error(`Failed to exchange token: ${errorData.error?.message || 'Unknown error'}`);
      }

      const longLivedData = await longLivedResponse.json();

      const tokenInfo: TokenInfo = {
        access_token: longLivedData.access_token,
        token_type: longLivedData.token_type || 'bearer',
        expires_in: longLivedData.expires_in, // Usually 60 days for long-lived tokens
        generated_at: new Date().toISOString()
      };

      console.log('✅ Long-lived token generated successfully');
      console.log(`📅 Token expires in: ${tokenInfo.expires_in ? Math.floor(tokenInfo.expires_in / 86400) : 'Unknown'} days`);

      return tokenInfo;

    } catch (error) {
      console.error('❌ Error generating long-lived token:', error);
      throw error;
    }
  }

  /**
   * Get token information including expiration
   */
  async getTokenInfo(): Promise<{ valid: boolean; expires_at?: string; app_id?: string; error?: string }> {
    try {
      if (!this.accessToken) {
        return { valid: false, error: 'Access token not configured' };
      }

      const response = await fetch(
        `${this.baseUrl}/me?fields=id,name&access_token=${this.accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        
        // Try to get token debug info
        try {
          const debugResponse = await fetch(
            `${this.baseUrl}/debug_token?input_token=${this.accessToken}&access_token=${this.accessToken}`
          );
          
          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            const tokenData = debugData.data;
            
            return {
              valid: true,
              expires_at: tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : undefined,
              app_id: tokenData.app_id || data.id
            };
          }
        } catch (debugError) {
          console.warn('Could not get token debug info:', debugError);
        }

        return { valid: true, app_id: data.id };
      } else {
        const errorData = await response.json();
        return { 
          valid: false, 
          error: errorData.error?.message || 'Token validation failed' 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Auto-refresh token if it's expired or about to expire
   */
  async autoRefreshToken(): Promise<{ refreshed: boolean; newToken?: string; error?: string }> {
    try {
      const tokenInfo = await this.getTokenInfo();
      
      if (!tokenInfo.valid) {
        console.log('🔄 Token is invalid, attempting to generate new long-lived token...');
        
        try {
          const newTokenInfo = await this.generateLongLivedToken();
          
          // Update the internal token
          this.accessToken = newTokenInfo.access_token;
          
          return {
            refreshed: true,
            newToken: newTokenInfo.access_token
          };
        } catch (error) {
          return {
            refreshed: false,
            error: error instanceof Error ? error.message : 'Failed to generate new token'
          };
        }
      }

      // Check if token expires soon (within 7 days)
      if (tokenInfo.expires_at) {
        const expiresAt = new Date(tokenInfo.expires_at);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 7) {
          console.log(`⚠️ Token expires in ${daysUntilExpiry} days, refreshing...`);
          
          try {
            const newTokenInfo = await this.generateLongLivedToken();
            this.accessToken = newTokenInfo.access_token;
            
            return {
              refreshed: true,
              newToken: newTokenInfo.access_token
            };
          } catch (error) {
            console.warn('Failed to refresh token proactively:', error);
          }
        }
      }

      return { refreshed: false };

    } catch (error) {
      return {
        refreshed: false,
        error: error instanceof Error ? error.message : 'Unknown error during auto-refresh'
      };
    }
  }

  /**
   * Format phone number for WhatsApp (remove special chars, add country code)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add Mexico country code if not present
    if (cleaned.length === 10) {
      cleaned = '52' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // Remove leading 1 for Mexico numbers
      cleaned = '52' + cleaned.substring(1);
    } else if (!cleaned.startsWith('52') && cleaned.length === 10) {
      cleaned = '52' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send text message via WhatsApp Business API with auto-refresh
   */
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      // Auto-refresh token if needed (skip in debug mode)
      if (!this.debugMode) {
        const refreshResult = await this.autoRefreshToken();
        if (refreshResult.refreshed) {
          console.log('🔄 Token was refreshed automatically');
        }
      } else {
        console.log('🐛 Debug mode: Skipping auto-refresh');
      }

      // Verificar configuración
      if (!this.accessToken) {
        throw new Error('WhatsApp access token not configured. Please set WHATSAPP_ACCESS_TOKEN in environment variables.');
      }
      
      if (!this.phoneNumberId) {
        throw new Error('WhatsApp phone number ID not configured. Please set WHATSAPP_PHONE_NUMBER_ID in environment variables.');
      }

      const formattedPhone = this.formatPhoneNumber(to);
      
      const payload: WhatsAppMessage = {
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      console.log(`📱 Sending WhatsApp to ${formattedPhone}...`);

      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data: WhatsAppApiResponse = await response.json();

      if (!response.ok) {
        console.error('❌ WhatsApp API Error:', data);
        
        // Manejar errores específicos
        if (data.error) {
          const error = data.error;
          
          if (error.code === 190) {
            // Try one more time with token refresh (only if not in debug mode)
            if (!this.debugMode) {
              console.log('🔄 Token expired, attempting emergency refresh...');
              const emergencyRefresh = await this.autoRefreshToken();
              
              if (emergencyRefresh.refreshed && emergencyRefresh.newToken) {
                console.log('🔄 Emergency refresh successful, retrying message...');
                return this.sendTextMessage(to, message); // Retry once
              }
            }
            
            throw new Error(`Access token expired or invalid: ${error.message}. Please generate a new token from Facebook Developers.`);
          } else if (error.code === 102) {
            throw new Error(`API session expired: ${error.message}. Please refresh your access token.`);
          } else if (error.code === 100) {
            throw new Error(`Invalid parameter: ${error.message}. Check your phone number format.`);
          } else if (error.code === 131056) {
            throw new Error(`Phone number not registered with WhatsApp: ${formattedPhone}`);
          } else {
            throw new Error(`WhatsApp API error (${error.code}): ${error.message}`);
          }
        }
        
        throw new Error(`WhatsApp API request failed with status ${response.status}`);
      }

      const messageId = data.messages?.[0]?.id;
      if (messageId) {
        console.log(`✅ WhatsApp message sent successfully: ${messageId}`);
        return true;
      } else {
        console.error('❌ No message ID returned from WhatsApp API');
        return false;
      }

    } catch (error) {
      console.error('❌ WhatsApp send error:', error);
      
      // Re-throw para que el caller pueda manejar el error específico
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Unknown error occurred while sending WhatsApp message');
    }
  }

  /**
   * Verify if the access token is valid
   */
  async verifyToken(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.accessToken) {
        return { valid: false, error: 'Access token not configured' };
      }

      const response = await fetch(
        `${this.baseUrl}/me?access_token=${this.accessToken}`
      );

      if (response.ok) {
        return { valid: true };
      } else {
        const errorData = await response.json();
        return { 
          valid: false, 
          error: errorData.error?.message || 'Token validation failed' 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate pet welcome message
   */
  generatePetWelcomeMessage(petName: string, petSpecies: string, clinicName: string): string {
    const speciesEmoji = petSpecies === 'dog' ? '🐕' : 
                        petSpecies === 'cat' ? '🐱' : 
                        petSpecies === 'bird' ? '🐦' : '🐾';
    
    return `🎉 ¡Bienvenido a ${clinicName}!

${speciesEmoji} *${petName}* ya está registrado en nuestro sistema Vetify.

✅ Recibirás recordatorios automáticos de vacunas
✅ Historial médico digitalizado
✅ Comunicación directa con el veterinario

¿Alguna pregunta? Solo responde a este mensaje.

_Mensaje automático de Vetify CRM_`;
  }

  /**
   * Generate vaccination reminder message
   */
  generateVaccinationReminder(
    petName: string, 
    vaccinationType: string, 
    dueDate: string,
    clinicName: string,
    clinicPhone: string
  ): string {
    return `💉 *Recordatorio de Vacunación*

🐾 *${petName}* necesita su vacuna:
📋 *Tipo:* ${vaccinationType}
📅 *Fecha límite:* ${dueDate}

¿Quieres agendar una cita?
📞 Llámanos: ${clinicPhone}
💬 O responde: "SÍ" para confirmar

¡Tu mascota te lo agradecerá! 🐕❤️

_${clinicName} - Vetify CRM_`;
  }
}

export const whatsappService = new WhatsAppService(); 