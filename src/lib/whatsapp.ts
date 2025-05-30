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

export class WhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
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
   * Send text message via WhatsApp Business API
   */
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const payload: WhatsAppMessage = {
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API Error:', data);
        return false;
      }

      console.log('✅ WhatsApp message sent:', data.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.error('❌ WhatsApp send error:', error);
      return false;
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