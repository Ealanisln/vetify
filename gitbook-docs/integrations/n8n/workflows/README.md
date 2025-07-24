# 📄 N8N Workflow Examples

## Workflow Collection

Esta sección contiene los workflows de N8N utilizados en Vetify para automatizar procesos de comunicación y seguimiento.

## 🔄 Available Workflows

### 1. Appointment Confirmation Workflow
**File**: `appointment-confirmation-workflow.json`

**Purpose**: Envía confirmación automática de citas vía WhatsApp

**Trigger**: Nueva cita creada
**Actions**:
- Extrae información de la cita
- Formatea mensaje de confirmación
- Envía mensaje WhatsApp al cliente
- Registra comunicación en base de datos

**Key Features**:
- Personalización del mensaje según tipo de cita
- Manejo de errores de envío
- Logging de todas las comunicaciones
- Soporte para recordatorios múltiples

### 2. Emergency Alert Workflow
**File**: `emergency-alert-workflow.json`

**Purpose**: Sistema de alertas para casos de emergencia

**Trigger**: Cita marcada como emergencia
**Actions**:
- Identifica personal disponible
- Envía alerta inmediata
- Escala notificación si no hay respuesta
- Actualiza estado en sistema

**Key Features**:
- Escalación automática de alertas
- Notificación multi-canal (WhatsApp, email)
- Tracking de respuestas del personal
- Dashboard de emergencias en tiempo real

### 3. Pet Welcome Workflow
**File**: `pet-welcome-workflow.json`

**Purpose**: Proceso de bienvenida para nuevas mascotas

**Trigger**: Nueva mascota registrada
**Actions**:
- Envía mensaje de bienvenida a propietario
- Programa recordatorios de vacunación
- Crea plan de seguimiento personalizado
- Asigna veterinario principal

**Key Features**:
- Onboarding personalizado por especie
- Calendario de vacunación automático
- Asignación inteligente de veterinario
- Seguimiento de progreso del onboarding

### 4. Vaccination Reminder Workflow
**File**: `vaccination-reminder-workflow.json`

**Purpose**: Recordatorios automáticos de vacunación

**Trigger**: Programación automática (cron job)
**Actions**:
- Identifica mascotas con vacunas pendientes
- Calcula fechas de recordatorio
- Envía notificación a propietarios
- Programa citas de seguimiento

**Key Features**:
- Múltiples recordatorios (30, 7, 1 día antes)
- Personalización por tipo de vacuna
- Integración con calendario de citas
- Tracking de cumplimiento de vacunación

## 🛠️ Workflow Configuration

### Basic Setup

```json
{
  "name": "Vetify Workflow",
  "nodes": [
    {
      "parameters": {
        "url": "https://vetify.pro/api/webhooks/n8n",
        "authentication": "headerAuth",
        "headerAuth": {
          "name": "Authorization",
          "value": "Bearer {{$env.VETIFY_API_TOKEN}}"
        }
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ]
}
```

### Environment Variables Required

```bash
# N8N Configuration
VETIFY_API_TOKEN="your-api-token"
WHATSAPP_API_URL="https://api.whatsapp.com"
WHATSAPP_ACCESS_TOKEN="your-whatsapp-token"

# Database Connection
DATABASE_URL="postgresql://..."
```

## 📋 Installation Guide

### 1. Import Workflows

```bash
# Download workflow files
curl -O https://vetify.pro/workflows/appointment-confirmation-workflow.json
curl -O https://vetify.pro/workflows/emergency-alert-workflow.json
curl -O https://vetify.pro/workflows/pet-welcome-workflow.json
curl -O https://vetify.pro/workflows/vaccination-reminder-workflow.json

# Import to N8N
n8n import:workflow --file=appointment-confirmation-workflow.json
```

### 2. Configure Webhooks

```typescript
// Vetify API endpoint for N8N webhooks
// /api/webhooks/n8n/[workflow-type]

export async function POST(
  request: Request,
  { params }: { params: { workflowType: string } }
) {
  const { workflowType } = params;
  const body = await request.json();
  
  switch (workflowType) {
    case 'appointment-confirmation':
      return handleAppointmentConfirmation(body);
    case 'emergency-alert':
      return handleEmergencyAlert(body);
    case 'pet-welcome':
      return handlePetWelcome(body);
    case 'vaccination-reminder':
      return handleVaccinationReminder(body);
    default:
      return Response.json(
        { error: 'Unknown workflow type' },
        { status: 400 }
      );
  }
}
```

### 3. Test Workflows

```bash
# Test appointment confirmation
curl -X POST https://vetify.pro/api/webhooks/n8n/appointment-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "appointmentId": "test-123",
    "petName": "Fluffy",
    "ownerPhone": "+1234567890",
    "appointmentDate": "2025-07-24T10:00:00Z"
  }'
```

## 🔧 Customization

### Adding Custom Workflows

1. **Create Workflow in N8N**
   - Design workflow visually
   - Configure triggers and actions
   - Test with sample data

2. **Export Configuration**
   ```bash
   n8n export:workflow --id=WORKFLOW_ID --output=custom-workflow.json
   ```

3. **Add to Vetify**
   - Create API endpoint handler
   - Update webhook routing
   - Add workflow documentation

### Workflow Templates

```json
{
  "name": "Custom Vetify Workflow",
  "active": true,
  "staticData": {},
  "nodes": [
    {
      "parameters": {
        "path": "custom-webhook",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300],
      "webhookId": "custom-webhook-id"
    },
    {
      "parameters": {
        "jsCode": "// Custom processing logic\nreturn $input.all();"
      },
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [440, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Process Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 📊 Monitoring & Analytics

### Workflow Metrics
- **Execution Count**: Total workflow runs
- **Success Rate**: Successful vs failed executions
- **Average Duration**: Execution time metrics
- **Error Patterns**: Common failure points

### Performance Optimization
- **Batch Processing**: Group similar operations
- **Caching**: Cache frequent database queries
- **Rate Limiting**: Respect API rate limits
- **Error Handling**: Graceful failure recovery

## 🔍 Troubleshooting

### Common Issues

1. **Webhook Not Triggering**
   ```bash
   # Check webhook URL accessibility
   curl -X POST https://your-n8n-instance.com/webhook/your-webhook-id
   ```

2. **Authentication Failures**
   ```bash
   # Verify API tokens
   echo $VETIFY_API_TOKEN
   echo $WHATSAPP_ACCESS_TOKEN
   ```

3. **Database Connection Issues**
   ```sql
   -- Test database connectivity
   SELECT NOW();
   ```

### Debug Mode
Enable verbose logging in N8N:

```bash
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console
```

---

**Need help?** Check our [N8N Integration Guide](../integration-guide.md) or [Troubleshooting](../../troubleshooting/README.md) section.
