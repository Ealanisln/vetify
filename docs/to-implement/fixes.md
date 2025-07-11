# Plan de Correcciones - Pricing Vetify

## 🎯 Resumen de Tareas

### 1. **Error de Stripe IDs - PRIORIDAD ALTA** 🔴
**Problema**: "Invalid price identifier" en el checkout  
**Archivo**: `/src/components/pricing/PricingCard.tsx` (línea 108)

### 2. **Glitch de Diseño - Toggle Mensual/Anual** 🟡
**Problema**: Diseño del toggle no se ve correctamente en algunas vistas  
**Archivo**: `/src/components/pricing/PricingPageEnhanced.tsx`

### 3. **Actualizar Características de los Planes** 🟢
**Problema**: Mostrar correctamente "30 días de prueba" y características actualizadas  
**Archivos**: Múltiples componentes de pricing

### 4. **Renovar Diseño del Pricing** 🎨
**Problema**: Necesita colores aesthetic acordes al diseño de la página  
**Archivos**: Componentes de pricing y estilos

### 5. **Actualizar Landing Page** 📄
**Problema**: Alinear con los nuevos planes  
**Archivo**: `/src/app/page.tsx` y componentes relacionados

---

## 📋 Detalles de Implementación

### 1. **Corrección de Stripe IDs**

**Causa del error**: Los IDs en `PricingPageEnhanced` no coinciden con los lookup keys configurados en Stripe.

**Archivos a modificar**:
- `/src/components/pricing/PricingPageEnhanced.tsx` (líneas 106-149)

**Cambios necesarios**:

```typescript
// En mockPrices, cambiar los IDs para que coincidan con los lookup keys:
const mockPrices: Record<string, { monthly: PricingPrice; yearly: PricingPrice }> = {
  starter: {
    monthly: {
      id: 'starter_monthly', // Cambiar de 'basic_monthly'
      unitAmount: 29900,
      currency: 'mxn',
      interval: 'month',
      intervalCount: 1
    },
    yearly: {
      id: 'starter_yearly', // Cambiar de 'basic_yearly'
      unitAmount: 23900,
      currency: 'mxn',
      interval: 'year',
      intervalCount: 1
    }
  },
  // Continuar con standard y professional...
```

### 2. **Corrección del Toggle Mensual/Anual**

**Archivo**: `/src/components/pricing/PricingPageEnhanced.tsx` (líneas 274-309)

**Solución CSS**:

```tsx
// Reemplazar el div del toggle con:
<div className="flex items-center justify-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-gray-200 dark:border-gray-700 max-w-fit mx-auto">
```

### 3. **Actualizar Trial de 30 días**

**Archivos**:
- `/src/components/pricing/PricingCard.tsx` (línea 53-54)
- `/src/lib/payments/stripe.ts` (línea 108)

**Ya está implementado** ✅ - Solo verificar que se muestre correctamente en la UI.

### 4. **Renovar Diseño - Colores Aesthetic**

**Paleta de colores del tema (ya definida en tailwind.config.ts)**:
- Primary: `#8B6E5C` (Brown)
- Accent: `#7FA99B` (Sage green)
- Blush: `#FFB5B5` (Soft pink)

**Cambios en PricingCard.tsx**:

```tsx
// Actualizar getButtonStyle() para usar los colores del tema:
const getButtonStyle = () => {
  if (isCurrentPlan) {
    return 'bg-vetify-accent/20 text-vetify-accent-dark cursor-not-allowed border-2 border-vetify-accent/30';
  }
  if (isUpgrade) {
    return 'bg-vetify-accent hover:bg-vetify-accent-dark text-white shadow-md hover:shadow-lg border-2 border-vetify-accent';
  }
  if (isDowngrade) {
    return 'bg-vetify-blush hover:bg-vetify-blush-dark text-white border-2 border-vetify-blush';
  }
  if (isPopular) {
    return 'bg-vetify-primary hover:bg-vetify-primary-dark text-white shadow-md hover:shadow-lg border-2 border-vetify-primary';
  }
  return 'bg-vetify-primary-100 hover:bg-vetify-primary-200 text-vetify-primary-dark border-2 border-vetify-primary-100';
};
```

### 5. **Actualizar Landing Page**

**Componentes a revisar**:
- `/src/components/hero/HeroSection.tsx`
- `/src/components/marketing/index.tsx`

**Agregar sección de pricing simplificada** con link a `/precios`.

---

## 🚀 Orden de Implementación

1. **Primero**: Corregir los Stripe IDs (crítico para funcionamiento)
2. **Segundo**: Arreglar el diseño del toggle
3. **Tercero**: Aplicar nuevos colores aesthetic
4. **Cuarto**: Verificar características y trial de 30 días
5. **Último**: Actualizar landing page

## 🔧 Comandos para Testing

```bash
# Verificar IDs de Stripe
stripe prices list --lookup-keys starter_monthly starter_yearly standard_monthly standard_yearly professional_monthly professional_yearly

# Test local
npm run dev

# Verificar en staging
npm run build && npm run start
```

## 📝 Notas Adicionales

- Los precios ya están configurados correctamente en MXN
- El trial de 30 días ya está implementado en el backend
- El diseño usa Tailwind CSS con clases personalizadas definidas en `tailwind.config.ts`
- Considerar agregar animaciones suaves para mejorar la UX

## ✅ Checklist de Validación

- [ ] Los IDs de Stripe funcionan correctamente
- [ ] El toggle mensual/anual se ve bien en todas las resoluciones
- [ ] Los colores siguen la paleta de Vetify
- [ ] Se muestra "30 días de prueba" en todos los planes
- [ ] El landing page menciona los nuevos planes
- [ ] No hay errores en la consola del navegador
- [ ] El checkout de Stripe procesa correctamente