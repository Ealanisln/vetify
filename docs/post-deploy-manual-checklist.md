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
- [ ] Completar Kinde con email throwaway (ej. `ealanisln+v$VERSION@gmail.com` o un alias temporal con `+`).
- [ ] Después del callback, debería redirigir a `/onboarding`.
- [ ] Completar nombre de clínica + slug y enviar.
- [ ] Aterriza en `/dashboard` con banner de trial activo.
- [ ] (Opcional, vía Supabase MCP) verificar en `Tenant`:
  - `isTrialPeriod = true`
  - `trialEndsAt` ~30 días en el futuro
  - `subscriptionStatus = 'TRIALING'` (o el estado equivalente)

**Si falla**: revisar logs de `/api/onboarding` y handler de `/api/auth/[kindeAuth]` en Vercel.

---

## 2. Stripe checkout (en development.vetify.pro)

> Valida la **lógica de la aplicación**: que el flujo de checkout, redirects y sincronización post-webhook funcionan en el código que se desplegó. **No garantiza que funcione en producción** (ver paso 3).

- [ ] Crear o usar un tenant de prueba **en dev** (NO el del paso 1, que vive en la DB de producción), e ir a `https://development.vetify.pro/dashboard/settings?tab=subscription` o `/precios`.
- [ ] Elegir un plan (BÁSICO o PROFESIONAL) y completar checkout con tarjeta de **test mode** de Stripe (`4242 4242 4242 4242`, fecha futura, CVC cualquiera).
- [ ] Después del pago, redirige al dashboard con confirmación.
- [ ] (Vía Supabase MCP, branch de dev) verificar en `Tenant`:
  - `stripeCustomerId` poblado
  - `stripeSubscriptionId` poblado
  - `subscriptionStatus = 'ACTIVE'`
- [ ] (Vía Supabase MCP, branch de dev) verificar que existe una fila en `TenantSubscription` para ese tenant.

**Si falla en dev**: hay regresión en el código. Revisar logs de `/api/stripe/checkout` y `/api/stripe/webhook` en Vercel.

> ℹ️ **Prerrequisito**: este flujo asume que `development.vetify.pro` tiene su **propio webhook de Stripe en test mode** apuntando a `https://development.vetify.pro/api/stripe/webhook`. Si ese webhook no existe o no está suscrito a los eventos, `subscriptionStatus` nunca pasará a `ACTIVE` — y eso es config de dev, NO una regresión del código.

> ⚠️ **Pasar este test en dev NO confirma que prod funcione**. Las claves de Stripe (test vs live), el webhook signing secret, los price IDs y los eventos suscritos son **objetos distintos** entre los dos entornos. El paso 3 abajo cubre prod específicamente.

---

## 3. Stripe en producción real (sin meter datos basura)

> Esto valida que la **configuración de Stripe en `vetify-prod`** está correcta — claves live, webhook signing secret, eventos suscritos, price IDs. Es la única forma de detectar errores que solo aparecen en prod.

### 3a. Verificar el webhook live (sin tocar nada)

- [ ] Stripe Dashboard → modo **Live** (no test) → Developers → Webhooks → endpoint que apunta a `https://www.vetify.pro/api/stripe/webhook`.
- [ ] Último evento `checkout.session.completed` (de un usuario real) con status **Succeeded** (200).
- [ ] Último `customer.subscription.updated` también **Succeeded**.
- [ ] Sin eventos en **Failed** las últimas 24h.
- [ ] Lista de eventos suscritos coincide con lo que el handler espera (mínimo: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`).

### 3b. Verificar env vars de Stripe en Vercel prod

- [ ] Vercel → `vetify-prod` → Settings → Environment Variables → Production scope:
  - `STRIPE_SECRET_KEY` empieza con `sk_live_`
  - `STRIPE_WEBHOOK_SECRET` empieza con `whsec_`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` empieza con `pk_live_`
- [ ] Localmente: `pnpm stripe:verify` confirma que los price IDs existen en modo live.

### 3c. (Opcional pero recomendado) Test E2E real con refund inmediato

> Si hubo cambios en el handler de webhook o en el flujo de checkout, vale la pena hacer una corrida real.

- [ ] Crear tenant nuevo en `https://www.vetify.pro` con email throwaway.
- [ ] Completar checkout con **tu propia tarjeta real** (NO la 4242 — esa es solo de test mode).
- [ ] Verificar que `Tenant.subscriptionStatus='ACTIVE'` en DB de prod (Supabase MCP).
- [ ] Inmediatamente: Stripe Dashboard live → encontrar el charge → **Refund full**.
- [ ] Cancelar la suscripción desde Stripe Dashboard.
- [ ] (Opcional) Borrar el tenant de prueba desde admin.

**Si falla solo en prod (no en dev)**: el problema está en configuración (env vars, price IDs, webhook secret) o en algo cache-dependiente, no en el código. Revisar Sentry filtrando por `transaction:/api/stripe/webhook` y comparar el último evento Failed.

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
