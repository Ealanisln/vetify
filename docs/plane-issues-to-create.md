# Issues para Plane - Alineación de Features por Plan de Suscripción

**Proyecto:** Vetify
**Project ID:** 95c5423a-ae3c-40bb-a457-ae0c44fee48b
**Workspace:** alanis-side-projects

---

## 🔴 ALTA PRIORIDAD

### Issue 1: Refactor Reports - Split basic vs advanced features

**Title:** `Refactor Reports: Split basic vs advanced features`

**Description:**
```markdown
## Objetivo
Separar los reportes en componentes básicos (Plan Básico) y avanzados (Plan Profesional) para alinearse con la estructura de precios.

## Tareas
- [ ] Analizar `EnhancedReportsClient` y dividir en componentes:
  - `BasicReportsClient`: Listas, estadísticas simples
  - `AdvancedReportsClient`: Analytics, trends, insights detallados
- [ ] Implementar `<FeatureGate feature="advancedReports">` en features premium
- [ ] Definir claramente qué reportes son básicos vs avanzados
- [ ] Actualizar documentación en `/docs`
- [ ] Testing: verificar que Plan Básico ve solo reportes básicos

## Features Básicas (Plan Básico)
- Lista de ventas
- Resumen de ingresos del día/mes
- Lista de clientes/mascotas
- Estadísticas simples (contadores, promedios básicos)

## Features Avanzadas (Plan Profesional)
- Análisis de tendencias
- Gráficos interactivos avanzados
- Comparativas período a período
- Exportación a múltiples formatos
- Reportes personalizados
- Insights predictivos

## Archivos a modificar
- `src/app/dashboard/reports/page.tsx`
- `src/components/reports/EnhancedReportsClient.tsx`
- Crear: `src/components/reports/BasicReportsClient.tsx`
- Crear: `src/components/reports/AdvancedReportsSection.tsx`

## Referencias
- Commit: a815e28 - "feat: align subscription plan features with pricing page promises"
- TODO comments in `src/app/dashboard/reports/page.tsx`
```

**Labels:** `feature`, `subscription`, `high-priority`, `reports`
**Priority:** High
**State:** Backlog

---

### Issue 2: Refactor Inventory - Split basic vs advanced features

**Title:** `Refactor Inventory: Split basic vs advanced features`

**Description:**
```markdown
## Objetivo
Separar el inventario en funcionalidades básicas (Plan Básico) y avanzadas (Plan Profesional).

## Tareas
- [ ] Analizar `InventoryMain` y dividir en secciones
- [ ] Implementar `<FeatureGate feature="advancedInventory">` en features premium
- [ ] Crear componentes separados para features avanzadas
- [ ] Actualizar UI para mostrar upgrade prompts
- [ ] Testing: verificar límites por plan

## Features Básicas (Plan Básico)
- CRUD de items de inventario
- Tracking de stock actual
- Búsqueda y filtrado simple
- Alertas manuales de stock bajo
- Registro de movimientos básico

## Features Avanzadas (Plan Profesional) - A PROTEGER
- 🔒 Análisis de rotación de inventario
- 🔒 Alertas automáticas de stock bajo
- 🔒 Integración con proveedores
- 🔒 Reportes detallados de movimientos
- 🔒 Predicción de demanda
- 🔒 Gestión de lotes y vencimientos
- 🔒 Códigos de barras avanzados

## Archivos a modificar
- `src/app/dashboard/inventory/page.tsx`
- `src/components/inventory/InventoryMain.tsx`
- `src/components/inventory/InventoryStats.tsx`
- `src/components/inventory/LowStockAlert.tsx`
- Crear: `src/components/inventory/AdvancedInventoryFeatures.tsx`

## Referencias
- Commit: a815e28 - "feat: align subscription plan features with pricing page promises"
- TODO comments in `src/app/dashboard/inventory/page.tsx`
```

**Labels:** `feature`, `subscription`, `high-priority`, `inventory`
**Priority:** High
**State:** Backlog

---

### Issue 3: Implement FeatureGate wrappers across advanced features

**Title:** `Implement FeatureGate wrappers across advanced features`

**Description:**
```markdown
## Objetivo
Aplicar el componente `<FeatureGate>` en todas las features premium identificadas y crear upgrade prompts personalizados.

## Tareas
- [ ] Crear upgrade prompts personalizados por feature
  - `AdvancedReportsUpgradePrompt`
  - `AdvancedInventoryUpgradePrompt`
  - `MultiLocationUpgradePrompt`
- [ ] Aplicar FeatureGate en Reports avanzados
- [ ] Aplicar FeatureGate en Inventory avanzado
- [ ] Implementar en futuras features multi-sucursal
- [ ] Testing de flujos de upgrade
- [ ] Documentar todas las features gateadas en `/docs`

## Componentes a crear
```tsx
<FeatureGate
  feature="advancedReports"
  fallback={<AdvancedReportsUpgradePrompt />}
>
  <AdvancedReportsSection />
</FeatureGate>
```

## Features a gatear
1. **advancedReports** - Reportes avanzados con analytics
2. **advancedInventory** - Análisis de rotación, alertas automáticas
3. **multiLocation** - Gestión de múltiples sucursales
4. **multipleCashDrawers** - Múltiples cajas por sucursal (futuro)

## Testing checklist
- [ ] Usuario en Plan Básico ve upgrade prompt correctamente
- [ ] Usuario en Plan Profesional accede sin restricciones
- [ ] Upgrade prompts tienen CTAs claros a /precios
- [ ] No hay fugas de features premium

## Referencias
- Componente existente: `src/components/features/FeatureGate.tsx`
- Action: `src/app/actions/subscription.ts` - `checkFeatureAccess()`
```

**Labels:** `feature`, `subscription`, `high-priority`, `ux`
**Priority:** High
**State:** Backlog

---

## 🟡 MEDIA PRIORIDAD

### Issue 4: Add PRO badges to premium features in Sidebar

**Title:** `Add PRO badges to premium features in Sidebar`

**Description:**
```markdown
## Objetivo
Mejorar la UX agregando badges visuales "PRO" o "PROFESIONAL" a features premium en el Sidebar.

## Tareas
- [ ] Diseñar badges visuales "PRO"
  - Opciones: Badge pequeño, Color accent, Ícono candado
- [ ] Implementar en Sidebar navigation items
- [ ] Agregar tooltips explicativos
  - "Requiere Plan Profesional"
  - Breve descripción del benefit
- [ ] Click en feature con badge → modal de upgrade
- [ ] Mantener navegación accesible (no bloquear clicks a features básicas)
- [ ] Dark mode compatible

## Features que necesitan badge
- **Inventario** - "Incluye análisis avanzado en Plan Profesional"
- **Reportes** - "Analytics avanzados en Plan Profesional"

## Diseño propuesto
```tsx
<div className="flex items-center gap-2">
  <span>Inventario</span>
  <Badge variant="pro" size="xs">PRO</Badge>
</div>
```

## Comportamiento
- Hover en badge → Tooltip con info
- Click en item → Navega normal (no bloquea)
- Dentro de la página → FeatureGate se encarga de proteger features

## Referencias
- Sidebar: `src/components/dashboard/Sidebar.tsx`
- Design system: `src/components/ui/badge.tsx`
```

**Labels:** `ui`, `subscription`, `medium-priority`, `design`
**Priority:** Medium
**State:** Backlog

---

### Issue 5: Implement multi-cash-drawer system for Plan Profesional

**Title:** `Implement multi-cash-drawer system for Plan Profesional`

**Description:**
```markdown
## Objetivo
Implementar sistema de múltiples cajas registradoras para Plan Profesional, con límite de 1 caja para Plan Básico.

## Tareas
- [ ] UI para validar límite antes de crear nueva caja
  - Plan Básico: mostrar upgrade prompt al intentar crear 2da caja
  - Plan Profesional: permitir múltiples cajas
- [ ] Implementar `validatePlanAction('addCashRegister')` en UI
- [ ] UI para gestionar múltiples cajas
  - Lista de cajas activas
  - Estado de cada caja (OPEN, CLOSED)
  - Selector de caja al hacer operaciones
- [ ] Sistema de gestión de turnos de cajeros
  - Asignar cajero a turno
  - Apertura/cierre de turno
  - Responsabilidad por turno
- [ ] Reportes avanzados por caja
  - Reporte individual por caja
  - Reporte por turno
  - Resumen consolidado
- [ ] Testing con ambos planes

## Validación de límites
```typescript
// En UI antes de crear caja
const check = await checkCashRegisterLimit(tenantId);
if (!check.canAdd) {
  // Mostrar upgrade prompt
  showUpgradePrompt();
}
```

## Plan Básico (límite: 1)
- ✅ Una caja activa
- ✅ Operaciones básicas
- ❌ No puede crear segunda caja
- ❌ Sin gestión de turnos

## Plan Profesional (ilimitado)
- ✅ Múltiples cajas
- ✅ Gestión de turnos
- ✅ Reportes avanzados por caja
- ✅ Resumen consolidado

## Archivos a modificar
- `src/app/dashboard/caja/page.tsx`
- `src/components/caja/CashDrawerMain.tsx`
- Crear: `src/components/caja/MultiCashDrawerManager.tsx`
- Crear: `src/components/caja/CashDrawerSelector.tsx`
- Crear: `src/components/caja/ShiftManagement.tsx`

## Referencias
- Function: `checkCashRegisterLimit()` in `src/lib/plan-limits.ts`
- Model: `CashDrawer` in Prisma schema
```

**Labels:** `feature`, `subscription`, `cash-register`, `medium-priority`
**Priority:** Medium
**State:** Backlog

---

### Issue 6: E2E testing for subscription plan access control

**Title:** `E2E testing for subscription plan access control`

**Description:**
```markdown
## Objetivo
Crear suite completa de tests E2E con Playwright para validar control de acceso por plan de suscripción.

## Tareas
- [ ] Setup tests con diferentes planes
  - Crear fixtures de usuarios por plan
  - Mock de Stripe subscriptions
- [ ] Tests para Plan Básico
- [ ] Tests para Plan Profesional
- [ ] Tests de flujos de upgrade
- [ ] Documentar casos de prueba
- [ ] Integrar en CI/CD

## Test Suite: Plan Básico

### ✅ Acceso permitido
- [ ] Dashboard principal
- [ ] CRUD de clientes
- [ ] CRUD de mascotas
- [ ] Gestión de citas
- [ ] Punto de venta básico
- [ ] 1 caja registradora
- [ ] Inventario básico
- [ ] Reportes básicos

### ❌ Acceso bloqueado con upgrade prompt
- [ ] No puede crear 2da caja → upgrade prompt
- [ ] Features avanzadas de inventario → upgrade prompt
- [ ] Reportes avanzados → upgrade prompt
- [ ] Multi-sucursal → upgrade prompt (futuro)

## Test Suite: Plan Profesional

### ✅ Acceso completo
- [ ] Todo del Plan Básico
- [ ] Múltiples cajas registradoras
- [ ] Features avanzadas de inventario
- [ ] Reportes avanzados con analytics
- [ ] Gestión de turnos

## Test Suite: Upgrade Flows

- [ ] Usuario ve upgrade prompts correctamente
- [ ] Click en "Ver Planes" → redirige a /precios
- [ ] Después de upgrade → acceso inmediato a features
- [ ] Límites se actualizan correctamente

## Estructura de tests
```
tests/
  e2e/
    subscription/
      plan-basico.spec.ts
      plan-profesional.spec.ts
      upgrade-flows.spec.ts
      feature-gates.spec.ts
```

## Referencias
- Existing E2E: `tests/e2e/` directory
- Playwright config: `playwright.config.ts`
- Feature gates: `src/components/features/FeatureGate.tsx`
```

**Labels:** `testing`, `subscription`, `e2e`, `medium-priority`, `playwright`
**Priority:** Medium
**State:** Backlog

---

## 📋 Resumen

**Total issues:** 6
- **Alta prioridad:** 3
- **Media prioridad:** 3

**Orden de implementación sugerido:**
1. Issue #3 (FeatureGate) - Base para todo
2. Issue #1 (Reports) - Quick win
3. Issue #2 (Inventory) - More complex
4. Issue #4 (PRO badges) - UX improvement
5. Issue #5 (Multi-cash) - New feature
6. Issue #6 (Testing) - Validation

---

## 🔧 Comandos para después del reinicio

### 1. Configurar Plane MCP
```bash
claude mcp add-json "plane" '{
  "command": "npx",
  "args": ["-y", "@makeplane/plane-mcp-server"],
  "env": {
    "PLANE_API_KEY": "plane_api_7544156da2c740418676d7fba3a9ca59",
    "PLANE_WORKSPACE_SLUG": "alanis-side-projects",
    "PLANE_API_HOST_URL": "https://plane.alanis.dev"
  }
}'
```

### 2. Reiniciar Claude Code

### 3. Crear issues en Plane
Usar las herramientas MCP de Plane para crear cada issue con el contenido de este documento.

---

**Documento generado:** 2025-10-25
**Relacionado con commit:** a815e28 - "feat: align subscription plan features with pricing page promises"
