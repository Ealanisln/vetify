# N8N Webhook Setup - Solución Completa

## Problema Identificado

El error `POST /api/webhooks/n8n/webhook/pet-welcome 404 in 541ms` indica que el endpoint no existía en tu aplicación Next.js.

## Solución Implementada

### 1. Estructura de Archivos Creada

```
src/app/api/webhooks/n8n/
├── route.ts                           # Webhook genérico (ya existía)
└── webhook/
    └── pet-welcome/
        └── route.ts                   # Nuevo endpoint específico
```

### 2. Endpoint Específico para Pet Welcome

**Archivo:** `src/app/api/webhooks/n8n/webhook/pet-welcome/route.ts`

- ✅ Maneja requests POST desde n8n
- ✅ Validación de datos requeridos
- ✅ Logging detallado para debugging
- ✅ Manejo de errores robusto
- ✅ Respuestas JSON apropiadas
- ✅ Soporte para CORS

### 3. Configuración en N8N

Actualiza la URL del webhook en tu workflow de n8n:

```
Desarrollo: http://localhost:3000/api/webhooks/n8n/webhook/pet-welcome
Producción: https://tu-dominio.com/api/webhooks/n8n/webhook/pet-welcome
```

## Testing

### Opción 1: Script de Prueba Automatizado

```bash
# Asegúrate de que Next.js esté corriendo
npm run dev

# En otra terminal, ejecuta el test
node scripts/test-pet-welcome-webhook.cjs

# O para probar en producción
node scripts/test-pet-welcome-webhook.cjs https://tu-dominio.com/api/webhooks/n8n/webhook/pet-welcome
```

### Opción 2: Prueba Manual con cURL

```bash
curl -X POST http://localhost:3000/api/webhooks/n8n/webhook/pet-welcome \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "pet-registration",
    "data": {
      "petId": "pet_123456",
      "petName": "Luna",
      "ownerName": "María García",
      "ownerPhone": "+34612345678",
      "clinicId": "clinic_001",
      "automationType": "pet-welcome"
    },
    "workflowId": "workflow_pet_welcome_001",
    "executionId": "exec_123456789",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }'
```

### Respuesta Esperada

```json
{
  "success": true,
  "message": "Pet welcome webhook processed successfully",
  "petId": "pet_123456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Estructura de Datos

### Payload de Entrada

```typescript
interface PetWelcomeWebhookPayload {
  trigger?: string;
  data?: {
    petId?: string;           // Requerido
    petName?: string;
    ownerName?: string;
    ownerPhone?: string;      // Requerido
    clinicId?: string;
    automationType?: 'pet-welcome';
    [key: string]: unknown;
  };
  workflowId?: string;
  executionId?: string;
  timestamp?: string;
}
```

### Campos Requeridos

- `data.petId`: ID único de la mascota
- `data.ownerPhone`: Teléfono del propietario para WhatsApp

## Debugging

### 1. Verificar que el Servidor Esté Corriendo

```bash
# Iniciar Next.js en desarrollo
npm run dev

# Verificar que responda
curl http://localhost:3000/api/health
```

### 2. Logs del Servidor

Busca estos logs en tu consola de Next.js:

```
🐾 Pet Welcome webhook received: { trigger: "pet-registration", petId: "pet_123456", ... }
🔄 Processing pet welcome automation: { petId: "pet_123456", petName: "Luna", ... }
✅ Pet welcome automation processed successfully for pet: Luna (ID: pet_123456)
```

### 3. Logs de Error

Si hay errores, verás:

```
❌ Missing required fields in pet welcome webhook
❌ Pet welcome webhook processing error: [error details]
```

## Próximos Pasos

### 1. Implementar Lógica de Negocio

En la función `processPetWelcomeAutomation()`, añade:

```typescript
// Enviar mensaje de WhatsApp
await sendWelcomeWhatsAppMessage(data.ownerPhone, data.petName);

// Crear recordatorios de seguimiento
await createFollowUpReminders(data.petId);

// Actualizar estado en base de datos
await updatePetWelcomeStatus(data.petId);
```

### 2. Integración con Base de Datos

```typescript
import { prisma } from '@/lib/prisma';

// Registrar la ejecución de la automatización
await prisma.automationLog.create({
  data: {
    type: 'pet-welcome',
    petId: data.petId,
    status: 'completed',
    executionId: payload.executionId,
    metadata: payload
  }
});
```

### 3. Configurar Monitoreo

- Añadir métricas de éxito/error
- Configurar alertas para fallos
- Implementar retry logic si es necesario

## Troubleshooting Común

### Error 404 - Endpoint No Encontrado

- ✅ Verificar que el archivo `route.ts` esté en la ruta correcta
- ✅ Reiniciar el servidor Next.js
- ✅ Verificar la URL en n8n

### Error 500 - Error Interno

- ✅ Revisar logs del servidor
- ✅ Verificar que el payload tenga los campos requeridos
- ✅ Comprobar conexión a base de datos si aplica

### Error de CORS

- ✅ El endpoint ya incluye headers CORS
- ✅ Verificar que n8n esté enviando headers correctos

### N8N No Puede Conectar

- ✅ Verificar que el servidor esté accesible desde n8n
- ✅ Si usas localhost, asegúrate de que n8n esté en la misma red
- ✅ Para producción, verificar certificados SSL

## Configuración de Producción

### Variables de Entorno

```env
# .env.local
NODE_ENV=production
WEBHOOK_SECRET=tu-secreto-seguro  # Para validar webhooks
```

### Seguridad

```typescript
// Validar webhook signature si es necesario
const signature = request.headers.get('x-webhook-signature');
if (!validateWebhookSignature(payload, signature)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### Rate Limiting

Considera implementar rate limiting para proteger el endpoint:

```typescript
import { rateLimit } from '@/lib/rate-limit';

// En el handler
const rateLimitResult = await rateLimit(request);
if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
``` 