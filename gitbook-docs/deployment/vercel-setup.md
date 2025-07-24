# 🚀 Vercel Deployment Guide

Esta guía te explica cómo configurar las variables de entorno en Vercel para desplegar tu aplicación Vetify.

## 📋 Diferencias entre Local y Vercel

### 🏠 Desarrollo Local
- Variables en archivo `.env.local`
- Se pueden cambiar fácilmente con scripts
- No se commitean al repositorio

### ☁️ Vercel (Producción/Staging)
- Variables configuradas en el Dashboard de Vercel
- Se configuran una vez por proyecto
- Seguras y encriptadas

## 🔧 Configuración Automática para Vercel

Hemos creado scripts que generan automáticamente las variables correctas para Vercel:

### Para development.vetify.pro:
```bash
pnpm vercel:env:dev
```

### Para producción (vetify.pro):
```bash
pnpm vercel:env:prod
```

### Ver ayuda:
```bash
pnpm vercel:env:help
```

## 📝 Proceso de Configuración en Vercel

### 1. Generar Variables
```bash
# Para development.vetify.pro
pnpm vercel:env:dev

# Para producción
pnpm vercel:env:prod
```

### 2. Ir al Dashboard de Vercel
1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. **Settings** → **Environment Variables**

### 3. Agregar Variables Una por Una
El script te mostrará cada variable con su valor. Por ejemplo:

```
✅ KINDE_CLIENT_ID
   Value: 0db7d44f29414510b2539193d16311f9
```

En Vercel:
- **Name**: `KINDE_CLIENT_ID`
- **Value**: `0db7d44f29414510b2539193d16311f9`
- **Environments**: Selecciona según necesites:
  - ✅ **Production** (para vetify.pro)
  - ✅ **Preview** (para development.vetify.pro)

### 4. Variables Críticas para Configurar

#### 🔐 Autenticación (Kinde)
```env
KINDE_CLIENT_ID=tu_client_id
KINDE_CLIENT_SECRET=tu_client_secret
KINDE_ISSUER_URL=https://alanisdev.kinde.com
KINDE_SITE_URL=https://development.vetify.pro  # o https://vetify.pro
KINDE_POST_LOGOUT_REDIRECT_URL=https://development.vetify.pro
KINDE_POST_LOGIN_REDIRECT_URL=https://development.vetify.pro/dashboard
```

#### 🗄️ Base de Datos
```env
DATABASE_URL=tu_database_url
DIRECT_URL=tu_direct_database_url
```

#### 📱 WhatsApp & N8N
```env
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token
N8N_WEBHOOK_URL=https://n8n.alanis.dev
N8N_API_KEY=tu_n8n_api_key
```

## 🎯 Configuración por Entorno

### 🧪 Development/Preview (development.vetify.pro)
- **Environment**: Preview
- **URLs**: `https://development.vetify.pro`
- **Uso**: Testing, staging, demos

### 🚀 Production (vetify.pro)
- **Environment**: Production  
- **URLs**: `https://vetify.pro`
- **Uso**: Aplicación en vivo

## 🔄 Flujo de Trabajo Completo

### 1. Desarrollo Local
```bash
# Configurar para localhost
pnpm env:localhost
pnpm dev
```

### 2. Deploy a Development
```bash
# Generar variables para Vercel
pnpm vercel:env:dev

# Configurar variables en Vercel Dashboard
# (copiar y pegar cada variable)

# Deploy automático via Git push
git push origin main
```

### 3. Deploy a Production
```bash
# Generar variables para producción
pnpm vercel:env:prod

# Configurar variables en Vercel Dashboard
# (Environment: Production)

# Deploy desde Vercel Dashboard o Git tag
```

## ⚠️ Variables que Cambian por Entorno

El script automáticamente ajusta estas variables según el entorno:

| Variable | Development | Production |
|----------|-------------|------------|
| `KINDE_SITE_URL` | `https://development.vetify.pro` | `https://vetify.pro` |
| `KINDE_POST_LOGOUT_REDIRECT_URL` | `https://development.vetify.pro` | `https://vetify.pro` |
| `KINDE_POST_LOGIN_REDIRECT_URL` | `https://development.vetify.pro/dashboard` | `https://vetify.pro/dashboard` |
| `VETIFY_API_URL` | `https://development.vetify.pro` | `https://vetify.pro` |
| `NEXT_PUBLIC_APP_URL` | `https://development.vetify.pro` | `https://vetify.pro` |
| `NEXT_PUBLIC_BASE_URL` | `https://development.vetify.pro` | `https://vetify.pro` |

## 🛡️ Seguridad

### ✅ Variables Seguras (Server-side)
Estas NO son visibles en el cliente:
- `KINDE_CLIENT_SECRET`
- `DATABASE_URL`
- `WHATSAPP_ACCESS_TOKEN`
- `N8N_API_KEY`
- `FACEBOOK_APP_SECRET`

### 👁️ Variables Públicas (Client-side)
Estas SÍ son visibles en el cliente (prefijo `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_N8N_WEBHOOK_URL`

## 🔧 Troubleshooting

### Error: "Environment variable not found"
1. Verifica que la variable esté configurada en Vercel
2. Asegúrate de que esté marcada para el entorno correcto (Production/Preview)
3. Redeploy el proyecto

### Error: "Invalid redirect URI" (Kinde)
1. Verifica las URLs en el Dashboard de Kinde
2. Asegúrate de que coincidan con las variables de Vercel
3. Agrega ambas URLs (development y production) en Kinde

### Error: "Database connection failed"
1. Verifica que `DATABASE_URL` y `DIRECT_URL` estén configuradas
2. Asegúrate de que la base de datos sea accesible desde Vercel
3. Considera usar connection pooling para producción

## 📚 Comandos de Referencia

```bash
# Scripts de entorno local
pnpm env:show          # Ver configuración actual
pnpm env:localhost     # Cambiar a localhost
pnpm env:development   # Cambiar a development.vetify.pro

# Scripts para Vercel
pnpm vercel:env        # Generar variables para development (default)
pnpm vercel:env:dev    # Generar variables para development.vetify.pro
pnpm vercel:env:prod   # Generar variables para vetify.pro
pnpm vercel:env:help   # Ver ayuda

# Desarrollo
pnpm dev               # Servidor local
pnpm build             # Build para producción
pnpm start             # Servidor de producción local
```

## 🎯 Checklist de Deployment

### Antes del Deploy:
- [ ] ✅ Variables generadas con `pnpm vercel:env:dev` o `pnpm vercel:env:prod`
- [ ] ✅ Todas las variables configuradas en Vercel Dashboard
- [ ] ✅ URLs de Kinde actualizadas para incluir el dominio de Vercel
- [ ] ✅ Base de datos accesible desde Vercel
- [ ] ✅ Webhooks de N8N configurados para el dominio correcto

### Después del Deploy:
- [ ] ✅ Autenticación funciona correctamente
- [ ] ✅ Base de datos se conecta sin errores
- [ ] ✅ WhatsApp webhooks reciben mensajes
- [ ] ✅ N8N workflows se ejecutan correctamente
- [ ] ✅ Variables públicas son accesibles en el cliente

¡Tu aplicación estará lista para producción! 🚀 