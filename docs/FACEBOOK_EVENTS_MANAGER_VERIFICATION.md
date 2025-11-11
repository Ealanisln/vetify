# Facebook Events Manager - Guía de Verificación Manual

Esta guía te ayudará a verificar que el Meta Pixel está funcionando correctamente en producción usando Facebook Events Manager.

## Información del Pixel

- **Pixel ID**: `1390664119337892`
- **URL de Producción**: `https://www.vetify.pro` o `https://vetify.pro`
- **Implementación**: Browser Pixel (JavaScript)

## 1. Acceder a Facebook Events Manager

1. Navega a [Facebook Events Manager](https://business.facebook.com/events_manager2/)
2. Selecciona tu cuenta de anuncios
3. En el menú lateral, selecciona **Data Sources** → **Pixels**
4. Haz clic en el Pixel ID `1390664119337892`

## 2. Verificar Test Events (Modo de Prueba)

### Configurar Test Events

1. En el Pixel, ve a la pestaña **Test Events**
2. Haz clic en **Open Test Events**
3. Se abrirá una nueva ventana con un código de test

### Probar con el Navegador

1. **Opción 1 - Test Events Tool**:
   - En Test Events, haz clic en **Test browser events**
   - Se generará un código de test único
   - Copia el código (ejemplo: `TEST12345`)

2. **Opción 2 - Chrome Developer Tools**:
   - Abre las Chrome DevTools (F12)
   - Ve a Console
   - Ejecuta: `fbq('set', 'autoConfig', false, 'YOUR_PIXEL_ID');`

### Eventos a Probar

#### A. PageView (Vista de Página)

**Acción**: Navega a cualquier página del sitio
- `https://www.vetify.pro`
- `https://www.vetify.pro/precios`
- `https://www.vetify.pro/login`

**Verificación**:
- En Test Events, deberías ver un evento `PageView`
- Revisa que el `event_source_url` sea correcto (no contenga "development")

#### B. ViewContent (Ver Contenido)

**Acción**: Navega a la página de precios
- URL: `https://www.vetify.pro/precios`

**Verificación**:
- Deberías ver un evento `ViewContent`
- Parámetros esperados:
  ```json
  {
    "content_name": "pricing_page",
    "content_category": "pricing",
    "currency": "MXN"
  }
  ```

#### C. CompleteRegistration (Registro Completo)

**Acción**: Completa el proceso de onboarding
1. Registra una nueva cuenta en `/api/auth/register`
2. Completa el flujo de onboarding
3. Llega al dashboard

**Verificación**:
- Deberías ver un evento `CompleteRegistration`
- Parámetros esperados:
  ```json
  {
    "plan_name": "Básico", // o el plan seleccionado
    "plan_key": "basico",
    "billing_interval": "monthly",
    "is_trial": true,
    "currency": "MXN",
    "value": 599, // precio del plan
    "status": "completed"
  }
  ```
- **IMPORTANTE**: NO debe contener email, nombre, teléfono u otra PII

#### D. StartTrial (Inicio de Prueba)

**Acción**: Se dispara automáticamente al completar onboarding
- Este evento se envía junto con `CompleteRegistration`

**Verificación**:
- Deberías ver un evento `StartTrial`
- Parámetros esperados:
  ```json
  {
    "plan_name": "Básico",
    "plan_key": "basico",
    "trial_end_date": "2025-XX-XX", // 14 días desde registro
    "currency": "MXN",
    "value": 599,
    "trial_duration_days": 14
  }
  ```

## 3. Verificar en Overview (Datos Reales)

### Actividad en Tiempo Real

1. Ve a la pestaña **Overview** del Pixel
2. Revisa la sección **Activity** (últimas 24 horas)
3. Deberías ver:
   - Número de eventos `PageView`
   - Número de eventos `ViewContent`
   - Número de eventos `CompleteRegistration`
   - Número de eventos `StartTrial`

### Top Events

1. Revisa la sección **Top Events**
2. Verifica que los eventos más frecuentes sean:
   - `PageView` (mayor volumen)
   - `ViewContent` (cuando visitan /precios)
   - `CompleteRegistration` (nuevos registros)
   - `StartTrial` (nuevos registros)

## 4. Verificar Match Quality (Calidad de Coincidencia)

### Event Match Quality

1. Ve a **Settings** → **Event Match Quality**
2. Deberías ver:
   - **Event Match Quality Score**: Idealmente 7.0+
   - **Events Matched**: Porcentaje de eventos con datos de usuario
   - **Customer Information Parameters**: Parámetros disponibles

### Parámetros Esperados

El Pixel **NO** debe enviar:
- ❌ Email
- ❌ Nombre completo
- ❌ Teléfono
- ❌ Dirección
- ❌ Información médica

El Pixel **SÍ** puede enviar (anónimo):
- ✅ URL de la página
- ✅ Tipo de plan seleccionado
- ✅ Moneda (MXN)
- ✅ Valor de conversión
- ✅ Navegador/dispositivo (automático)
- ✅ IP (automático, hasheado por Facebook)

## 5. Verificar Integraciones

### Conversions API (Future)

Si en el futuro implementamos Conversions API:
1. Ve a **Settings** → **Conversions API**
2. Verifica que muestre:
   - ✅ API events received
   - ✅ Deduplication working (si aplica)

Actualmente: **No implementado** (solo Browser Pixel)

## 6. Debug en el Navegador

### Facebook Pixel Helper (Chrome Extension)

1. Instala [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Navega a `https://www.vetify.pro`
3. Haz clic en el icono del Pixel Helper
4. Deberías ver:
   - ✅ Pixel `1390664119337892` detectado
   - ✅ Eventos disparándose correctamente
   - ⚠️ Advertencias sobre parámetros faltantes (normal si no enviamos datos de usuario)

### Chrome DevTools Console

1. Abre Chrome DevTools (F12)
2. Ve a la pestaña **Console**
3. En desarrollo, deberías ver logs:
   ```
   [Meta Pixel] Event: PageView
   [Meta Pixel] Event: ViewContent { "content_name": "pricing_page", ... }
   ```
4. En producción, no verás logs (están deshabilitados)

### Chrome DevTools Network

1. Abre Chrome DevTools (F12)
2. Ve a la pestaña **Network**
3. Filtra por "facebook"
4. Navega por el sitio
5. Deberías ver llamadas a:
   - `connect.facebook.net/en_US/fbevents.js` (carga del script)
   - `www.facebook.com/tr/?id=1390664119337892&ev=PageView` (eventos)

## 7. Checklist de Verificación

### ✅ Verificaciones Técnicas

- [ ] Pixel ID correcto (`1390664119337892`) en código fuente
- [ ] Script cargando desde `connect.facebook.net`
- [ ] CSP headers permiten Facebook
- [ ] No hay errores de JavaScript en console
- [ ] Meta tags og:url apuntan a producción

### ✅ Verificaciones de Eventos

- [ ] `PageView` se dispara en todas las páginas
- [ ] `ViewContent` se dispara en `/precios`
- [ ] `CompleteRegistration` se dispara al completar onboarding
- [ ] `StartTrial` se dispara al completar onboarding
- [ ] Eventos aparecen en Test Events
- [ ] Eventos aparecen en Overview (datos reales)

### ✅ Verificaciones de Privacidad

- [ ] No se envía email en parámetros
- [ ] No se envía nombre completo
- [ ] No se envía teléfono
- [ ] No se envía información médica
- [ ] Solo se envían datos de plan/producto

## 8. Problemas Comunes

### Problema: No se ven eventos en Test Events

**Posibles causas**:
- Código de test no configurado
- AdBlocker bloqueando Facebook
- VPN/Privacy browser bloqueando tracking
- CORS/CSP bloqueando requests

**Solución**:
1. Verifica en Network que las llamadas a `facebook.com/tr/` se completen
2. Desactiva AdBlocker temporalmente
3. Prueba en modo incógnito
4. Verifica CSP headers

### Problema: Eventos se ven en Test Events pero no en Overview

**Causa**: Es normal
- Test Events son inmediatos
- Overview puede tomar 15-30 minutos en actualizar

**Solución**: Espera 30 minutos y refresca

### Problema: Match Quality Score bajo

**Causa**: No estamos enviando parámetros de usuario (intencional por privacidad)

**Solución**:
- Esto es esperado y correcto para GDPR/HIPAA
- Para mejorar, necesitaríamos implementar Conversions API (server-side)
- Por ahora, prioriza la privacidad sobre el match quality

### Problema: "Functions cannot be passed to Client Components"

**Causa**: Código server-side en componente cliente

**Solución**: Ya resuelto en PR #36 - eliminamos código `crypto` de Node.js

## 9. Monitoreo Continuo

### Sentry

Los errores del Meta Pixel se reportan automáticamente a Sentry con el tag:
```
category: meta_pixel
```

Para revisar errores:
1. Abre Sentry dashboard
2. Filtra por tag `category:meta_pixel`
3. Revisa errores recientes

### Métricas Clave

Monitorea estas métricas semanalmente:
- Número de `PageView` (tráfico del sitio)
- Conversión `CompleteRegistration` / `PageView` (tasa de registro)
- `StartTrial` = `CompleteRegistration` (deberían ser iguales)
- Event Match Quality Score (objetivo: mantener 5.0+)

## 10. Próximos Pasos (Opcional)

### Conversions API (Server-Side)

Para mejorar el tracking y reducir pérdida de datos:
1. Implementar Conversions API en backend
2. Enviar eventos desde servidor (duplicando browser events)
3. Facebook deduplicará automáticamente con `event_id`
4. Mejorará Match Quality Score
5. Reducirá pérdida por AdBlockers

### Enhanced Match Parameters

Para mejorar atribución (requiere consentimiento explícito):
1. Implementar cookie consent banner
2. Si usuario consiente, enviar parámetros hasheados:
   - `em`: email (SHA256)
   - `ph`: teléfono (SHA256)
3. Usar Advanced Matching en initialization

### Custom Events

Agregar eventos adicionales según necesidad:
- `InitiateCheckout`: Cuando usuario selecciona plan
- `Subscribe`: Cuando usuario convierte de trial a pago
- `AddPaymentInfo`: Cuando agrega método de pago

---

## Recursos

- [Facebook Events Manager](https://business.facebook.com/events_manager2/)
- [Facebook Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel/)
- [Test Events Documentation](https://www.facebook.com/business/help/1065761620227497)
- [Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/)

---

**Creado**: 2025-01-11
**Última Actualización**: 2025-01-11
**Pixel ID**: 1390664119337892
**Versión**: 1.0
