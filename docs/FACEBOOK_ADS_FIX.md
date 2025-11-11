# Fix: Redirección a development.vetify.pro en Anuncios de Facebook

## Problema Identificado

Cuando se agrega la URL `www.vetify.pro` en un anuncio de Facebook, la página está redireccionando a `development.vetify.pro` en lugar de mantenerse en el dominio de producción.

## Causa Raíz

El problema se encuentra en los **meta tags de Open Graph** que Facebook lee cuando rastrea la URL. Al inspeccionar el HTML de `www.vetify.pro`, encontramos:

```html
<link rel="canonical" href="https://development.vetify.pro"/>
<meta property="og:url" content="https://development.vetify.pro"/>
<meta property="og:image" content="https://development.vetify.pro/api/og"/>
<meta name="twitter:image" content="https://development.vetify.pro/api/og"/>
```

Estos meta tags están configurados con la URL de development, lo que hace que Facebook interprete que la URL canónica del sitio es `development.vetify.pro`.

### ¿Por qué está pasando esto?

La variable de entorno `NEXT_PUBLIC_BASE_URL` en el proyecto de Vercel para producción está configurada **incorrectamente** con el valor de development:

```env
# ❌ INCORRECTO (valor actual en producción)
NEXT_PUBLIC_BASE_URL=https://development.vetify.pro

# ✅ CORRECTO (valor que debe tener)
NEXT_PUBLIC_BASE_URL=https://www.vetify.pro
```

## Solución

### Paso 1: Acceder al Dashboard de Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto **Vetify**
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Actualizar la Variable de Entorno

Busca la variable `NEXT_PUBLIC_BASE_URL` y actualízala:

1. **Encuentra** `NEXT_PUBLIC_BASE_URL` en la lista de variables
2. **Edita** el valor para el ambiente **Production**
3. **Cambia** de `https://development.vetify.pro` a:
   ```
   https://www.vetify.pro
   ```
   O simplemente:
   ```
   https://vetify.pro
   ```
4. **Guarda** los cambios

### Paso 3: Verificar Otras Variables Relacionadas

Asegúrate de que estas variables también estén correctamente configuradas para **Production**:

| Variable | Valor para Production |
|----------|----------------------|
| `NEXT_PUBLIC_BASE_URL` | `https://www.vetify.pro` |
| `NEXT_PUBLIC_APP_URL` | `https://www.vetify.pro` |
| `VETIFY_API_URL` | `https://www.vetify.pro` |
| `KINDE_SITE_URL` | `https://www.vetify.pro` |
| `KINDE_POST_LOGOUT_REDIRECT_URL` | `https://www.vetify.pro` |
| `KINDE_POST_LOGIN_REDIRECT_URL` | `https://www.vetify.pro/dashboard` |

### Paso 4: Redeploy del Sitio

Después de actualizar las variables:

1. Ve a la pestaña **Deployments** en Vercel
2. Selecciona el último deployment de **Production**
3. Haz clic en los tres puntos (⋯) y selecciona **Redeploy**
4. Marca la opción **"Use existing Build Cache"** para acelerar el proceso
5. Haz clic en **Redeploy**

El redeploy tomará aproximadamente 2-3 minutos.

### Paso 5: Verificar la Corrección

Una vez que el deployment esté completo, verifica que los meta tags estén correctos:

```bash
curl -s https://www.vetify.pro | grep -i "og:url\|canonical"
```

Deberías ver:
```html
<link rel="canonical" href="https://www.vetify.pro"/>
<meta property="og:url" content="https://www.vetify.pro"/>
```

### Paso 6: Limpiar la Caché de Facebook

Facebook cachea los meta tags de las URLs por un período de tiempo. Para forzar una actualización:

1. Ve a [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Ingresa la URL: `https://www.vetify.pro`
3. Haz clic en **"Scrape Again"** (Volver a rastrear)
4. Verifica que los meta tags mostrados ahora tengan la URL correcta

### Paso 7: Actualizar el Anuncio de Facebook

1. Ve a tu anuncio en Facebook Ads Manager
2. **Edita** el anuncio
3. **Elimina** temporalmente la URL del botón
4. **Guarda** el anuncio
5. **Edita** nuevamente el anuncio
6. **Vuelve a agregar** la URL: `https://www.vetify.pro`
7. **Guarda** el anuncio

Esto forzará a Facebook a volver a rastrear la página con los meta tags actualizados.

## Código Relevante

El código que genera estos meta tags se encuentra en:

- **`src/lib/seo/config.ts`**: Función `getBaseUrl()` que lee `NEXT_PUBLIC_BASE_URL`
- **Todas las páginas**: Usan esta función para generar los meta tags de SEO y Open Graph

```typescript
// src/lib/seo/config.ts:4-14
export const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;  // ← Este es el valor que está mal
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};
```

## Prevención Futura

Para evitar este problema en el futuro:

1. **Usa el script de verificación** antes de cualquier deploy importante:
   ```bash
   pnpm vercel:env:prod
   ```
   Esto generará las variables correctas para producción.

2. **Verifica siempre** los meta tags después de un deploy a producción:
   ```bash
   curl -s https://www.vetify.pro | grep -i "og:url\|canonical"
   ```

3. **Documenta** cualquier cambio de variables de entorno en el canal de comunicación del equipo.

## Checklist de Verificación

- [ ] Variable `NEXT_PUBLIC_BASE_URL` actualizada en Vercel (Production)
- [ ] Variables relacionadas verificadas (KINDE_*, NEXT_PUBLIC_APP_URL, etc.)
- [ ] Redeploy realizado exitosamente
- [ ] Meta tags verificados con curl
- [ ] Facebook Sharing Debugger ejecutado
- [ ] Anuncio de Facebook actualizado
- [ ] Anuncio probado (hacer clic en el botón y verificar que no redirija)

## Contactos de Soporte

Si necesitas ayuda adicional:
- **Vercel Support**: https://vercel.com/support
- **Facebook Business Support**: https://business.facebook.com/help
- **Documentación Vetify**: `/gitbook-docs/deployment/vercel-setup.md`

---

**Fecha de identificación**: 2025-11-11
**Estado**: ✅ Solución documentada - Pendiente de aplicar en Vercel
