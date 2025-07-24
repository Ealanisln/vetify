---
title: "🌍 Environment Configuration Guide"
description: "Esta guía te ayuda a configurar las variables de entorno para diferentes entornos de desarrollo y de..."
category: "Getting Started"
tags: ["typescript", "whatsapp", "n8n", "vetify"]
order: 3
---

# 🌍 Environment Configuration Guide

Esta guía te ayuda a configurar las variables de entorno para diferentes entornos de desarrollo y despliegue.

## 📋 Resumen de Configuración Actual

Tu proyecto está configurado para trabajar con dos entornos principales:

### 🏠 Local Development (`localhost:3000`)
- Para desarrollo local en tu máquina
- URLs apuntan a `http://localhost:3000`
- Ideal para desarrollo y pruebas locales

### 🚀 Development Deployment (`development.vetify.pro`)
- Para el entorno de desarrollo/staging
- URLs apuntan a `https://development.vetify.pro`
- Configurado para Kinde Authentication en producción

## 🔧 Configuración Automática

Hemos creado un script que te permite cambiar fácilmente entre configuraciones:

### Ver configuración actual:
```bash
# Con pnpm (recomendado para tu proyecto)
pnpm env:show

# Con npm
npm run env:show
```

### Cambiar a localhost:3000:
```bash
# Con pnpm
pnpm env:localhost

# Con npm
npm run env:localhost
```

### Cambiar a development.vetify.pro:
```bash
# Con pnpm
pnpm env:development

# Con npm
npm run env:development
```

### Ver ayuda:
```bash
# Con pnpm
pnpm env:help

# Con npm
npm run env:help
```

## 📝 Variables de Entorno Principales

### 🔐 Kinde Authentication
Las siguientes variables cambian según el entorno:

**Para localhost:3000:**
```env
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard
```

**Para development.vetify.pro:**
```env
KINDE_SITE_URL=https://development.vetify.pro
KINDE_POST_LOGOUT_REDIRECT_URL=https://development.vetify.pro
KINDE_POST_LOGIN_REDIRECT_URL=https://development.vetify.pro/dashboard
```

### 🌐 App URLs
**Para localhost:3000:**
```env
VETIFY_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Para development.vetify.pro:**
```env
VETIFY_API_URL=https://development.vetify.pro
NEXT_PUBLIC_APP_URL=https://development.vetify.pro
NEXT_PUBLIC_BASE_URL=https://development.vetify.pro
```

## 🔄 Flujo de Trabajo Recomendado

### Para Desarrollo Local:
```bash
# Con pnpm (recomendado)
pnpm env:localhost
pnpm dev

# Con npm
npm run env:localhost
npm run dev
```

### Para Testing en Development:
```bash
# Con pnpm
pnpm env:development
pnpm build
# Deploy to development.vetify.pro

# Con npm
npm run env:development
npm run build
# Deploy to development.vetify.pro
```

### Volver a Local:
```bash
# Con pnpm
pnpm env:localhost
# Reinicia el servidor de desarrollo

# Con npm
npm run env:localhost
# Reinicia el servidor de desarrollo
```

## 🛡️ Seguridad y Backups

- El script automáticamente crea un backup en `.env.local.backup` antes de hacer cambios
- Nunca commitees archivos `.env*` al repositorio
- Las credenciales sensibles (tokens, secrets) se mantienen iguales en ambos entornos

## 🔍 Variables que NO Cambian

Estas variables permanecen iguales independientemente del entorno:

```env
# Database
DATABASE_URL=...
DIRECT_URL=...

# Kinde Credentials (same for both environments)
KINDE_CLIENT_ID=...
KINDE_CLIENT_SECRET=...
KINDE_ISSUER_URL=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# N8N
N8N_WEBHOOK_URL=...
N8N_API_KEY=...

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...

# Facebook/Meta
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

## 🚨 Configuración de Kinde

### En el Dashboard de Kinde:

1. **Allowed callback URLs:**
   - `http://localhost:3000/api/auth/kinde_callback`
   - `https://development.vetify.pro/api/auth/kinde_callback`

2. **Allowed logout redirect URLs:**
   - `http://localhost:3000`
   - `https://development.vetify.pro`

3. **Allowed origins:**
   - `http://localhost:3000`
   - `https://development.vetify.pro`

## 🔧 Troubleshooting

### Error: "Invalid redirect URI"
- Verifica que las URLs en Kinde coincidan con tu configuración actual
- Ejecuta `node scripts/env-config.js show` para ver la configuración actual

### Error: "CORS issues"
- Asegúrate de que las URLs en `NEXT_PUBLIC_APP_URL` coincidan con el entorno actual

### Error: "Authentication failed"
- Verifica que `KINDE_SITE_URL` esté configurado correctamente para tu entorno

## 📚 TypeScript Support

Hemos incluido definiciones de tipos TypeScript en `src/types/env.d.ts` para mejor autocompletado y verificación de tipos.

## 🎯 Next Steps

1. **Configurar Kinde URLs:** Asegúrate de que tu aplicación Kinde tenga configuradas ambas URLs
2. **Testing:** Prueba la autenticación en ambos entornos
3. **CI/CD:** Considera automatizar el cambio de configuración en tu pipeline de deployment 

---

**Need help?** Check our [Troubleshooting Guide](../troubleshooting/common-issues.md) or [contact support](../../README.md#-support).