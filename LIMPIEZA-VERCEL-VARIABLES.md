# 🧹 Limpieza de Variables en Vercel

## 📋 Resumen de Cambios

✅ **Código actualizado**: `stripe.ts` y `pricing-config.ts` ahora soportan TEST y PRODUCTION
✅ **Productos creados**: 3 productos + 6 precios + 1 cupón en Stripe LIVE
✅ **TypeScript**: Compila sin errores

---

## ❌ PASO 1: ELIMINAR Variables Legacy (Nomenclatura vieja)

Estas variables usan nombres viejos (CLINICA/EMPRESA) que ya no existen:

```
❌ STRIPE_PRICE_CLINICA_ANNUAL
❌ STRIPE_PRICE_CLINICA_MONTHLY
❌ STRIPE_PRICE_EMPRESA_ANNUAL
❌ STRIPE_PRICE_EMPRESA_MONTHLY
❌ STRIPE_PRODUCT_CLINICA
❌ STRIPE_PRODUCT_EMPRESA
```

**Cómo eliminar en Vercel:**
1. Ve a cada variable
2. Haz clic en los 3 puntos (...)
3. Selecciona "Delete"
4. Confirma

---

## ✅ PASO 2: MANTENER Variables de Test (No tocar)

Estas son correctas y se usan en desarrollo/staging:

```
✅ STRIPE_SECRET_KEY (para test)
✅ STRIPE_PUBLISHABLE_KEY (para test)
✅ STRIPE_WEBHOOK_SECRET (para test)
✅ STRIPE_COUPON (para test - si existe)
✅ STRIPE_PRICE_PROFESIONAL_ANNUAL (para test - si existe)
✅ STRIPE_PRICE_PROFESIONAL_MONTHLY (para test - si existe)
✅ STRIPE_PRODUCT_PROFESIONAL (para test - si existe)
```

**IMPORTANTE**: Asegúrate de que estas variables:
- Estén disponibles para: **Preview** y **Development**
- NO estén en **Production** (o si están, que tengan valores de test)

---

## ➕ PASO 3: AGREGAR Variables de Producción

### 3.1. Keys Principales de PRODUCCIÓN

```bash
STRIPE_SECRET_KEY_LIVE=sk_live_...TU_KEY_AQUI...
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...TU_KEY_AQUI...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...TU_WEBHOOK_SECRET_AQUI...
```

**Environment**: Solo **Production**

---

### 3.2. Productos LIVE

```bash
STRIPE_PRODUCT_BASICO_LIVE=prod_TOO1tpvYblty9Y
STRIPE_PRODUCT_PROFESIONAL_LIVE=prod_TOO1RsH4C7mQmr
STRIPE_PRODUCT_CORPORATIVO_LIVE=prod_TOO1q6SDg9CGMP
```

**Environment**: Solo **Production**

---

### 3.3. Precios LIVE - Plan Básico (✅ CORREGIDOS)

```bash
STRIPE_PRICE_BASICO_MONTHLY_LIVE=price_1SRbeEL0nsUWmd4XBFJ39Vos
STRIPE_PRICE_BASICO_ANNUAL_LIVE=price_1SRbeEL0nsUWmd4XKYm8XgQf
```

**Environment**: Solo **Production**

---

### 3.4. Precios LIVE - Plan Profesional (✅ CORREGIDOS)

```bash
STRIPE_PRICE_PROFESIONAL_MONTHLY_LIVE=price_1SRbeEL0nsUWmd4XeqTWgtqf
STRIPE_PRICE_PROFESIONAL_ANNUAL_LIVE=price_1SRbeFL0nsUWmd4X3828tN8a
```

**Environment**: Solo **Production**

---

### 3.5. Precios LIVE - Plan Corporativo (✅ CORREGIDOS)

```bash
STRIPE_PRICE_CORPORATIVO_MONTHLY_LIVE=price_1SRbeFL0nsUWmd4XAVO4h9rv
STRIPE_PRICE_CORPORATIVO_ANNUAL_LIVE=price_1SRbeGL0nsUWmd4XKgS6jCso
```

**Environment**: Solo **Production**

---

### 3.6. Cupón de Promoción LIVE (25% OFF por 6 meses)

```bash
STRIPE_COUPON_LIVE=u62SRvcw
```

**Environment**: Solo **Production**

---

## 📊 Resumen Final de Variables

### Production (LIVE)
```
Total: 13 variables nuevas

Keys (3):
- STRIPE_SECRET_KEY_LIVE
- STRIPE_PUBLISHABLE_KEY_LIVE
- STRIPE_WEBHOOK_SECRET_LIVE

Productos (3):
- STRIPE_PRODUCT_BASICO_LIVE
- STRIPE_PRODUCT_PROFESIONAL_LIVE
- STRIPE_PRODUCT_CORPORATIVO_LIVE

Precios (6):
- STRIPE_PRICE_BASICO_MONTHLY_LIVE
- STRIPE_PRICE_BASICO_ANNUAL_LIVE
- STRIPE_PRICE_PROFESIONAL_MONTHLY_LIVE
- STRIPE_PRICE_PROFESIONAL_ANNUAL_LIVE
- STRIPE_PRICE_CORPORATIVO_MONTHLY_LIVE
- STRIPE_PRICE_CORPORATIVO_ANNUAL_LIVE

Cupón (1):
- STRIPE_COUPON_LIVE
```

### Preview / Development (TEST)
```
Total: 3 variables mínimas

Keys (3):
- STRIPE_SECRET_KEY (test)
- STRIPE_PUBLISHABLE_KEY (test)
- STRIPE_WEBHOOK_SECRET (test)

Opcional (si usas cupón en test):
- STRIPE_COUPON (test)
```

---

## ✅ PASO 4: Verificar después de los cambios

### 4.1. Hacer nuevo deploy
```bash
git add .
git commit -m "feat: stripe production configuration with environment-based product IDs"
git push
```

### 4.2. Verificar en producción
1. Ve a tu app en producción
2. Intenta crear una suscripción
3. Verifica que use los productos LIVE (no test)
4. Verifica que aplique el cupón del 25%

### 4.3. Verificar en preview
1. Crea un PR o deploy preview
2. Verifica que use los productos TEST
3. Verifica que todo funcione

---

## 🆘 Troubleshooting

### Error: "Stripe secret key not found"
**Solución**: Verifica que `STRIPE_SECRET_KEY_LIVE` esté configurada en Production

### Error: "Product not found"
**Solución**: Verifica que todos los `STRIPE_PRODUCT_*_LIVE` estén configurados

### El cupón no se aplica
**Solución**: Verifica que `STRIPE_COUPON_LIVE` esté configurado

### Usa productos de test en producción
**Solución**: Verifica que `NODE_ENV=production` en Vercel (debería ser automático)

---

## 📝 Checklist Final

- [ ] Eliminar 6 variables legacy (CLINICA/EMPRESA)
- [ ] Mantener variables de test intactas
- [ ] Agregar 13 variables de producción (_LIVE)
- [ ] Configurar STRIPE_SECRET_KEY_LIVE con tu key real
- [ ] Configurar STRIPE_PUBLISHABLE_KEY_LIVE con tu key real
- [ ] Configurar STRIPE_WEBHOOK_SECRET_LIVE (después de crear webhook)
- [ ] Hacer deploy
- [ ] Probar suscripción en producción
- [ ] Verificar que aplique el 25% de descuento

---

**Fecha**: 2025-01-09
**Cuenta Stripe LIVE**: acct_1ReUgTL0nsUWmd4X (Vetify)
**Productos creados**: 3 ✅
**Precios creados**: 6 ✅
**Cupón creado**: 1 ✅
