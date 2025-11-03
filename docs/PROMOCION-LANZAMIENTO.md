# 🎉 Guía: Promoción de Lanzamiento - 25% OFF por 6 meses

## 📋 Resumen

Implementación completa de la oferta de lanzamiento para nuevos clientes:
- **25% de descuento** en todos los planes
- **Duración**: Primeros 6 meses
- **Válido hasta**: 31 de diciembre de 2025
- **Aplicación**: Automática en el checkout

---

## ✅ Paso 1: Crear el Cupón en Stripe

### Opción A: Dashboard de Stripe (RECOMENDADA) ⭐

1. Ve a: https://dashboard.stripe.com/coupons
2. Click en **"+ New"**
3. Configura:
   - **Name**: `🎉 Oferta de Lanzamiento - Early Adopter`
   - **ID**: `LANZAMIENTO25`
   - **Type**: `Percentage off`
   - **Percentage**: `25`
   - **Duration**: `Repeating`
   - **Duration in months**: `6`
   - **Redeem by**: `December 31, 2025` (fecha límite)
   - **Max redemptions**: (opcional) límite de usos totales si deseas

4. Click **"Create coupon"**

### Opción B: Via Stripe CLI

```bash
stripe coupons create \
  --name "🎉 Oferta de Lanzamiento - Early Adopter" \
  --id "LANZAMIENTO25" \
  --percent-off 25 \
  --duration repeating \
  --duration-in-months 6 \
  --redeem-by 1735689600
```

---

## 🎯 Cómo Funciona

### 1. **Aplicación Automática**

El cupón se aplica automáticamente cuando:
- La promoción está **activa** (`enabled: true`)
- La fecha actual es **antes** del `endDate` (31/12/2025)
- Un cliente crea un checkout de suscripción

### 2. **Configuración en el Código**

El archivo `/src/lib/pricing-config.ts` contiene la configuración:

```typescript
LAUNCH_PROMOTION: {
  enabled: true,                    // Activar/desactivar promoción
  discountPercent: 25,              // Porcentaje de descuento
  durationMonths: 6,                // Duración en meses
  endDate: new Date('2025-12-31'),  // Fecha límite
  couponCode: 'LANZAMIENTO25',      // ID del cupón en Stripe
  displayBadge: true,               // Mostrar badge en UI
  badgeText: '🎉 Oferta de Lanzamiento',
  description: '25% de descuento los primeros 6 meses'
}
```

### 3. **Flujo del Cliente**

1. Cliente visita `/precios`
2. Ve el badge "🎉 Oferta de Lanzamiento" (si está activo)
3. Click en "Iniciar Prueba Gratuita"
4. Stripe Checkout muestra:
   - **30 días de prueba gratis** (si aplica)
   - **25% OFF** aplicado automáticamente
   - Precio regular tachado con precio con descuento resaltado
5. Después de 6 meses, el precio vuelve automáticamente al precio regular

---

## 🎨 Mostrar la Promoción en la UI (PRÓXIMO PASO)

Para mostrar visualmente la promoción en la página de precios, puedes agregar un banner o badge. Ejemplo:

```tsx
// En PricingPageEnhanced.tsx

import { isLaunchPromotionActive, PRICING_CONFIG } from '@/lib/pricing-config';

// Dentro del componente:
{isLaunchPromotionActive() && (
  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg mb-6">
    <div className="flex items-center justify-center gap-2">
      <Sparkles className="h-5 w-5" />
      <p className="font-semibold">
        {PRICING_CONFIG.LAUNCH_PROMOTION.badgeText}
      </p>
    </div>
    <p className="text-sm text-center mt-1 opacity-90">
      {PRICING_CONFIG.LAUNCH_PROMOTION.description}
    </p>
  </div>
)}
```

---

## 🎛️ Control de la Promoción

### Activar/Desactivar

```typescript
// En pricing-config.ts
LAUNCH_PROMOTION: {
  enabled: true,  // ✅ Promoción activa
  // enabled: false, // ❌ Promoción desactivada
  ...
}
```

### Extender la Fecha

```typescript
LAUNCH_PROMOTION: {
  ...
  endDate: new Date('2026-03-31'), // Nueva fecha límite
  ...
}
```

### Cambiar el Descuento

1. Crear nuevo cupón en Stripe con diferente porcentaje
2. Actualizar en `pricing-config.ts`:

```typescript
LAUNCH_PROMOTION: {
  ...
  discountPercent: 30,  // Nuevo porcentaje
  couponCode: 'LANZAMIENTO30',  // Nuevo cupón
  ...
}
```

---

## 📊 Métricas y Seguimiento

### Dashboard de Stripe

Puedes ver las estadísticas del cupón en:
- https://dashboard.stripe.com/coupons/LANZAMIENTO25

Métricas disponibles:
- Total de usos
- Ingresos totales descontados
- Clientes únicos que lo usaron
- Timeline de redenciones

### Webhooks Recomendados

Para tracking avanzado, puedes escuchar:

```typescript
// En tu webhook handler
case 'coupon.created':
case 'customer.discount.created':
  // Log cuando se aplica el descuento
  break;
```

---

## 🔒 Seguridad y Límites

### Límites Recomendados

Para evitar abuso, considera agregar:

```typescript
// Al crear el cupón en Stripe Dashboard
max_redemptions: 1000  // Límite total de usos
```

### Solo Nuevos Clientes

El cupón se aplica en el primer checkout. Para usuarios existentes, el sistema:
- ✅ Permite el uso manual del código si `allow_promotion_codes: true`
- ❌ NO aplica el descuento automáticamente

---

## 🧪 Testing

### Modo de Prueba

1. Usar Stripe Test Mode
2. Crear cupón de prueba: `test_LANZAMIENTO25`
3. Actualizar temporalmente en código:

```typescript
couponCode: process.env.NODE_ENV === 'production' 
  ? 'LANZAMIENTO25' 
  : 'test_LANZAMIENTO25'
```

### Verificar Aplicación

```bash
# Ver sesiones de checkout recientes
stripe checkout sessions list --limit 5

# Ver detalles de una sesión específica
stripe checkout sessions retrieve cs_test_xxx

# Verificar que el cupón está aplicado
# Buscar en el response: "discount" → "coupon" → "LANZAMIENTO25"
```

---

## 📞 Comunicación al Cliente

### Email Marketing

Sugerencias de copy:

**Asunto**: 🎉 ¡Oferta de Lanzamiento! 25% OFF en Vetify

**Cuerpo**:
```
¡Somos Early Adopters también!

Para celebrar el lanzamiento de Vetify, te ofrecemos:

✨ 25% de descuento los primeros 6 meses
🎁 30 días de prueba gratis
💳 Sin compromiso - cancela cuando quieras

Válido hasta el 31 de diciembre de 2025

[Iniciar Prueba Gratuita →]

*Descuento aplicado automáticamente en el checkout
```

### Redes Sociales

```
🚀 ¡Vetify está aquí!

Gestiona tu clínica veterinaria como un profesional.

🎉 Oferta de lanzamiento:
→ 25% OFF por 6 meses
→ 30 días gratis
→ Cancela cuando quieras

Únete a los primeros 100 veterinarios 👉 [link]

#Veterinaria #SoftwareVet #EarlyAdopter
```

---

## ❓ FAQ

### ¿El descuento se combina con el trial de 30 días?

Sí. El cliente obtiene:
1. 30 días gratis (trial)
2. Después del trial → 6 meses al 75% del precio
3. Después de 6 meses → Precio regular (100%)

### ¿Qué pasa si un cliente cancela y vuelve?

- Si usa el mismo email/cuenta: NO se aplica automáticamente
- Si crea una cuenta nueva: SÍ se aplica

### ¿Puedo ofrecer el cupón manualmente a clientes específicos?

Sí, puedes:
1. Crear un promotion code en Stripe
2. Compartir el código específico con el cliente
3. El cliente lo ingresa en el checkout

### ¿Cómo quito la promoción cuando termine?

```typescript
// Opción 1: Deshabilitar en código
LAUNCH_PROMOTION: {
  enabled: false,
  ...
}

// Opción 2: Dejar que expire automáticamente
// El código verifica: now <= endDate
```

---

## 📚 Referencias

- [Stripe Coupons Documentation](https://docs.stripe.com/billing/subscriptions/coupons)
- [Stripe Checkout Discounts](https://docs.stripe.com/payments/checkout/discounts)
- [Promotion Codes](https://docs.stripe.com/billing/subscriptions/coupons#promotion-codes)

---

## 🎓 Mejores Prácticas

### DO ✅

- Crear el cupón ANTES de activar `enabled: true`
- Establecer una fecha de expiración clara
- Comunicar claramente los términos al cliente
- Monitorear el uso y ajustar según necesidad
- Tener un plan para después de la promoción

### DON'T ❌

- No cambiar el `couponCode` sin crear el cupón primero
- No usar cupones con nombres confusos
- No olvidar desactivar cuando termine
- No prometer descuentos sin verificar la configuración
- No usar el mismo cupón para diferentes promociones

---

## 🆘 Troubleshooting

### El cupón no se aplica

1. Verificar que el cupón existe en Stripe:
   ```bash
   stripe coupons retrieve LANZAMIENTO25
   ```

2. Verificar la configuración:
   ```typescript
   enabled: true
   endDate: future date
   couponCode: matches Stripe ID
   ```

3. Ver logs del checkout:
   ```bash
   # En el terminal donde corre Next.js
   # Buscar: "Applying launch promotion"
   ```

### Error: "Coupon not found"

- El ID en `pricing-config.ts` no coincide con Stripe
- El cupón fue eliminado en Stripe
- Estás en test mode pero el cupón está en producción (o viceversa)

---

**¿Preguntas?** Contacta al equipo de desarrollo o revisa la documentación de Stripe.

