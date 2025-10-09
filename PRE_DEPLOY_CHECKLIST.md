# ✅ Pre-Deployment Checklist - Vetify

## 🎯 Antes de Hacer Deploy a Producción

### 1. Tests Críticos ⚠️ OBLIGATORIO

```bash
# Ejecutar tests críticos
pnpm test:critical

# O ejecutar pre-deploy completo (tests + build)
pnpm test:pre-deploy
```

**Todos deben pasar:**
- [ ] ✅ Trial Activation Tests
- [ ] ✅ Multi-Tenancy Data Isolation
- [ ] ✅ Security Tests
- [ ] ✅ Authentication Tests

### 2. Build Exitoso ⚠️ OBLIGATORIO

```bash
pnpm build
```

- [ ] Build completa sin errores
- [ ] No hay TypeScript errors críticos
- [ ] No hay ESLint errors bloqueantes
- [ ] Assets se copian correctamente

### 3. Variables de Entorno ⚠️ OBLIGATORIO

- [ ] Todas las env vars están en Vercel
- [ ] DATABASE_URL apunta a producción
- [ ] KINDE_* credentials son de producción
- [ ] STRIPE_* keys son de producción (live, no test)
- [ ] NEXT_PUBLIC_* vars están correctas
- [ ] Secrets están en Vercel Secrets (no en .env)

```bash
# Verificar env vars
pnpm vercel:env:prod
```

### 4. Base de Datos 🗄️ OBLIGATORIO

- [ ] Migraciones aplicadas a producción
- [ ] Backup de base de datos tomado
- [ ] Conexión a BD probada
- [ ] Índices críticos creados

```bash
# Aplicar migraciones
pnpm db:migrate:production
```

### 5. Stripe Configuration 💳 OBLIGATORIO

```bash
# Verificar setup de Stripe
pnpm stripe:verify

# Verificar productos y precios
pnpm pricing:sync
```

- [ ] Productos creados en Stripe (live mode)
- [ ] Precios configurados correctamente
- [ ] Webhooks configurados en Stripe Dashboard
- [ ] Webhook endpoint es HTTPS
- [ ] Webhook secret configurado en env vars

**Webhooks requeridos:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 6. Security Checklist 🔐 OBLIGATORIO

- [ ] Rate limiting configurado (Upstash Redis)
- [ ] CORS configurado correctamente
- [ ] Security headers aplicados
- [ ] No hay secrets hardcodeados en código
- [ ] `.env` no está en Git
- [ ] API keys tienen restricciones apropiadas
- [ ] Audit logging activado

```bash
# Test security
pnpm test:security
```

### 7. Performance ⚡ RECOMENDADO

- [ ] Images optimizadas (< 200KB)
- [ ] Hero images tienen formato optimizado
- [ ] Fonts pre-cargados
- [ ] CSS critical inlined
- [ ] Database queries optimizadas

### 8. Funcionalidad Core 🎯 OBLIGATORIO

Probar manualmente:

- [ ] Landing page carga correctamente
- [ ] Sign up funciona (crear cuenta nueva)
- [ ] Trial se activa automáticamente
- [ ] Dashboard muestra "Periodo de Prueba"
- [ ] Usuario puede crear cliente
- [ ] Usuario puede crear mascota
- [ ] Usuario puede agendar cita
- [ ] Logout funciona

### 9. Email & Comunicaciones 📧 RECOMENDADO

- [ ] Emails de bienvenida configurados
- [ ] Templates de email probados
- [ ] SMTP/Email provider configurado
- [ ] Email "From" address verificado

### 10. Monitoring & Logging 📊 OBLIGATORIO

- [ ] Sentry configurado con DSN de producción
- [ ] Error tracking funcionando
- [ ] Performance monitoring activado
- [ ] Alerts configurados para errores críticos

```bash
# Verificar Sentry
pnpm sentry:status
```

### 11. Domain & DNS 🌐 OBLIGATORIO

- [ ] Dominio configurado en Vercel
- [ ] DNS records apuntando correctamente
- [ ] SSL certificate auto-renovación activada
- [ ] WWW redirect configurado (si aplica)

### 12. Backup & Recovery 💾 OBLIGATORIO

- [ ] Backup automático de BD configurado
- [ ] Procedimiento de rollback documentado
- [ ] Backup pre-deploy tomado
- [ ] Plan de recuperación de desastres definido

### 13. Documentation 📚 RECOMENDADO

- [ ] README.md actualizado
- [ ] API docs actualizadas (si aplica)
- [ ] Changelog actualizado
- [ ] Runbook de producción creado

### 14. Team Notification 👥 RECOMENDADO

- [ ] Equipo notificado del deploy
- [ ] Ventana de mantenimiento comunicada (si aplica)
- [ ] Plan de rollback comunicado
- [ ] Contact person asignado para issues

## 🚀 Deployment Commands

### Opción 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Opción 2: Deploy via Git Push
```bash
# Push to main branch
git push origin main

# Vercel auto-deploys from main
```

### Opción 3: Deploy via Vercel Dashboard
1. Go to Vercel Dashboard
2. Select project
3. Click "Deploy"
4. Select branch (main)
5. Confirm deployment

## 📋 Post-Deployment Verification

### Inmediatamente después del deploy (primeros 5 minutos):

```bash
# Health check
pnpm health:check
```

- [ ] Site carga en producción
- [ ] No hay errores 500 en logs
- [ ] Database conectada correctamente
- [ ] Authentication funciona
- [ ] Puede crear nuevo usuario

### Primera hora:

- [ ] Monitoring dashboard (Sentry) sin alertas críticas
- [ ] No hay spike de errores
- [ ] Performance metrics normales
- [ ] Webhooks de Stripe llegando

### Primeras 24 horas:

- [ ] Al menos 1 signup exitoso
- [ ] Trials activándose correctamente
- [ ] No errores reportados por usuarios
- [ ] Emails enviándose correctamente
- [ ] Payments processing (si hay subscripciones)

## 🆘 Rollback Procedure

Si algo sale mal:

```bash
# Opción 1: Rollback via Vercel CLI
vercel rollback

# Opción 2: Revert commit y re-deploy
git revert HEAD
git push origin main

# Opción 3: Via Vercel Dashboard
# Deployments > Previous deployment > Promote to Production
```

## 📞 Support Contacts

**Durante el deploy:**
- [ ] Tener acceso a Vercel Dashboard
- [ ] Tener acceso a Database admin
- [ ] Tener acceso a Stripe Dashboard
- [ ] Tener acceso a Sentry
- [ ] Tener backup de .env

## ✅ Final Check

Antes de hacer click en "Deploy":

```bash
# Run pre-deploy check
pnpm deploy:check
```

- [ ] Todos los tests críticos pasan
- [ ] Build exitoso
- [ ] Env vars verificadas
- [ ] Backup tomado
- [ ] Equipo notificado
- [ ] Rollback plan listo

## 🎉 Si todo está ✅, estás listo para deploy!

```bash
# Last command before deploy
pnpm test:pre-deploy

# If all pass:
vercel --prod
```

---

**Recuerda**: Es mejor retrasar un deploy que deployar con problemas.

**"Deploy fast, but deploy safe."** 🚀
