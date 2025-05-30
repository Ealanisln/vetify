interface N8NWorkflowPayload {
  [key: string]: string | number | boolean | Date | object | null | undefined;
}

interface N8NResponse {
  success: boolean;
  executionId?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export class N8NService {
  private baseUrl: string;
  private apiKey: string;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize during build time
    this.baseUrl = '';
    this.apiKey = '';
  }

  private initialize() {
    if (this.initialized) return;
    
    this.baseUrl = process.env.N8N_WEBHOOK_URL || '';
    this.apiKey = process.env.N8N_API_KEY || '';
    
    if (!this.baseUrl) {
      throw new Error('N8N_WEBHOOK_URL environment variable is required');
    }
    
    this.initialized = true;
  }

  /**
   * Trigger a workflow by webhook path
   */
  async triggerWorkflow(
    webhookPath: string, 
    payload: N8NWorkflowPayload
  ): Promise<N8NResponse> {
    try {
      this.initialize(); // Initialize only when actually used
      
      const url = `${this.baseUrl}/webhook/${webhookPath}`;
      
      console.log(`🚀 Triggering N8N workflow: ${webhookPath}`, payload);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`N8N workflow failed: ${response.status} - ${data.message || 'Unknown error'}`);
      }

      console.log(`✅ N8N workflow completed: ${webhookPath}`, data);

      return {
        success: true,
        executionId: data.executionId,
        data: data
      };
    } catch (error) {
      console.error(`❌ N8N workflow error: ${webhookPath}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown N8N error'
      };
    }
  }

  /**
   * Specific workflow triggers for Vetify
   */
  async sendPetWelcomeMessage(petData: {
    petName: string;
    petSpecies: string;
    ownerName: string;
    ownerPhone: string;
    clinicName: string;
  }): Promise<N8NResponse> {
    return this.triggerWorkflow('pet-welcome', {
      petName: petData.petName,
      petSpecies: petData.petSpecies,
      ownerName: petData.ownerName,
      ownerPhone: petData.ownerPhone,
      clinicName: petData.clinicName,
      timestamp: new Date().toISOString(),
      source: 'vetify-crm'
    });
  }

  async sendVaccinationReminder(reminderData: {
    petName: string;
    ownerName: string;
    ownerPhone: string;
    vaccinationType: string;
    dueDate: string;
    clinicName: string;
    clinicPhone: string;
  }): Promise<N8NResponse> {
    return this.triggerWorkflow('vaccination-reminder', {
      ...reminderData,
      timestamp: new Date().toISOString(),
      source: 'vetify-crm'
    });
  }

  async sendEmergencyAlert(emergencyData: {
    petName: string;
    ownerName: string;
    ownerPhone: string;
    emergencyType: string;
    clinicName: string;
    clinicAddress: string;
  }): Promise<N8NResponse> {
    return this.triggerWorkflow('emergency-alert', {
      ...emergencyData,
      timestamp: new Date().toISOString(),
      source: 'vetify-crm'
    });
  }
}

// Singleton instance
export const n8nService = new N8NService(); 