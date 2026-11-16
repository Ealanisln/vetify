# Validación después de cada despliegue

Vetify no tiene ambiente de QA. La validación se hace contra producción, en `https://www.vetify.pro`, después de cada despliegue a `main`. Un despliegue no se da por cerrado hasta que pasan las cuatro capas.

| Capa | Qué valida | Cómo corre | Escribe datos |
|---|---|---|---|
| 1. Smoke público | Versión desplegada, salud, páginas públicas, rutas protegidas, regresiones recientes | Sola, con cada deploy de producción | No |
| 2. Flujo de clínica | Entrar, crear cliente, mascota y cita, horarios, servicios y reserva pública | Sola, con cada deploy de producción | Sí, solo en la clínica de QA |
| 3. Revisión exploratoria | Lo que cambió en el release, visto en un navegador real | A mano, con `/qa-only` | Sí, solo en la clínica de QA |
| 4. Checklist manual | Registro real, Stripe en vivo, cron y Sentry | A mano | Según el punto |

## Capa 1: smoke público

El workflow `.github/workflows/post-deploy.yml` se dispara cuando Vercel reporta un deploy de producción exitoso. Hace dos cosas:

1. Espera a que `/api/version` responda con la versión del `package.json` desplegado (hasta 3 minutos).
2. Corre `pnpm test:post-deploy:prod`: las pruebas `@p0` de `tests/e2e/weekly/weekly.smoke.spec.ts` que no necesitan sesión.

Si falla, abre un issue "Post-deploy validation failed for vX.Y.Z" con la liga a la corrida y sube el reporte de Playwright como artefacto.

Para correrla a mano:

```bash
pnpm test:post-deploy:prod          # desde tu máquina
gh workflow run post-deploy.yml     # en GitHub Actions
```

## Capa 2: flujo de clínica

**Estado: pendiente.** Necesita una clínica de QA en producción y un usuario que pueda iniciar sesión sin intervención humana.

Reglas para cuando exista:

- Todo lo que se cree vive en la clínica de QA y lleva el prefijo `QA-` más el identificador de la corrida.
- Los clientes de prueba usan `delivered@resend.dev` como correo, para no rebotar ni escribirle a nadie real.
- La corrida borra lo que creó, pase o falle.
- Nunca se usa una clínica real ni se tocan sus datos.

## Capa 3: revisión exploratoria

Las pruebas automáticas solo detectan lo que afirman. Esta capa busca lo que nadie escribió como prueba: pantallas rotas, textos mal, errores en la consola, flujos que se atoran.

Después de cada release, con la sesión de la clínica de QA:

1. Leer la entrada del release en `CHANGELOG.md` y listar las pantallas que cambiaron.
2. Correr `/qa-only` contra `https://www.vetify.pro`, empezando por esas pantallas y siguiendo con los flujos base: clientes, mascotas, citas, historia clínica y configuración.
3. Revisar cada pantalla en escritorio y en móvil, y en modo claro y oscuro.
4. Anotar lo que salga en `docs/PENDIENTES.md`. Lo que rompa un flujo base se arregla antes de cerrar el despliegue.

## Capa 4: checklist manual

`docs/post-deploy-manual-checklist.md`. Los puntos de Stripe solo aplican si el release tocó cobros.

## Si algo falla

1. Decidir si rompe un flujo base (entrar, clientes, mascotas, citas, cobro). Si lo rompe, regresar al deploy anterior desde Vercel (Deployments → el anterior → Promote to Production) y arreglar después.
2. Si no lo rompe, abrir el fix como PR a `development` y anotarlo en `docs/PENDIENTES.md`.
3. Cerrar el issue que abrió el workflow cuando la corrida vuelva a pasar.
