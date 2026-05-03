# Checklist manual post-deploy

Este checklist cubre los flujos que **no se pueden automatizar de forma segura** contra producción (crean datos reales, dependen de servicios externos como Stripe, o requieren revisar paneles humanos como Sentry).

Se complementa con `pnpm test:post-deploy`, que valida automáticamente el smoke público y la suite autenticada local.

---

**Deploy verificado**

- Versión: `vX.Y.Z` (ver `/api/version`)
- Fecha y hora: `____________________`
- Quién lo verifica: `____________________`

---

## 1. Signup real → tenant creado

> Valida que un nuevo usuario puede registrarse, Kinde callback funciona y el tenant se crea con trial activo.

- [ ] Abrir incógnito en https://www.vetify.pro y dar **Comenzar** / **Registrarse**.
- [ ] Completar Kinde con email throwaway (ej. `qa+v$VERSION@vetify.pro` o un alias temporal).
- [ ] Después del callback, debería redirigir a `/onboarding`.
- [ ] Completar nombre de clínica + slug y enviar.
- [ ] Aterriza en `/dashboard` con banner de trial activo.
- [ ] (Opcional, vía Supabase MCP) verificar en `Tenant`:
  - `isTrialPeriod = true`
  - `trialEndsAt` ~30 días en el futuro
  - `subscriptionStatus = 'TRIALING'` (o el estado equivalente)

**Si falla**: revisar logs de `/api/onboarding` y handler de `/api/auth/[kindeAuth]` en Vercel.

---

## 2. Stripe checkout → suscripción activa

> Valida la integración Stripe + el webhook (que tocaron #180 referidos y #181 retention).

- [ ] Desde el tenant del paso 1 (o un tenant de prueba dedicado), ir a `/dashboard/settings?tab=subscription` o `/precios`.
- [ ] Elegir un plan (BÁSICO o PROFESIONAL) y completar checkout con tarjeta de **test mode** de Stripe (`4242 4242 4242 4242`, fecha futura, CVC cualquiera).
- [ ] Después del pago, redirige al dashboard con confirmación.
- [ ] (Vía Supabase MCP) verificar en `Tenant`:
  - `stripeCustomerId` poblado
  - `stripeSubscriptionId` poblado
  - `subscriptionStatus = 'ACTIVE'`
- [ ] (Vía Supabase MCP) verificar que existe una fila en `TenantSubscription` para ese tenant.

**Si falla**: revisar logs de `/api/stripe/checkout` y `/api/stripe/webhook` en Vercel; revisar el evento en Stripe Dashboard.

---

## 3. Webhook de Stripe procesa eventos

> El webhook fue modificado por #180 y #181 — riesgo alto de regresión silenciosa.

- [ ] Abrir Stripe Dashboard → Developers → Webhooks → endpoint de producción.
- [ ] Verificar que el último evento `checkout.session.completed` tiene status **Succeeded** (200).
- [ ] Verificar que el último `customer.subscription.updated` también tiene status **Succeeded**.
- [ ] Si hay eventos en **Failed** dentro de las últimas 24h: **investigar antes de cerrar el deploy**.

**Si falla**: el endpoint puede estar devolviendo 500. Revisar Sentry filtrando por `transaction:/api/stripe/webhook`.

---

## 4. Trial gate y suscripción

> Valida que `requireActivePlan()` y `/api/trial/check-access` siguen funcionando.

- [ ] En Sentry, filtrar últimas 24h por `transaction:"/api/trial/check-access"` → idealmente 0 issues nuevos.
- [ ] Filtrar por `transaction:"requireActivePlan"` o por archivos en `src/app/actions/subscription.ts` → 0 issues nuevos.
- [ ] Login con un tenant existente con suscripción activa → dashboard carga sin redirección a `/precios`.

---

## 5. Cron de retention y warning emails (#181)

> El cron diario corre la purga de tenants y envía warning emails a 7 días de la purga. Si esto se rompe se pueden perder datos de clientes.

- [ ] En Vercel → tu proyecto `vetify-prod` → Cron Jobs → revisar última ejecución de `/api/cron/daily-tasks`.
- [ ] Status debe ser **200 OK** y duración razonable (< 30s típico).
- [ ] Si hubo errores en la última ejecución: revisar logs y arreglar antes de cerrar el deploy.

---

## 6. Sentry post-deploy

> Filtro general buscando regresiones del release.

- [ ] Sentry → Issues → filtro `release:v$VERSION firstSeen:-2h` (ajustar al tag de release real).
- [ ] Idealmente 0 nuevos issues de severidad `error` o `fatal`.
- [ ] Si hay nuevos issues, evaluar:
  - ¿Es regresión del release o problema preexistente que apareció con tráfico nuevo?
  - ¿Afecta a usuarios reales o solo bots?
- [ ] Cualquier issue nuevo en `transaction:/api/stripe/webhook`, `transaction:/api/onboarding`, o `transaction:/api/cron/daily-tasks` es **bloqueante**.

---

## Cierre

- [ ] Todos los puntos arriba ✓
- [ ] `pnpm test:post-deploy` (capa automática) ✓
- [ ] Si se ejecutó capa local autenticada: `pnpm test:post-deploy --with-local` ✓

**Resultado del deploy**: ☐ APROBADO ☐ ROLLBACK NECESARIO

Notas:

```
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
```
