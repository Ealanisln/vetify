# Sistema de Límites de Planes - Ejemplos de Uso

## 📋 Resumen

El sistema de límites de planes implementado proporciona un control granular sobre las funcionalidades disponibles para cada tenant basado en su suscripción. Esta implementación mejora significativamente la original con:

### ✅ Mejoras Implementadas

1. **Validación Robusta**: Validación tanto en servidor como cliente
2. **Manejo de Errores Mejorado**: Errores específicos con información detallada  
3. **Componentes Reutilizables**: Sistema modular para diferentes escenarios
4. **Performance Optimizado**: Consultas eficientes a PostgreSQL
5. **UX Mejorada**: Mensajes claros y acciones sugeridas

---

## 🛠️ Implementación Mejorada

### 1. Validación en APIs (Server-Side)

```typescript
// src/app/api/pets/route.ts
import { validatePlanAction, PlanLimitError } from '@/lib/plan-limits';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    
    // ✅ Validar límites ANTES de crear
    await validatePlanAction(tenant.id, 'addPet');
    
    const body = await request.json();
    const pet = await createPet(tenant.id, body);
    
    return NextResponse.json(pet);
  } catch (error) {
    // ✅ Manejo específico de errores de límites
    if (error instanceof PlanLimitError) {
      return NextResponse.json({
        error: 'plan_limit_exceeded',
        message: error.message,
        limitType: error.limitType,
        current: error.current,
        limit: error.limit
      }, { status: 403 });
    }
    // ... otros errores
  }
}
```

### 2. Protección de Features (Server Components)

```typescript
// src/app/dashboard/reports/page.tsx
import { PlanGuard } from '@/components/PlanGuard';
import { requireAuth } from '@/lib/auth';

export default async function ReportsPage() {
  const { tenant } = await requireAuth();
  
  return (
    <div>
      <h1>Reportes</h1>
      
      {/* ✅ Reportes básicos para todos */}
      <BasicReportsSection />
      
      {/* ✅ Reportes avanzados solo para planes PRO */}
      <PlanGuard 
        tenantId={tenant.id} 
        feature="advancedReports"
        fallback={<div>Reportes básicos disponibles</div>}
      >
        <AdvancedReportsSection />
      </PlanGuard>
    </div>
  );
}
```

### 3. Validación Reactiva (Client Components)

```typescript
// src/components/AddPetButton.tsx
'use client';
import { usePlanGuard } from '@/components/PlanGuard';
import { Button } from '@/components/ui/button';

export function AddPetButton({ tenantId }: { tenantId: string }) {
  const { checkLimit, loading } = usePlanGuard(tenantId);
  
  const petLimits = checkLimit('pets');
  
  if (loading) return <Button disabled>Cargando...</Button>;
  
  if (!petLimits.canAdd) {
    return (
      <div className="space-y-2">
        <Button disabled>
          Límite alcanzado ({petLimits.current}/{petLimits.limit})
        </Button>
        <p className="text-sm text-amber-600">
          Has alcanzado el límite de mascotas de tu plan
        </p>
        <Button variant="outline" size="sm">
          <Link href="/precios">Actualizar Plan</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <Button onClick={handleAddPet}>
      Agregar Mascota ({petLimits.remaining} restantes)
    </Button>
  );
}
```

### 4. Dashboard de Límites

```typescript
// src/app/dashboard/page.tsx
import { PlanLimitsCard } from '@/components/dashboard/PlanLimitsCard';
import { getPlanStatus } from '@/lib/plan-limits';
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage() {
  const { tenant } = await requireAuth();
  const planStatus = await getPlanStatus(tenant.id);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Otros cards del dashboard */}
      <div className="lg:col-span-1">
        <PlanLimitsCard planStatus={planStatus} />
      </div>
      {/* ... resto del dashboard */}
    </div>
  );
}
```

---

## 🎯 Casos de Uso Específicos

### 1. Antes de Crear una Mascota

```typescript
// Frontend validation
const handleSubmit = async (data) => {
  try {
    const response = await fetch('/api/pets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response.status === 403) {
      const error = await response.json();
      if (error.error === 'plan_limit_exceeded') {
        setError(`${error.message} (${error.current}/${error.limit})`);
        setShowUpgradePrompt(true);
        return;
      }
    }
    
    // Continuar con creación exitosa
  } catch (error) {
    // Handle other errors
  }
};
```

### 2. Automaciones WhatsApp

```typescript
// src/lib/whatsapp.ts
import { validatePlanAction } from '@/lib/plan-limits';

export async function sendWhatsAppMessage(tenantId: string, message: WhatsAppMessage) {
  // ✅ Validar límite de WhatsApp
  await validatePlanAction(tenantId, 'sendWhatsApp');
  
  // Enviar mensaje
  const result = await whatsappApi.send(message);
  
  // Registrar uso para tracking
  await prisma.automationLog.create({
    data: {
      tenantId,
      workflowType: 'WHATSAPP_MESSAGE',
      // ... otros datos
    }
  });
  
  return result;
}
```

### 3. Middleware para Rutas Protegidas

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import { checkFeatureAccess } from '@/lib/plan-limits';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Proteger rutas de automaciones
  if (pathname.startsWith('/dashboard/automations')) {
    const tenantId = await getTenantIdFromRequest(request);
    const hasAccess = await checkFeatureAccess(tenantId, 'automations');
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/precios', request.url));
    }
  }
  
  return NextResponse.next();
}
```

---

## 📊 Monitoreo y Analytics

### 1. Tracking de Límites

```typescript
// src/lib/analytics.ts
export async function trackLimitWarning(tenantId: string, limitType: string) {
  await prisma.tenantUsageStats.update({
    where: { tenantId },
    data: {
      // Track warning events
      lastLimitWarning: new Date(),
      limitWarningsCount: { increment: 1 }
    }
  });
  
  // Opcional: Enviar evento a analytics
  analytics.track('Plan Limit Warning', {
    tenantId,
    limitType,
    timestamp: new Date()
  });
}
```

### 2. Reportes para Admins

```typescript
// src/app/admin/analytics/page.tsx
export async function getTenantsNearLimits() {
  const tenants = await prisma.tenant.findMany({
    include: {
      tenantUsageStats: true,
      tenantSubscription: { include: { plan: true } }
    }
  });
  
  return tenants.filter(tenant => {
    const stats = tenant.tenantUsageStats;
    const plan = tenant.tenantSubscription?.plan;
    
    if (!stats || !plan) return false;
    
    return (
      stats.totalPets >= plan.maxPets * 0.8 ||
      stats.totalUsers >= plan.maxUsers * 0.8
    );
  });
}
```

---

## 🚨 Consideraciones de Seguridad

### 1. Validación Doble

- ✅ **Frontend**: UX inmediata, evita requests innecesarios
- ✅ **Backend**: Seguridad real, no puede ser bypaseada

### 2. Rate Limiting

```typescript
// src/lib/rate-limit.ts
export function createPlanAwareRateLimit(defaultLimit: number) {
  return async (tenantId: string) => {
    const limits = await getPlanLimits(tenantId);
    
    // Planes premium tienen límites más altos
    const multiplier = limits.maxPets > 100 ? 2 : 1;
    return defaultLimit * multiplier;
  };
}
```

### 3. Audit Trail

```typescript
// src/lib/audit.ts
export async function logPlanLimitViolation(
  tenantId: string, 
  limitType: string, 
  attemptedAction: string
) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: 'PLAN_LIMIT_VIOLATION',
      details: {
        limitType,
        attemptedAction,
        timestamp: new Date()
      }
    }
  });
}
```

---

## 🎉 Beneficios de la Implementación

### ✅ Para el Negocio
- **Conversión mejorada**: Prompts claros para actualizar
- **Prevención de abuso**: Límites técnicos robustos
- **Datos de uso**: Insights para optimizar planes

### ✅ Para Desarrolladores  
- **Código limpio**: Funciones reutilizables y bien tipadas
- **Testing fácil**: Componentes modulares
- **Mantenimiento**: Lógica centralizada

### ✅ Para Usuarios
- **UX transparente**: Siempre saben dónde están
- **Sin sorpresas**: Alertas antes de alcanzar límites
- **Actualización fácil**: CTAs claros y contextuales

---

## 🚀 Próximos Pasos Sugeridos

1. **Implementar notificaciones email** cuando se alcance 80% de límites
2. **Dashboard de admin** para monitorear uso y conversiones  
3. **A/B testing** en mensajes de upgrade prompts
4. **Integración con analytics** para tracking detallado
5. **Soft limits** vs **hard limits** para mejor UX 