# N8N + WhatsApp Integration Setup 🚀

## 🎯 Overview

This integration enables automatic WhatsApp messages when pets are registered in Vetify. It's the **magic moment** that will differentiate Vetify in the Mexican market!

## 🔧 Environment Variables

Add these to your `.env.local` file:

```bash
# N8N Integration - The Magic! 🚀
N8N_WEBHOOK_URL=https://n8n.alanis.dev
N8N_API_KEY=your_n8n_api_key_if_needed

# WhatsApp Business API (Meta)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

# For N8N workflows to call back
VETIFY_API_URL=https://vetify.pro
```

## 📱 WhatsApp Business API Setup

1. **Create Meta Business Account**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Create a business account

2. **Set up WhatsApp Business API**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app
   - Add WhatsApp product
   - Get your Phone Number ID and Access Token

3. **Configure Webhook** (for receiving messages)
   - Webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Verify token: Set a secure token

## 🔄 N8N Workflow Configuration

### Workflow 1: Pet Welcome Message

**Webhook Path:** `pet-welcome`

**Nodes:**
1. **Webhook Trigger** (`/webhook/pet-welcome`)
2. **Data Processing** (format phone, add emojis)
3. **WhatsApp API Call**
4. **Success Logging**
5. **Response**

**Environment Variables in N8N:**
- `WHATSAPP_ACCESS_TOKEN`: Your WhatsApp access token
- `VETIFY_API_URL`: Your Vetify API URL

### Workflow 2: Vaccination Reminder

**Webhook Path:** `vaccination-reminder`

Similar structure but with vaccination-specific message template.

## 🎨 Message Templates

### Pet Welcome Message (Spanish)
```
🎉 ¡Bienvenido a [CLINIC_NAME]!

🐕 *[PET_NAME]* ya está registrado en nuestro sistema Vetify.

✅ Recibirás recordatorios automáticos de vacunas
✅ Historial médico digitalizado
✅ Comunicación directa con el veterinario

¿Alguna pregunta? Solo responde a este mensaje.

_Mensaje automático de Vetify CRM_
```

### Vaccination Reminder
```
💉 *Recordatorio de Vacunación*

🐾 *[PET_NAME]* necesita su vacuna:
📋 *Tipo:* [VACCINE_TYPE]
📅 *Fecha límite:* [DUE_DATE]

¿Quieres agendar una cita?
📞 Llámanos: [CLINIC_PHONE]
💬 O responde: "SÍ" para confirmar

¡Tu mascota te lo agradecerá! 🐕❤️

_[CLINIC_NAME] - Vetify CRM_
```

## 🚀 Testing the Integration

### Step-by-Step Demo:

1. **Go to:** `/dashboard/pets/new`
2. **Fill form** with:
   - Nombre: "Firulais" 
   - Especie: Perro
   - *(Make sure user has phone number)*
3. **Submit form**
4. **Watch:** Console logs for N8N trigger
5. **Check phone:** WhatsApp message should arrive!

### Demo Script:
```
"Vamos a registrar una mascota nueva..."
*Fill form*
"Miren esto - cuando le doy click a registrar..."
*Submit*
"Se registra la mascota Y... revisen su WhatsApp"
*WhatsApp arrives*
"¿Vieron eso? ¡COMPLETAMENTE AUTOMÁTICO!"
```

## 📊 Database Schema

The `AutomationLog` model tracks all automation executions:

```prisma
model AutomationLog {
  id           String   @id @default(uuid())
  tenantId     String
  workflowType String   // 'PET_WELCOME', 'VACCINATION_REMINDER', etc.
  triggeredBy  String   // User ID who triggered
  payload      Json     // Data sent to N8N
  status       String   // 'SUCCESS', 'FAILED', 'PENDING'
  executionId  String?  // N8N execution ID
  error        String?  // Error message if failed
  createdAt    DateTime @default(now())
  
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([workflowType])
  @@index([status])
}
```

## 🔍 Troubleshooting

### Common Issues:

1. **WhatsApp message not sending**
   - Check access token validity
   - Verify phone number format (Mexico: +52)
   - Check WhatsApp Business API limits

2. **N8N workflow not triggering**
   - Verify webhook URL is accessible
   - Check N8N workflow is active
   - Review console logs for errors

3. **Database errors**
   - Run `npx prisma db push` to apply schema changes
   - Run `npx prisma generate` to update client

### Debug Commands:

```bash
# Check N8N connectivity
curl -X POST https://n8n.alanis.dev/webhook/pet-welcome \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test WhatsApp API
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "521234567890", "type": "text", "text": {"body": "Test message"}}'
```

## 🎉 Success Metrics

After implementation, you should see:

✅ **Automatic WhatsApp messages** on pet registration  
✅ **Enhanced user experience** with real-time notifications  
✅ **Automation logging** for tracking and analytics  
✅ **Preview functionality** in the pet registration form  
✅ **Error handling** that doesn't break the main flow  

**The magic moment:** Register pet → Automatic WhatsApp = 🤯

This integration will be the differentiator that conquers the Mexican veterinary market! 🚀🇲🇽 