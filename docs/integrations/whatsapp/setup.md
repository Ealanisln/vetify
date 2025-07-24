---
title: "🚀 Guía Completa: Configuración N8N + WhatsApp para Vetify"
description: "Esta guía te llevará paso a paso para configurar la integración completa de N8N + WhatsApp en Vetify..."
category: "Integrations"
tags: ["postgresql", "whatsapp", "n8n", "vetify"]
order: 999
---

# 🚀 Guía Completa: Configuración N8N + WhatsApp para Vetify

## 📋 Resumen

Esta guía te llevará paso a paso para configurar la integración completa de N8N + WhatsApp en Vetify. Al final, tendrás mensajes automáticos de WhatsApp funcionando cuando se registren mascotas.

## 🎯 Lo que vas a lograr

✅ **Mensajes automáticos** cuando se registre una mascota  
✅ **Recordatorios de vacunación** programados  
✅ **Confirmaciones de citas** automáticas  
✅ **Alertas de emergencia** instantáneas  
✅ **Página de pruebas** para validar todo funciona  

## 📱 Paso 1: Configurar WhatsApp Business API

### 1.1 Crear cuenta Meta Business
1. Ve a [business.facebook.com](https://business.facebook.com)
2. Crea una cuenta de negocio
3. Verifica tu negocio

### 1.2 Configurar WhatsApp Business API
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una nueva aplicación
3. Agrega el producto "WhatsApp"
4. En la configuración de WhatsApp:
   - Obtén tu **Phone Number ID**
   - Genera un **Access Token** permanente
   - Configura el webhook (opcional por ahora)

### 1.3 Obtener credenciales
Necesitas estos datos:
```
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxx
```

## 🔧 Paso 2: Configurar N8N

### 2.1 Acceder a N8N
- URL: `https://n8n.alanis.dev`
- Credenciales: (solicitar acceso)

### 2.2 Importar workflows
1. En N8N, ve a **Workflows** → **Import**
2. Importa estos archivos:
   - `docs/n8n-workflows/pet-welcome-workflow.json`
   - `docs/n8n-workflows/vaccination-reminder-workflow.json`

### 2.3 Configurar variables de entorno en N8N
En N8N, ve a **Settings** → **Environment Variables** y agrega:

```bash
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token
VETIFY_API_URL=https://vetify.pro
```

### 2.4 Activar workflows
1. Ve a cada workflow importado
2. Haz clic en **Active** para activarlo
3. Verifica que el webhook esté disponible

## 🌐 Paso 3: Configurar Variables de Entorno en Vetify

Crea o actualiza tu archivo `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vetify"
DIRECT_URL="postgresql://username:password@localhost:5432/vetify"

# Kinde Auth
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard

# N8N Integration - The Magic! 🚀
N8N_WEBHOOK_URL=https://n8n.alanis.dev
N8N_API_KEY=your_n8n_api_key_if_needed
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.alanis.dev

# WhatsApp Business API (Meta)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

# For N8N workflows to call back
VETIFY_API_URL=https://vetify.pro
```

## 🗄️ Paso 4: Actualizar Base de Datos

```bash
# Aplicar cambios de schema
npx prisma db push

# Generar cliente
npx prisma generate

# Reiniciar servidor de desarrollo
npm run dev
```

## 🧪 Paso 5: Probar la Integración

### 5.1 Usar la página de pruebas
1. Ve a `http://localhost:3000/test-whatsapp`
2. Ingresa tu número de teléfono (formato: 5215512345678)
3. Prueba cada escenario:
   - **Bienvenida de Mascota**
   - **Recordatorio de Vacuna**
   - **Confirmación de Cita**
   - **Alerta de Emergencia**
   - **WhatsApp Directo**

### 5.2 Probar el flujo completo
1. Ve a `/dashboard/pets/new`
2. Registra una mascota nueva
3. Asegúrate de que el cliente tenga teléfono
4. ¡Revisa tu WhatsApp!

### 5.3 Usar el script de pruebas
```bash
# Instalar dependencias
npm install node-fetch

# Ejecutar pruebas
TEST_PHONE=5215512345678 node scripts/test-n8n-integration.js
```

## 📊 Workflows Disponibles

### 1. Pet Welcome (`/webhook/pet-welcome`)
**Trigger:** Registro de nueva mascota  
**Mensaje:** Bienvenida personalizada con emojis  
**Datos requeridos:**
```json
{
  "petName": "Firulais",
  "petSpecies": "Perro",
  "ownerName": "Juan Pérez",
  "ownerPhone": "5215512345678",
  "clinicName": "Clínica Veterinaria Test"
}
```

### 2. Vaccination Reminder (`/webhook/vaccination-reminder`)
**Trigger:** Recordatorio programado  
**Mensaje:** Recordatorio de vacuna con fecha  
**Datos requeridos:**
```json
{
  "petName": "Firulais",
  "ownerName": "Juan Pérez",
  "ownerPhone": "5215512345678",
  "vaccinationType": "Rabia",
  "dueDate": "2024-02-15",
  "clinicName": "Clínica Veterinaria Test",
  "clinicPhone": "55-1234-5678"
}
```

### 3. Appointment Confirmation (`/webhook/appointment-confirmation`)
**Trigger:** Confirmación de cita  
**Mensaje:** Detalles de cita agendada  
**Datos requeridos:**
```json
{
  "petName": "Firulais",
  "ownerName": "Juan Pérez",
  "ownerPhone": "5215512345678",
  "appointmentDate": "2024-02-10",
  "appointmentTime": "10:00 AM",
  "veterinarian": "Dr. García",
  "clinicName": "Clínica Veterinaria Test",
  "clinicAddress": "Av. Reforma 123, CDMX"
}
```

### 4. Emergency Alert (`/webhook/emergency-alert`)
**Trigger:** Alerta de emergencia  
**Mensaje:** Notificación urgente  
**Datos requeridos:**
```json
{
  "petName": "Firulais",
  "ownerName": "Juan Pérez",
  "ownerPhone": "5215512345678",
  "emergencyType": "Urgencia Médica",
  "veterinarian": "Dr. García",
  "clinicName": "Clínica Veterinaria Test",
  "clinicPhone": "55-1234-5678",
  "instructions": "Traer inmediatamente a la clínica"
}
```

## 🔍 Troubleshooting

### Problema: "N8N no responde"
**Solución:**
1. Verifica que N8N esté corriendo en `https://n8n.alanis.dev`
2. Confirma que los workflows estén **activos**
3. Revisa las variables de entorno en N8N

### Problema: "WhatsApp no se envía"
**Solución:**
1. Verifica `WHATSAPP_ACCESS_TOKEN` válido
2. Confirma `WHATSAPP_PHONE_NUMBER_ID` correcto
3. Revisa formato de teléfono (52 + 10 dígitos)
4. Verifica límites de la API de WhatsApp

### Problema: "Error de base de datos"
**Solución:**
```bash
npx prisma db push
npx prisma generate
```

### Problema: "Webhook no se ejecuta"
**Solución:**
1. Verifica URL del webhook en N8N
2. Confirma que el workflow esté activo
3. Revisa logs en N8N para errores

## 🎬 Demo Script para Presentaciones

```
"Vamos a ver la magia de Vetify en acción..."

1. "Primero, voy a registrar una mascota nueva"
   → Ir a /dashboard/pets/new

2. "Lleno los datos básicos..."
   → Nombre: "Firulais"
   → Especie: Perro
   → Cliente con teléfono

3. "Aquí pueden ver el preview del mensaje que se va a enviar"
   → Mostrar preview

4. "Y ahora... ¡el momento mágico!"
   → Clic en "Registrar Mascota"

5. "¡Revisen sus WhatsApp!"
   → Mostrar el mensaje que llegó

6. "¿Vieron eso? ¡COMPLETAMENTE AUTOMÁTICO!"
   → Explicar el flujo N8N → WhatsApp

"Esto es lo que va a diferenciar a Vetify en el mercado mexicano"
```

## 🎯 Métricas de Éxito

Después de la implementación, deberías ver:

✅ **100% de mensajes** enviados automáticamente  
✅ **< 5 segundos** de latencia en envío  
✅ **0 errores** en el flujo principal  
✅ **Logs completos** de todas las automaciones  
✅ **Feedback positivo** de usuarios en demos  

## 🚀 Próximos Pasos

1. **Agregar más workflows:**
   - Recordatorios de citas
   - Seguimiento post-consulta
   - Promociones y ofertas

2. **Mejorar mensajes:**
   - Templates más personalizados
   - Imágenes y multimedia
   - Botones interactivos

3. **Analytics:**
   - Dashboard de automaciones
   - Métricas de engagement
   - ROI de WhatsApp

## 🎉 ¡Listo!

Con esta configuración, Vetify tendrá una integración completa de WhatsApp que impresionará a cualquier veterinario mexicano. 

**El momento mágico:** Registrar mascota → WhatsApp automático = 🤯

¡Esto va a conquistar el mercado! 🚀🇲🇽 

---

**Need help?** Check our [Troubleshooting Guide](../troubleshooting/common-issues.md) or [contact support](../../README.md#-support).