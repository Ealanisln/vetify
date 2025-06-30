# Sistema de Super Administradores - Vetify

Este documento explica cómo gestionar super administradores en Vetify.

## ¿Qué es un Super Administrador?

Un super administrador tiene acceso completo al panel de administración de Vetify (`/admin`) y puede:
- Ver y gestionar todas las clínicas (tenants)
- Suspender/activar clínicas
- Ver estadísticas del sistema
- Asignar otros super administradores
- Acceder a reportes globales

## Métodos de Asignación

Hay dos formas de ser super administrador:

1. **Por dominio de email**: Usuarios con email `@vetify.pro`, `@vetify.com` o `@alanis.dev`
2. **Por rol asignado**: Usuarios con el rol `SUPER_ADMIN` en la base de datos

## Cómo Asignar tu Primer Super Admin

### Opción 1: Usando el Script (Recomendado)

1. Asegúrate de haber iniciado sesión al menos una vez en la aplicación
2. Ejecuta el script con tu email:

```bash
node scripts/assign-super-admin.mjs tu@email.com
```

3. El script te confirmará si la asignación fue exitosa

### Opción 2: Listar Super Admins Existentes

```bash
node scripts/assign-super-admin.mjs --list
```

## Gestión desde el Panel de Admin

Una vez que tengas acceso al panel de admin (`/admin`), puedes gestionar otros super administradores usando la API:

### Asignar Super Admin via API

```bash
curl -X POST http://localhost:3000/api/admin/super-admins \
  -H "Content-Type: application/json" \
  -d '{"userIdOrEmail": "nuevo@admin.com"}'
```

### Listar Super Admins via API

```bash
curl http://localhost:3000/api/admin/super-admins
```

### Remover Super Admin via API

```bash
curl -X DELETE "http://localhost:3000/api/admin/super-admins?userIdOrEmail=admin@remover.com"
```

## Archivos Involucrados

- `src/lib/super-admin.ts` - Utilidades principales del sistema
- `src/app/api/admin/super-admins/route.ts` - API endpoints
- `scripts/assign-super-admin.mjs` - Script de línea de comandos
- `src/app/admin/layout.tsx` - Layout que requiere permisos de super admin

## Verificación de Permisos

El sistema verifica los permisos de super admin en el siguiente orden:

1. Verifica si el email termina en `@vetify.pro`, `@vetify.com` o `@alanis.dev`
2. Si no, verifica si el usuario tiene el rol `SUPER_ADMIN` asignado

## Seguridad

- Solo super administradores existentes pueden asignar nuevos super administradores
- Un super administrador no puede removerse a sí mismo
- Todos los cambios son registrados en logs
- El acceso al panel de admin requiere autenticación válida

## Solución de Problemas

### "Usuario no encontrado"
El usuario debe haber iniciado sesión al menos una vez para existir en la base de datos.

### "No tienes permisos"
Debes ser super administrador para gestionar otros super administradores. Usa el script inicial para asignar el primer super admin.

### "Ya existe un super administrador"
Si intentas usar `initializeFirstSuperAdmin()` y ya existen super admins, usa los métodos normales de asignación.

## Ejemplo de Uso Completo

```bash
# 1. Asignar tu primer super admin
node scripts/assign-super-admin.mjs tu@email.com

# 2. Verificar que funciona
node scripts/assign-super-admin.mjs --list

# 3. Acceder al panel
# Ve a http://localhost:3000/admin

# 4. Desde el panel puedes gestionar otros admins via API o interfaz
``` 