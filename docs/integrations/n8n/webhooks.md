---
title: "Configuración de Webhook Receptor en N8N"
description: "Configurar n8n para **recibir** datos desde tu aplicación Vetify y procesar automatizaciones de What..."
category: "Integrations"
tags: ["whatsapp", "n8n", "vetify"]
order: 999
---

# Configuración de Webhook Receptor en N8N

## 🎯 Objetivo
Configurar n8n para **recibir** datos desde tu aplicación Vetify y procesar automatizaciones de WhatsApp.

## 📋 Pasos en N8N

### 1. Crear Nuevo Workflow

1. Ve a `https://n8n.alanis.dev`
2. Crea un nuevo workflow
3. Añade un nodo **Webhook**

### 2. Configurar el Nodo Webhook

**Configuración del Webhook:**
```
HTTP Method: POST
Path: webhook/pet-welcome
Response Mode: Respond to Webhook
Response Code: 200
Response Data: JSON
```

**URL resultante:**
```
https://n8n.alanis.dev/webhook/pet-welcome
```

### 3. Configurar Respuesta del Webhook

En el nodo Webhook, configura la respuesta:

```json
{
  "success": true,
  "message": "Pet welcome webhook received successfully",
  "executionId": "{{ $execution.id }}",
  "timestamp": "{{ $now }}"
}
```

### 4. Añadir Nodo de WhatsApp

Después del webhook, añade un nodo **HTTP Request** para WhatsApp:

**Configuración HTTP Request:**
```
Method: POST
URL: https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages
Headers:
  Authorization: Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}
  Content-Type: application/json
```

**Body (JSON):**
```json
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.ownerPhone }}",
  "type": "template",
  "template": {
    "name": "pet_welcome",
    "language": {
      "code": "es_MX"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "{{ $json.ownerName }}"
          },
          {
            "type": "text", 
            "text": "{{ $json.petName }}"
          },
          {
            "type": "text",
            "text": "{{ $json.clinicName }}"
          }
        ]
      }
    ]
  }
}
```

### 5. Variables de Entorno en N8N

Configura estas variables en n8n:

```
WHATSAPP_ACCESS_TOKEN=tu_token_de_whatsapp
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
```

## 🧪 Estructura de Datos Esperada

Tu aplicación enviará este payload:

```json
{
  "petName": "Firulais Test",
  "petSpecies": "Perro", 
  "ownerName": "Juan Pérez",
  "ownerPhone": "5214777314130",
  "clinicName": "Clínica Veterinaria Test",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "vetify-test-page"
}
```

## 🔄 Flujo Completo

1. **Vetify App** → Envía datos al webhook
2. **N8N Webhook** → Recibe y procesa datos
3. **N8N WhatsApp** → Envía mensaje de bienvenida
4. **N8N Response** → Confirma procesamiento exitoso

## ✅ Verificación

Una vez configurado:

1. Activa el workflow en n8n
2. Copia la URL del webhook: `https://n8n.alanis.dev/webhook/pet-welcome`
3. Prueba desde tu aplicación en `/test-whatsapp`
4. Verifica que llegue el mensaje de WhatsApp

## 🛠️ Troubleshooting

### Error "Failed to fetch"
- ✅ Verifica que n8n esté corriendo
- ✅ Confirma que el workflow esté activo
- ✅ Revisa la URL del webhook

### Webhook recibe pero no envía WhatsApp
- ✅ Verifica las variables de entorno en n8n
- ✅ Confirma que el token de WhatsApp sea válido
- ✅ Revisa que el template "pet_welcome" exista en WhatsApp Business

### Template no encontrado
- ✅ Crea el template en WhatsApp Business Manager
- ✅ O usa un mensaje de texto simple en lugar de template 

---

**Need help?** Check our [Troubleshooting Guide](../troubleshooting/common-issues.md) or [contact support](../../README.md#-support).