# 🔑 Tokens Permanentes de WhatsApp - Implementación Completa

## 🎯 Objetivo

Implementar un sistema de tokens de larga duración (60 días) para WhatsApp Business API que se renueven automáticamente, eliminando la necesidad de renovar tokens cada 24 horas.

## ✅ ¿Qué se Implementó?

### 1. **Servicio de WhatsApp Mejorado** (`src/lib/whatsapp.ts`)

#### Nuevas Funcionalidades:
- **`generateLongLivedToken()`**: Genera tokens de 60 días usando App ID y App Secret
- **`getTokenInfo()`**: Obtiene información detallada del token incluyendo fecha de expiración
- **`autoRefreshToken()`**: Renovación automática cuando el token está próximo a expirar (7 días)
- **Auto-renovación en `sendTextMessage()`**: Verifica y renueva automáticamente antes de enviar

#### Configuración Requerida:
```bash
# .env.local
WHATSAPP_ACCESS_TOKEN=EAAxxxxx... # Token actual
WHATSAPP_PHONE_NUMBER_ID=123456789
FACEBOOK_APP_ID=tu_app_id
FACEBOOK_APP_SECRET=tu_app_secret
```

### 2. **Endpoints API Nuevos**

#### `POST /api/whatsapp/generate-token`
Genera un nuevo token de larga duración (60 días).

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Long-lived token generated successfully",
  "tokenInfo": {
    "access_token": "EAAxxxxx...",
    "expires_in": 5184000,
    "expires_in_days": 60,
    "generated_at": "2024-01-15T10:30:00.000Z",
    "token_type": "bearer"
  },
  "instructions": [
    "🔑 Your new long-lived token has been generated",
    "📋 Copy the access_token below",
    "⚙️ Update WHATSAPP_ACCESS_TOKEN in your .env.local file",
    "🔄 Restart your development server",
    "📅 This token will expire in 60 days"
  ]
}
```

#### `GET /api/whatsapp/token-status` (Mejorado)
Verifica el estado del token con información de expiración.

#### `POST /api/whatsapp/token-status` (Nuevo)
Verifica el token con intento de auto-renovación.

### 3. **Página de Pruebas Mejorada** (`/test-whatsapp`)

#### Nuevos Botones:
- **🔍 Verificar Token**: Revisa estado y fecha de expiración
- **🔄 Auto-Renovar**: Intenta renovación automática
- **📅 Token Permanente**: Genera token de 60 días
- **📱 Enviar WhatsApp**: Prueba directa de mensajes

#### Características:
- Información detallada de expiración
- Logs en consola para copiar tokens
- Instrucciones paso a paso
- Manejo de errores específicos

## 🚀 Cómo Usar

### Paso 1: Configurar Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```bash
# WhatsApp API
WHATSAPP_ACCESS_TOKEN=EAAxxxxx... # Tu token actual (temporal o permanente)
WHATSAPP_PHONE_NUMBER_ID=123456789

# Facebook App (para tokens permanentes)
FACEBOOK_APP_ID=tu_app_id
FACEBOOK_APP_SECRET=tu_app_secret
```

### Paso 2: Generar Token Permanente

1. Ve a `http://localhost:3000/test-whatsapp`
2. Haz clic en **"Token Permanente"**
3. Copia el nuevo token de la consola del navegador
4. Actualiza `WHATSAPP_ACCESS_TOKEN` en `.env.local`
5. Reinicia el servidor

### Paso 3: Verificar Funcionamiento

1. Haz clic en **"Verificar Token"**
2. Deberías ver: `✅ Token válido (expira en 60 días)`
3. Prueba enviar un mensaje con **"Enviar WhatsApp"**

## 🔄 Auto-Renovación Automática

### ¿Cuándo se Renueva?

El sistema renueva automáticamente el token en estos casos:

1. **Antes de cada envío**: Verifica si el token está próximo a expirar (7 días)
2. **En caso de error 190**: Si el token expira inesperadamente
3. **Manualmente**: Usando el botón "Auto-Renovar"

### Flujo de Auto-Renovación:

```typescript
// 1. Verificar estado del token
const tokenInfo = await getTokenInfo();

// 2. Si expira en 7 días o menos, renovar
if (daysUntilExpiry <= 7) {
  const newToken = await generateLongLivedToken();
  this.accessToken = newToken.access_token;
}

// 3. En caso de error 190, renovación de emergencia
if (error.code === 190) {
  const emergencyRefresh = await autoRefreshToken();
  if (emergencyRefresh.refreshed) {
    return this.sendTextMessage(to, message); // Reintentar
  }
}
```

## 🛠️ Solución de Problemas

### Error: "Facebook App ID and App Secret are required"

**Solución:**
1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Selecciona tu app de WhatsApp Business
3. Ve a **Configuración** → **Básica**
4. Copia el **ID de la app** y **Clave secreta de la app**
5. Agrégalos a tu `.env.local`

### Error: "Failed to exchange token"

**Posibles causas:**
- Token actual inválido o expirado
- App ID/Secret incorrectos
- Token no pertenece a la misma app

**Solución:**
1. Genera un token temporal nuevo en Facebook Developers
2. Actualiza `WHATSAPP_ACCESS_TOKEN`
3. Luego usa ese token para generar uno permanente

### Error: "Token validation failed"

**Solución:**
1. Verifica que todas las variables de entorno estén configuradas
2. Reinicia el servidor
3. Usa "Verificar Token" para diagnóstico
4. Si persiste, genera un nuevo token temporal

## 📊 Monitoreo y Logs

### Logs Importantes:

```bash
# Token válido
✅ WhatsApp token is valid
📅 Token expires in: 45 days

# Auto-renovación
🔄 Token expires in 5 days, refreshing...
✅ Long-lived token generated successfully

# Renovación de emergencia
🔄 Token expired, attempting emergency refresh...
🔄 Emergency refresh successful, retrying message...
```

### Verificación Manual:

```bash
# Verificar estado del token
curl http://localhost:3000/api/whatsapp/token-status

# Forzar auto-renovación
curl -X POST http://localhost:3000/api/whatsapp/token-status

# Generar nuevo token permanente
curl -X POST http://localhost:3000/api/whatsapp/generate-token
```

## 🎯 Beneficios de la Implementación

### ✅ Antes vs Después

| Aspecto | Antes (Token Temporal) | Después (Token Permanente) |
|---------|----------------------|---------------------------|
| **Duración** | 24 horas | 60 días |
| **Renovación** | Manual cada día | Automática |
| **Interrupciones** | Diarias | Cada 2 meses |
| **Mantenimiento** | Alto | Mínimo |
| **Confiabilidad** | Baja | Alta |

### 🚀 Características Avanzadas

- **Renovación Proactiva**: Se renueva 7 días antes de expirar
- **Renovación de Emergencia**: Si falla inesperadamente, intenta renovar automáticamente
- **Logs Detallados**: Información completa para debugging
- **Interfaz de Gestión**: Página web para gestionar tokens fácilmente
- **Manejo de Errores**: Errores específicos con sugerencias de solución

## 🔮 Próximos Pasos (Opcional)

### 1. Renovación Programada (Cron Job)
```typescript
// Ejecutar cada día para verificar tokens
export async function checkAndRefreshTokens() {
  const result = await whatsappService.autoRefreshToken();
  if (result.refreshed) {
    console.log('Token renovado automáticamente');
    // Actualizar base de datos o notificar
  }
}
```

### 2. Notificaciones de Expiración
```typescript
// Notificar cuando el token esté próximo a expirar
if (daysUntilExpiry <= 3) {
  await sendSlackNotification('Token de WhatsApp expira en 3 días');
}
```

### 3. Múltiples Tokens (Multi-tenant)
```typescript
// Gestionar tokens para múltiples clínicas
class MultiTenantWhatsAppService {
  private tokens: Map<string, TokenInfo> = new Map();
  
  async getTokenForClinic(clinicId: string): Promise<string> {
    // Lógica para gestionar múltiples tokens
  }
}
```

## 🎉 ¡Implementación Completa!

Tu sistema de WhatsApp ahora tiene:

- ✅ **Tokens de 60 días** en lugar de 24 horas
- ✅ **Renovación automática** sin intervención manual
- ✅ **Manejo robusto de errores** con recuperación automática
- ✅ **Interfaz de gestión** fácil de usar
- ✅ **Logs detallados** para monitoreo
- ✅ **Documentación completa** para mantenimiento

**¡Ya no tendrás que preocuparte por tokens expirados cada día!** 🎊 