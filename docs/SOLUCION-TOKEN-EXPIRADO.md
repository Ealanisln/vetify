# 🔑 Solución: Token de WhatsApp Expirado

## 🚨 Problema Identificado

Tu access token de WhatsApp ha expirado. Este es un problema común con los tokens temporales de Facebook/Meta que duran 24 horas.

**Error típico:**
```
Access token expired or invalid: Session has expired on Friday, 30-May-25 09:00:00 PDT
```

## ⚡ Solución Rápida (5 minutos)

### 1. **Generar Nuevo Token**
1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta
3. Selecciona tu aplicación de WhatsApp Business
4. Ve a **WhatsApp** → **API Setup**
5. En la sección "Access Tokens", haz clic en **"Generate Access Token"**
6. Copia el nuevo token (empieza con `EAA...`)

### 2. **Actualizar Variables de Entorno**
Abre tu archivo `.env.local` y actualiza:
```bash
# Reemplaza con el nuevo token
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxx_NUEVO_TOKEN_AQUI
```

### 3. **Reiniciar Servidor**
```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia
npm run dev
```

### 4. **Verificar que Funciona**
1. Ve a `http://localhost:3000/test-whatsapp`
2. Haz clic en **"Verificar Token"**
3. Debería mostrar: ✅ Token de WhatsApp válido y funcionando

## 🔧 Herramientas de Diagnóstico

### Verificar Estado del Token
```bash
# Endpoint para verificar token
curl http://localhost:3000/api/whatsapp/token-status
```

### Página de Pruebas Mejorada
La página `/test-whatsapp` ahora incluye:
- ✅ **Botón "Verificar Token"** - Verifica si tu token está válido
- 🧪 **Pruebas de N8N** - Prueba todos los workflows
- 📱 **WhatsApp Directo** - Prueba directa sin N8N
- 📊 **Logs detallados** - Errores específicos con sugerencias

## 🛠️ Mejoras Implementadas

### 1. **Manejo de Errores Mejorado**
```typescript
// Ahora detecta automáticamente errores de token
if (error.code === 190) {
  throw new Error('Access token expired. Please generate a new token.');
}
```

### 2. **Verificación Automática**
```typescript
// Verifica token antes de enviar mensajes
const tokenStatus = await whatsappService.verifyToken();
if (!tokenStatus.valid) {
  // Muestra error específico con instrucciones
}
```

### 3. **Sugerencias Contextuales**
Los errores ahora incluyen pasos específicos para solucionarlos:
- 🔑 Token expirado → Instrucciones para renovar
- ⚙️ Configuración faltante → Variables de entorno
- 📱 Número inválido → Formato correcto
- 🌐 Error de API → Verificaciones de conectividad

## 📋 Checklist de Verificación

Después de actualizar el token, verifica:

- [ ] ✅ Token configurado en `.env.local`
- [ ] 🔄 Servidor reiniciado
- [ ] 🟢 "Verificar Token" muestra éxito
- [ ] 📱 "WhatsApp Directo" funciona
- [ ] 🔗 Workflows de N8N responden
- [ ] 📊 Mensajes llegan a WhatsApp

## 🚀 Solución Permanente (Recomendada)

Para evitar que el token expire cada 24 horas:

### 1. **Crear Token Permanente**
```typescript
// Función para generar token de larga duración
async function generateLongLivedToken() {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${APP_ID}/access_tokens`,
    {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
      }),
    }
  );
  
  const data = await response.json();
  return data.access_token; // Este token dura más tiempo
}
```

### 2. **Variables Adicionales**
```bash
# Agregar a .env.local para token permanente
FACEBOOK_APP_ID=tu_app_id
FACEBOOK_APP_SECRET=tu_app_secret
```

## 🎯 Próximos Pasos

1. **Inmediato:** Genera nuevo token temporal (5 min)
2. **Corto plazo:** Configura token permanente (30 min)
3. **Largo plazo:** Implementa renovación automática

## 📞 Soporte

Si sigues teniendo problemas:

1. **Verifica logs:** Revisa la consola del navegador y terminal
2. **Prueba endpoint:** `GET /api/whatsapp/token-status`
3. **Revisa configuración:** Asegúrate de que todas las variables estén configuradas
4. **Reinicia todo:** A veces un reinicio completo resuelve problemas de caché

## 🎉 ¡Listo!

Una vez que hayas seguido estos pasos, tu integración de WhatsApp debería funcionar perfectamente. La página de pruebas te ayudará a verificar que todo esté funcionando correctamente.

**Recuerda:** Los tokens temporales expiran cada 24 horas, así que considera implementar la solución permanente para evitar interrupciones. 