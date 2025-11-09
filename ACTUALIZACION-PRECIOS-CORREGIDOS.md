# ✅ PRECIOS CORREGIDOS EN STRIPE LIVE

## 🔍 Problema Identificado

Los precios creados inicialmente tenían los montos INCORRECTOS porque **Stripe maneja MXN en centavos** (como USD).

**Ejemplo del error:**
- Se creó: `1199` → Stripe lo interpretó como $11.99 MXN ❌
- Correcto: `119900` → Stripe lo interpreta como $1,199.00 MXN ✅

## ✅ Solución Aplicada

Se crearon **6 nuevos precios** con los montos correctos (multiplicados por 100):

### Plan Básico
- **Mensual**: $599 MXN
  - ID: `price_1SRbeEL0nsUWmd4XBFJ39Vos`
  - Monto en Stripe: 59,900 centavos

- **Anual**: $4,788 MXN ($399/mes)
  - ID: `price_1SRbeEL0nsUWmd4XKYm8XgQf`
  - Monto en Stripe: 478,800 centavos

### Plan Profesional
- **Mensual**: $1,199 MXN
  - ID: `price_1SRbeEL0nsUWmd4XeqTWgtqf`
  - Monto en Stripe: 119,900 centavos

- **Anual**: $9,588 MXN ($799/mes)
  - ID: `price_1SRbeFL0nsUWmd4X3828tN8a`
  - Monto en Stripe: 958,800 centavos

### Plan Corporativo
- **Mensual**: $5,000 MXN
  - ID: `price_1SRbeFL0nsUWmd4XAVO4h9rv`
  - Monto en Stripe: 500,000 centavos

- **Anual**: $60,000 MXN
  - ID: `price_1SRbeGL0nsUWmd4XKgS6jCso`
  - Monto en Stripe: 6,000,000 centavos

---

## 📝 PASO 1: Actualizar Variables en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables → Production

Necesitas **ACTUALIZAR** (no agregar nuevas, sino editar las existentes) estas 6 variables:

```bash
STRIPE_PRICE_BASICO_MONTHLY_LIVE=price_1SRbeEL0nsUWmd4XBFJ39Vos
STRIPE_PRICE_BASICO_ANNUAL_LIVE=price_1SRbeEL0nsUWmd4XKYm8XgQf
STRIPE_PRICE_PROFESIONAL_MONTHLY_LIVE=price_1SRbeEL0nsUWmd4XeqTWgtqf
STRIPE_PRICE_PROFESIONAL_ANNUAL_LIVE=price_1SRbeFL0nsUWmd4X3828tN8a
STRIPE_PRICE_CORPORATIVO_MONTHLY_LIVE=price_1SRbeFL0nsUWmd4XAVO4h9rv
STRIPE_PRICE_CORPORATIVO_ANNUAL_LIVE=price_1SRbeGL0nsUWmd4XKgS6jCso
```

**Cómo actualizar en Vercel:**
1. Para cada variable, haz clic en los 3 puntos (...)
2. Selecciona "Edit"
3. Reemplaza el valor antiguo con el nuevo ID
4. Haz clic en "Save"
5. **NO** necesitas hacer redeploy, Vercel actualizará automáticamente

---

## 📝 PASO 2: Verificar Código Actualizado

El código ya está actualizado en estos archivos:

✅ `src/lib/payments/stripe.ts` → IDs de precios de producción actualizados
✅ `LIMPIEZA-VERCEL-VARIABLES.md` → Documentación actualizada con nuevos IDs

---

## 📝 PASO 3: Configurar Customer Portal en Stripe

Ahora que los precios están correctos, puedes configurar el Customer Portal:

### 1. Ve a Stripe Dashboard
https://dashboard.stripe.com/settings/billing/portal

### 2. Habilitar "Subscription management"
- Marca: ✅ **Allow customers to update their subscriptions**
- Configuración:
  - Products & prices: **Selecciona los 3 productos (Básico, Profesional, Corporativo)**
  - Allow customers to switch to different pricing: ✅ **Activado**
  - Proration: **Create prorations** (para cobros inmediatos en upgrades)

### 3. Habilitar "Cancellation"
- Marca: ✅ **Allow customers to cancel subscriptions**
- When to cancel: **At the end of the billing period** (mantiene acceso hasta que termine el periodo pagado)
- Cancellation reasons: ✅ **Activado**
- Save cancellation reasons: ✅ **Activado**

### 4. Habilitar "Payment method updates"
- Marca: ✅ **Allow customers to update their payment methods**

### 5. Habilitar "Invoice history"
- Marca: ✅ **Allow customers to view their invoice history**

### 6. Branding (Opcional)
- Business name: **Vetify**
- Support email: `tu-email-de-soporte@vetify.com.mx`
- Color del header: `#75a99c` (tu color principal)

### 7. Guardar cambios
- Haz clic en "Save configuration"

---

## 🧪 PASO 4: Probar en Customer Portal

1. Ve a tu Stripe Dashboard
2. En modo LIVE, ve a: **Customers**
3. Selecciona cualquier cliente de prueba (o créate uno nuevo)
4. Haz clic en "Create billing portal session"
5. Verifica que los precios se vean correctamente:
   - Plan Básico: $599.00/mes y $4,788.00/año
   - Plan Profesional: $1,199.00/mes y $9,588.00/año
   - Plan Corporativo: $5,000.00/mes y $60,000.00/año

---

## ✅ Verificación Final

Después de actualizar las variables en Vercel, verifica:

1. **Precios en Customer Portal**: ✅ Deben mostrar montos correctos
2. **Cupón de descuento**: ✅ Debe aplicar 25% OFF
3. **Cambio de plan**: ✅ Los usuarios deben poder cambiar entre planes
4. **Cancelación**: ✅ Los usuarios deben poder cancelar al final del periodo

---

## 🗑️ Precios Antiguos (Incorrectos)

Estos precios quedarán inactivos en Stripe pero NO se eliminan (por diseño de Stripe):

```
❌ price_1SRbFFL0nsUWmd4XeCKpTq83 → $5.99 (debía ser $599)
❌ price_1SRbFOL0nsUWmd4XhniLTaN6 → $47.88 (debía ser $4,788)
❌ price_1SRbFaL0nsUWmd4XNAKomBDH → $11.99 (debía ser $1,199)
❌ price_1SRbFiL0nsUWmd4XT6M5Z7Wl → $95.88 (debía ser $9,588)
❌ price_1SRbFvL0nsUWmd4XTi1saQ0k → $50.00 (debía ser $5,000)
❌ price_1SRbG4L0nsUWmd4X62VzNx28 → $600.00 (debía ser $60,000)
```

Puedes archivarlos en Stripe Dashboard para que no aparezcan en listados.

---

## 📊 Resumen de Variables en Vercel Production

```bash
# Keys principales
STRIPE_SECRET_KEY_LIVE=sk_live_...TU_KEY_AQUI...
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...TU_KEY_AQUI...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...TU_WEBHOOK_SECRET_AQUI...

# Productos
STRIPE_PRODUCT_BASICO_LIVE=prod_TOO1tpvYblty9Y
STRIPE_PRODUCT_PROFESIONAL_LIVE=prod_TOO1RsH4C7mQmr
STRIPE_PRODUCT_CORPORATIVO_LIVE=prod_TOO1q6SDg9CGMP

# Precios (✅ CORREGIDOS)
STRIPE_PRICE_BASICO_MONTHLY_LIVE=price_1SRbeEL0nsUWmd4XBFJ39Vos
STRIPE_PRICE_BASICO_ANNUAL_LIVE=price_1SRbeEL0nsUWmd4XKYm8XgQf
STRIPE_PRICE_PROFESIONAL_MONTHLY_LIVE=price_1SRbeEL0nsUWmd4XeqTWgtqf
STRIPE_PRICE_PROFESIONAL_ANNUAL_LIVE=price_1SRbeFL0nsUWmd4X3828tN8a
STRIPE_PRICE_CORPORATIVO_MONTHLY_LIVE=price_1SRbeFL0nsUWmd4XAVO4h9rv
STRIPE_PRICE_CORPORATIVO_ANNUAL_LIVE=price_1SRbeGL0nsUWmd4XKgS6jCso

# Cupón
STRIPE_COUPON_LIVE=u62SRvcw
```

---

**Fecha de corrección**: 2025-01-09
**Motivo**: Stripe maneja MXN en centavos, igual que USD
**Impacto**: Los precios ahora se mostrarán correctamente en el Customer Portal
**Total precios creados**: 6 nuevos (correctos) + 6 antiguos (incorrectos, inactivos)
