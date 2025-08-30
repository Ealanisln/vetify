# 🚀 Guía de Deploy para Producción - Vetify

## 📋 Resumen del Proyecto

- **Nombre**: Vetify - Sistema de Gestión Veterinaria
- **Tecnología**: Next.js 15 + TypeScript + Prisma + Supabase
- **Infraestructura**: Vercel (Frontend) + Supabase (Base de Datos)
- **Estado**: MVP 100% completo y listo para producción

## 🔒 Problemas de Seguridad Críticos

⚠️ **IMPORTANTE**: Antes del deploy, debes solucionar problemas de seguridad en la base de datos:

```bash
# Habilitar RLS (Row Level Security) en todas las tablas
pnpm deploy:security:fix
```

## 🚀 Pasos para Deploy en Producción

### 1. **Preparación de Variables de Entorno**

#### En Vercel Dashboard:
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Crea un nuevo proyecto o conecta tu repositorio existente
3. En **Settings → Environment Variables**, agrega todas las variables:

```bash
# Generar variables para Vercel
pnpm vercel:env:prod
```

#### Variables Críticas (MARCAR PARA PRODUCCIÓN):
- `DATABASE_URL`
- `DIRECT_URL`
- `KINDE_CLIENT_ID`
- `KINDE_CLIENT_SECRET`
- `KINDE_ISSUER_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. **Verificación de Seguridad de Base de Datos**

```bash
# Ejecutar script de seguridad
pnpm deploy:security:fix

# Aplicar migración de seguridad
pnpm db:migrate:production
```

### 3. **Verificación Pre-Deploy**

```bash
# Verificar estado del MVP
pnpm mvp:checklist

# Verificar salud del sistema
pnpm health:check

# Ejecutar tests
pnpm test:all
```

### 4. **Deploy Automático (Recomendado)**

```bash
# Ejecutar deploy completo
pnpm deploy:production
```

Este script ejecutará automáticamente:
- ✅ Verificación de variables de entorno
- ✅ Verificación de seguridad de base de datos
- ✅ Verificación del proceso de build
- ✅ Ejecución de tests
- ✅ Migración de base de datos
- ✅ Build de producción
- ✅ Deploy a Vercel

### 5. **Deploy Manual (Alternativo)**

Si prefieres hacer el deploy manualmente:

```bash
# 1. Generar cliente Prisma
pnpm prisma generate

# 2. Aplicar migraciones
pnpm db:migrate:production

# 3. Build de producción
pnpm build:production

# 4. Deploy a Vercel
vercel --prod
```

## 🔧 Configuración de Vercel

### Instalación de Vercel CLI:
```bash
npm i -g vercel
```

### Login y Configuración:
```bash
# Login a Vercel
vercel login

# Vincular proyecto
vercel link

# Configurar variables de entorno
vercel env add DATABASE_URL
vercel env add KINDE_CLIENT_ID
# ... (repetir para todas las variables)
```

### Configuración de Dominio:
1. En Vercel Dashboard, ve a **Settings → Domains**
2. Agrega tu dominio personalizado (ej: `vetify.pro`)
3. Configura los registros DNS según las instrucciones de Vercel

## 🗄️ Configuración de Supabase

### Verificar Estado del Proyecto:
```bash
# Usar el MCP de Supabase para verificar
# Proyecto ID: rqxhmhplxeiprzprobdb
# URL: https://rqxhmhplxeiprzprobdb.supabase.co
```

### Configuraciones de Seguridad:
- ✅ RLS habilitado en todas las tablas
- ✅ Políticas de acceso configuradas
- ✅ Conexiones SSL habilitadas
- ✅ Backups automáticos configurados

## 📊 Monitoreo Post-Deploy

### 1. **Sentry (Errores y Performance)**
- Monitorear errores en tiempo real
- Verificar performance de la aplicación
- Configurar alertas para errores críticos

### 2. **Vercel Analytics**
- Monitorear performance de la aplicación
- Verificar métricas de Core Web Vitals
- Analizar comportamiento de usuarios

### 3. **Supabase Dashboard**
- Monitorear uso de la base de datos
- Verificar queries lentas
- Revisar logs de autenticación

### 4. **Health Checks**
```bash
# Verificar salud del sistema
pnpm health:check

# Verificar estado del MVP
pnpm mvp:checklist
```

## 🚨 Troubleshooting Común

### Error: "Database connection failed"
- Verificar `DATABASE_URL` en Vercel
- Confirmar que Supabase esté activo
- Verificar configuración de red

### Error: "Authentication failed"
- Verificar variables de Kinde en Vercel
- Confirmar URLs de redirección
- Verificar configuración de Supabase Auth

### Error: "Build failed"
- Verificar dependencias en `package.json`
- Confirmar que TypeScript compile correctamente
- Verificar configuración de Next.js

### Error: "RLS policy violation"
- Ejecutar `pnpm deploy:security:fix`
- Aplicar migraciones de seguridad
- Verificar políticas de RLS

## 📞 Soporte y Contacto

### En caso de problemas:
1. Revisar logs en Vercel Dashboard
2. Verificar logs en Supabase Dashboard
3. Revisar Sentry para errores
4. Ejecutar `pnpm health:check`

### Recursos útiles:
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)

## 🎯 Checklist Final de Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] RLS habilitado en todas las tablas
- [ ] Migraciones aplicadas
- [ ] Tests pasando
- [ ] Build de producción exitoso
- [ ] Deploy a Vercel completado
- [ ] Dominio configurado
- [ ] SSL configurado
- [ ] Monitoreo configurado
- [ ] Health checks pasando

## 🚀 ¡Listo para Producción!

Una vez completados todos los pasos, tu aplicación estará disponible en:
- **URL de Producción**: https://vetify.pro (o tu dominio personalizado)
- **Dashboard de Vercel**: Para monitoreo y analytics
- **Dashboard de Supabase**: Para gestión de base de datos
- **Sentry**: Para monitoreo de errores

¡Felicitaciones! 🎉 Tu aplicación Vetify está ahora en producción.
