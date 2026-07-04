# Registro de Cambios

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

## [1.9.0] - 2026-07-03

### Agregado
- **Idempotencia en el webhook de Stripe (Fase B).** Nueva tabla `StripeWebhookEvent` (migración `7`) con el event id de Stripe como llave primaria, dando protección ante entregas duplicadas (at-least-once): los eventos redelivered se detectan por colisión en el INSERT y se omiten los efectos secundarios no idempotentes (comisiones de referidos, redención de promociones).
- **Logging estructurado y clasificación de errores en el webhook (Fases C y D).** Nuevo `src/lib/logger.ts` y `src/lib/payments/webhook-errors.ts`: los errores se clasifican como transitorios (responden 5xx para que Stripe reintente) o permanentes (responden 2xx y se registran), con llaves de idempotencia consistentes.
- **Health check de Stripe.** `GET /api/health/stripe` verifica conectividad con la API de Stripe, configuración de llaves/webhook secret y estado de la tabla de eventos.
- **Preflight de Stripe.** `scripts/stripe-preflight.mjs` valida la configuración de Stripe (llaves, productos, precios, webhook) antes de un deploy.

### Cambiado
- **Onboarding de un solo paso.** El registro ahora solo pide los datos de la clínica; la selección de plan se difiere al final del periodo de prueba. Motivado por un ~41% de abandono en el flujo de registro de dos pasos.

## [1.8.0] - 2026-06-02

### Seguridad
- **RLS hardening en producción.** Se habilitó Row Level Security en todas las tablas multi-tenant y se reemplazaron las políticas permisivas `USING (true)`. El advisor de seguridad de Supabase pasó de **15 ERRORs a 0**. La función `user_tenant_id()` ya no es ejecutable por los roles `anon`, `authenticated` ni `PUBLIC` (migraciones `1` y `5`). Las tablas de solo-service-role (`SecurityAuditLog`, `AdminAuditLog`, `_prisma_migrations`) quedan en default-deny (migraciones `2` y `6`).

### Cambiado
- **Rebaseline de migraciones de Prisma.** Las 21 migraciones históricas se consolidaron en un set canónico (`0_init` + migraciones RLS `1`–`6`), alineando el historial del repositorio con el estado real de la base de datos de producción.
- **Reset del entorno de desarrollo.** Dev se reconstruye desde el set canónico con datos de producción anonimizados vía `scripts/anonymize-dev.mjs` (limpieza de PII + rotación de secretos, con guard anti-producción por hostname).

### Documentación
- `docs/DB_RLS_AND_PG17_PLAN.md`: tracker de migraciones/RLS/PG17 reconciliado con el estado verificado de producción (Fase 2 completa; Fase 3 — upgrade a PostgreSQL 17 — pendiente).

## [1.7.2] - 2026-05-22

### Corregido
- **fix(middleware):** excluir `/api/version`, `/api/health` y `/api/cron/*` del matcher de Kinde. Sin esto, `withAuth` redirige esos endpoints a `/api/auth/login` con 307, lo que rompía el script `scripts/post-deploy.mjs` introducido en v1.7.0 y cualquier herramienta de monitoreo externo. Los cron routes ya tienen su propia auth vía `CRON_SECRET`; version/health son intencionalmente públicos.

## [1.7.1] - 2026-05-22

### Corregido
- **fix(csp):** agregar `https://glitchtip.alanis.dev` al `connect-src` en `next.config.js` (la CSP real de las respuestas de prod, no la de `src/lib/security/*` que solo es informativa). Sin este cambio, los errores client-side de Sentry SDK quedaban bloqueados por CSP al hacer el cutover de DSN. Hotfix posterior a v1.7.0.

## [1.7.0] - 2026-05-22

### Agregado
- **Migración de tracking de errores a GlitchTip self-hosted** ([#193](https://github.com/Ealanisln/vetify/pull/193))
  - Cambio del backend de telemetría a `glitchtip.alanis.dev` (compatible con la API de Sentry; el SDK `@sentry/nextjs` no cambia)
  - `next.config.js`: nueva opción `sentryUrl` (vía `SENTRY_URL`) para subida de source maps a GlitchTip
  - CSP `connect-src` extendido a `https://glitchtip.alanis.dev` en `security/index.ts` e `input-sanitization.ts` (`*.sentry.io` permanece durante la transición)
  - `.env.example` documenta `SENTRY_URL` y el formato del DSN de GlitchTip
- **Flujo de validación post-deploy** ([#192](https://github.com/Ealanisln/vetify/pull/192))
  - `scripts/post-deploy.mjs`: script automatizado de verificación post-deploy
  - `docs/post-deploy-manual-checklist.md`: checklist manual de validación
  - Smoke tests semanales E2E (`tests/e2e/weekly/weekly.smoke.spec.ts`) con configuración dedicada (`playwright.weekly.config.ts`)
  - Checklist de Stripe separado por entorno: lógica de app (dev) vs configuración de cuenta (prod)

### Corregido
- **fix(security):** reemplazar ejemplo de bearer token en OpenAPI spec para satisfacer GitGuardian ([#191](https://github.com/Ealanisln/vetify/pull/191))
- **test(e2e):** eliminar `waitForLoadState('networkidle')` flaky en pruebas responsive de `/actualizaciones`

### Documentación
- Documentar URL de producción (`https://www.vetify.pro`) y proyecto de Vercel en `CLAUDE.md`
- `.gitignore`: ignorar artefactos de `.gstack/`

## [1.6.0] - 2026-05-03

### Agregado
- **Sistema de Retención de Datos (90 días)**
  - Nuevos campos `retentionStartedAt`, `retentionExpiresAt`, `retentionWarningEmailSentAt` en `Tenant` con índice parcial
  - Webhook de Stripe activa/limpia el reloj de retención de 90 días al cancelar/reactivar suscripción
  - Job `purgeExpiredTenants` con transacción y re-chequeo, snapshot de auditoría antes de purgar
  - Email de aviso T-7 (`data-retention-warning`) integrado al cron de tareas diarias
  - Nueva migración Prisma `20260428000000_add_data_retention`
  - Cobertura de tests unitarios e integración para `purge`, `notify` y webhook de Stripe

### Corregido
- **fix(seo):** emitir un `<script>` por cada esquema JSON-LD en lugar de un array (Sentry VETIFY-NEXTJS-1K)
- **fix(db):** commitear archivo de migración `20260328000000_add_referral_system` que no se había incluido al mergear el feature de referidos; la migración ya estaba aplicada en prod y dev

### Documentación
- `docs/referral-pricing.md`: niveles recomendados de comisión y descuento del programa de referidos

## [1.5.0] - 2026-04-29

### Agregado
- **Sistema de Referidos**
  - Programa completo de socios y comisiones por referidos
  - Panel de administración en `/admin/referrals` con listas, detalle, conversiones y formularios
  - Endpoints `/api/admin/referrals/*` y redirect público `/api/ref/[code]`
  - Notificaciones por email (`referral-notifications`) y eventos en webhooks de Stripe + checkout + onboarding
  - Documentación: `docs/manual-referidos.md`, `docs/referral-system.md`, `docs/referral-pricing.md`
  - Migración Prisma `20260328000000_add_referral_system`

- **Emails de Ciclo de Vida del Trial**
  - Notificación automática cuando el trial está por vencer (≤3 días, cooldown 24h)
  - Notificación automática cuando el trial ha expirado (cooldown 7 días)
  - Nuevos templates de email: `trial-expiring` y `trial-expired`
  - Migración Prisma para enum values `TRIAL_EXPIRING` y `TRIAL_EXPIRED`

- **Promociones Beta Tester**
  - Nuevo tipo de promoción `FREE_TRIAL` con días de trial dinámicos
  - Campos `promotionType`, `trialDays`, `maxRedemptions`, `currentRedemptions` en `SystemPromotion`

- **Alertas Automatizadas de Monitoreo**
  - Alertas automáticas por fallos de pago y errores críticos
  - Nuevo enum value `PAYMENT_FAILED_ALERT`

- **Página de Funcionalidades**
  - Nueva página `/funcionalidades` con componentes y tests

- **Persistencia de Audit Logs de Seguridad**
  - Logs de auditoría de seguridad ahora se persisten en base de datos

### Corregido
- **fix(appointments):** aceptar `null` en `staffId`/`locationId` al crear citas (POST `/api/appointments`); el formulario enviaba `null` cuando no había ubicación seleccionada y el schema de Zod sólo aceptaba `string | undefined`, devolviendo 400 "Datos inválidos" (Sentry VETIFY-NEXTJS-1M)
- **fix(appointments):** enriquecer mensajes de error del cliente con detalles de validación (`field — message`) para que Sentry y el toast del usuario sean diagnosticables
- **fix(cron):** ping diario a Redis para evitar archivado de Upstash por inactividad
- **fix(subscription):** reconocer trials gestionados por Stripe en control de acceso
- **fix(subscription):** detectar suscripciones pagadas expiradas en UI del cliente
- **fix(security):** validar `subscriptionEndsAt` para prevenir acceso con datos obsoletos
- **fix(payments):** usar IDs dinámicos de productos Stripe en portal del cliente
- **fix(payments):** mostrar fallos silenciosos de sincronización de suscripción tras checkout
- **fix(middleware):** permitir webhook de Stripe a través de auth, CSRF, y matcher
- **fix(pets):** extraer array de respuesta paginada de `/api/customers`
- **fix(security):** eliminar proxies abiertos, forzar auth de super admin, redactar secretos
- **fix(appointments):** re-habilitar botón de WhatsApp en QuickActions

### Eliminado
- Código de blog/Storyblok removido de la rama de desarrollo

### Testing
- Eliminación de flakiness en tests E2E
- 13 nuevas suites de tests de integración
- Umbrales de cobertura obligatorios
- Tests E2E Phase 4: admin smoke tests, registros médicos, teardown
- QA audit cleanup: corrección de tests engañosos, cobertura adicional

### Infraestructura
- Sincronización de enum `EmailTemplate` entre bases de datos de prod y dev
- Múltiples correcciones de CI: seed data, Playwright exclusions, auth-dependent E2E tests
- Actualización de README y CLAUDE.md para v1.4.0

---

## [1.4.0] - 2026-02-14

### Agregado
- **Rediseño de Landing Page**
  - Nuevas secciones: HeroSection, ProblemSection, SolutionSection, BenefitsSection, AudienceSection, ClosingSection
  - Diseño enfocado en clínicas veterinarias pequeñas
  - Tests unitarios y E2E completos para todas las secciones

- **Mejoras de UX Móvil**
  - Vista de día por defecto en calendario móvil
  - Modal de citas cerrable en orientación portrait/landscape
  - Rediseño del menú móvil con layout consistente
  - Corrección de backdrop cubriendo navbar

- **Internacionalización (i18n)**
  - Traducción de especies de mascotas al español en toda la UI
  - Traducción de posiciones de staff al español en formularios

### Corregido
- **fix(promotions):** cache con backoff de 5 minutos en errores de conexión a DB para evitar logs repetitivos cuando Supabase Supavisor falla transitoriamente
- **fix(appointments):** preservar estado de selección de horario al cambiar entre vistas
- **fix(mobile):** prevenir que el backdrop cubra la barra de navegación

### Infraestructura
- **ci:** cron job para mantener activa la DB de desarrollo en Supabase free tier (cada 5 días)

---

## [1.3.0] - 2026-01-24

### Agregado
- **Sistema de Gestión de API Keys para Planes Corporativos (VETIF-96, VETIF-97)**
  - Nueva interfaz de administración de API keys en configuración del tenant
  - Componentes: ApiKeyManagement, ApiKeyCard, CreateApiKeyModal, ApiKeyCreatedModal, ApiKeyScopes
  - Endpoints REST: `/api/settings/api-keys` y `/api/settings/api-keys/[id]`
  - Sistema de scopes granulares (lectura/escritura por recurso)
  - Generación segura de keys con hash SHA-256
  - Expiración configurable y revocación de keys
  - Exclusivo para planes Corporativos (B2B)

- **API Versionada v1 (VETIF-98)**
  - Endpoints RESTful bajo `/api/v1/*` con esquemas de respuesta consistentes
  - Recursos: appointments, customers, pets, inventory, locations, reports
  - Serializers compartidos para respuestas uniformes
  - Tipos TypeScript para todas las respuestas de API
  - Soporte para paginación, filtrado y ordenamiento
  - Autenticación via API Keys con validación de scopes

- **Sistema de Webhooks Salientes (VETIF-99)**
  - Configuración de webhooks por tenant en `/api/settings/webhooks`
  - Firma HMAC-SHA256 para verificación de autenticidad
  - Eventos soportados: pet.created, pet.updated, appointment.created, appointment.updated, appointment.cancelled, inventory.low_stock
  - Sistema de reintentos con backoff exponencial (3 intentos)
  - Logs de entregas con estado y tiempo de respuesta
  - UI de configuración: WebhookConfig, WebhookCard, CreateWebhookModal
  - Endpoint de prueba para verificar conectividad

- **Documentación OpenAPI 3.0 (VETIF-100)**
  - Especificación OpenAPI completa en `/api/openapi.json`
  - Swagger UI interactivo en `/api/docs`
  - Documentación de todos los endpoints v1
  - Esquemas de request/response con ejemplos
  - Autenticación documentada (API Key via header)

### Seguridad
- **Configuración GitGuardian**
  - Archivo `.gitguardian.yaml` para ignorar secretos de prueba en tests

### Testing
- **Suite de Testing Avanzada (VETIF-191)**
  - Tests de contrato para API keys, appointments, pets y subscriptions
  - Tests E2E para gestión de API keys
  - Tests de rendimiento: tiempos de respuesta de API y carga de páginas
  - Tests visuales para dashboard y páginas públicas
  - Tests móviles para API keys, dashboard y páginas públicas
  - Cobertura unitaria completa para componentes de API keys

- **Tests para Nuevas Funcionalidades**
  - Tests unitarios completos para API v1 (appointments, customers, inventory, locations, pets, reports)
  - Tests de integración para webhooks CRUD
  - Tests unitarios para webhook-delivery, webhook-events, webhook-signature
  - Tests E2E para configuración de webhooks

- **Weekly E2E Smoke Tests**
  - Suite de smoke tests semanal para flujos críticos de negocio (65 tests)
  - Tests P0 (críticos): Clientes, Mascotas - CRUD completo
  - Tests P1 (importantes): Citas, Inventario, Punto de Venta, Caja
  - Tests CRUD para prevenir fallos durante demos
  - GitHub Actions workflow para ejecución automática (domingos 6AM UTC)
  - Comandos: `pnpm test:e2e:weekly`, `pnpm test:e2e:weekly:p0`

---

## [1.2.1] - 2026-01-22

### Corregido
- **Error "Maximum update depth exceeded" en página de citas**
  - Memoización de handlers en AppointmentsPageClient para prevenir loops de re-render
  - Debounce en listener de visibilidad (500ms)
  - Funciones fallback estables en AppointmentStats y TodayAppointments
  - Corrección de mutación de array de citas al ordenar
  - Mejoras en useAppointmentsData con referencias de objeto estables
  - Botón de WhatsApp deshabilitado temporalmente por bug con HeadlessUI Menu

### Seguridad
- **Control de acceso en páginas protegidas**
  - Enforcement de verificación de suscripción en rutas protegidas

### Modificado
- **PWA: Dashboard como URL de inicio predeterminada**
  - Mejora en experiencia de instalación de PWA

---

## [1.2.0] - 2026-01-22

### Agregado
- **Carga de Fotos de Mascotas (VETIF-224)**
  - Subida de fotos de perfil para mascotas con integración Cloudinary
  - Componente ImageLightbox para visualización de fotos en detalle
  - Mejoras en componentes de UI: PetHeader, MedicalHistoryCard, TreatmentTimelineCard
  - Tests comprehensivos: unitarios, integración y E2E
- **Página Acerca de Nosotros (VETIF-41)**
  - Nueva página `/acerca` con información de la empresa
  - Sección de fundador con foto y biografía
  - Enlaces actualizados en footer
- **Prompt de Instalación PWA (InstallPrompt)**
  - Componente para facilitar instalación de PWA en dispositivos móviles
  - Hook `usePWAInstall` para detectar plataforma y estado de instalación
  - Variante iOS: Instrucciones paso a paso (Compartir → Agregar a inicio)
  - Variante Android/Chrome: Botón que activa diálogo nativo de instalación
  - Persistencia de dismissal en localStorage (7 días)
  - Delay de 3 segundos antes de mostrar para UX no intrusiva
- **Mejoras en Página de Marketing (VETIF-202)**
  - Nuevos screenshots de funcionalidades en secciones de marketing
  - Mejoras de diseño responsive
  - Corrección de recorte de imágenes en testimonios
- Tests completos para InstallPrompt (20 unit tests, 42 integration tests)
- Tests unitarios para componentes de marketing
- Documentación de integración con Storyblok CMS

### Corregido
- Llamadas redundantes a API en página de calendario de citas (VETIF-167)
- Recorte incorrecto de imágenes en sección de testimonios

### Rendimiento
- Optimización de tiempos de respuesta de API reduciendo overhead de autenticación (VETIF-168)
- Infraestructura SWR optimizada para citas con tests comprehensivos

---

## [1.1.0] - 2026-01-13

### Agregado
- **Sistema de Invitaciones de Staff**
  - Envío de invitaciones por email a nuevos miembros del equipo
  - Validación y aceptación de invitaciones con tokens seguros
  - Nuevo endpoint `/api/invitations/*` para gestión de invitaciones
  - Plantilla de email `STAFF_INVITATION` para notificaciones
- **Sistema de Permisos de Staff (RBAC)**
  - Control de acceso basado en roles con permisos granulares
  - Componente `PermissionGate` para protección de UI
  - Hook `useStaffPermissions` para verificación de permisos en cliente
  - Modos de solo lectura para roles no administrativos
  - Permisos para: ubicaciones, servicios, inventario, ventas, testimonios
- Página de Actualizaciones (`/actualizaciones`)
  - Vista de timeline con historial de versiones
  - Categorías con código de colores (Agregado, Corregido, Modificado, Seguridad)
  - Parser de CHANGELOG con soporte para español e inglés
  - Secciones colapsables por versión
  - Metadatos SEO y datos estructurados
- Botón Flotante de Reporte de Errores
  - Componente de botón fijo en la esquina inferior derecha del dashboard
  - Modal de formulario con campos: descripción, pasos para reproducir, comportamiento esperado
  - Soporte para captura de pantallas (hasta 3 imágenes)
  - Integración con Resend para envío de emails
  - Incluye información del navegador y URL actual automáticamente
- Sistema de Control de Versiones
  - Versión mostrada en el footer del sitio
  - Endpoint API `/api/version` para consultar versión
  - Utilidades de parsing y comparación de versiones
  - Versión inyectada en tiempo de build via next.config.js
- Sistema de Analíticas para Landing Page (VETIF-71)
  - Modelo `LandingPageAnalytics` para tracking anónimo
  - Eventos: PAGE_VIEW, FORM_START, FORM_SUBMIT, CONVERSION, BUTTON_CLICK, SCROLL_DEPTH
  - Dashboard de métricas de conversión con exportación CSV
  - Endpoint público `/api/public/analytics` para tracking
- Generador de Códigos QR para Páginas Públicas (VETIF-72)
  - Generación de QR en configuración del tenant
  - Exportación a PNG, SVG y PDF
  - Personalización de colores y tamaño
- Paginación en Endpoints de API (VETIF-168)
  - Paginación servidor para clientes, mascotas y ubicaciones
  - Mejora de rendimiento en listados grandes
- Tests E2E para Dashboard (VETIF-187)
  - Atributos data-testid en todos los componentes del dashboard
  - Tests automatizados para flujos críticos
  - Cobertura de tests: 102 unit suites (3242 tests), 55 integration suites (1144 tests)
- **Menú Desplegable de Tema**
  - Selector de tema con opciones: Claro, Oscuro, Sistema
  - Sincronización mejorada entre preferencia del sistema y selección manual
  - Icono dinámico que refleja el tema actual
- Protocolo de Testing y Auto-Fix documentado en CLAUDE.md
  - Guía de iteración para corrección automática de tests
  - Flujo TDD para corrección de bugs

### Corregido
- Prevención de creación duplicada de clientes al enviar formulario (doble clic)
- Espacio blanco en móvil iOS Safari debajo de testimonios
- Validación de API key en modo dry-run ahora se omite correctamente
- Desincronización de zona horaria en tests de disponibilidad pública
- Tests E2E actualizados para mayor estabilidad (analytics, team page, testimonials)
- Componente ClinicInfo no renderizaba en iOS (removidas animaciones whileInView)
- Layout de horarios y botón "Navegar" en página pública
- Layout responsive de ServiceManagement
- Menú móvil de PublicNavbar rediseñado (mejor UX)
- Texto de botones Hero se cortaba en móvil
- Widget "Plan Actual" mostraba '0' en lugar del nombre del plan (VETIF-169)
- Problemas de CORS y renderizado en exportación de QR a PNG/PDF
- Timing de animaciones en tests de página de equipo
- URLs hardcodeadas en layout de clínica (ahora usa getBaseUrl())
- Imports no usados en componentes de analíticas
- Permisos de creación de citas ahora respetan roles (VETERINARIAN, ADMIN, RECEPTIONIST)
- Valores por defecto de paginación y permisos de caja para staff
- Títulos de posiciones en página pública de equipo ahora se muestran en español (VETERINARIAN → Veterinario/a, etc.)
- Campo de foto ahora disponible al crear nuevo personal (antes solo en edición)
- Badge "Acceso activo" en lista de personal ya no se expande a todo el ancho

### Modificado
- Middleware actualizado para excluir rutas de invitaciones de autenticación
- Unificación de correos electrónicos del sistema a español (soporte@, contacto@vetify.pro)
- Generador QR simplificado removiendo opción de logo

### Seguridad
- Restricción de acceso a página de configuración solo para roles administrativos (MANAGER, ADMINISTRATOR)
- Verificación de permisos en endpoints de appointments, inventory y staff
- Tokens de invitación con expiración y validación

---

## [1.0.0] - 2026-01-06

### Agregado
- Página Pública de Servicios para sitios web de clínicas
  - Ruta dinámica `/[clinicSlug]/servicios` mostrando todos los servicios activos
  - Servicios agrupados por categoría con traducciones en español
  - Diseño de cuadrícula responsive con animaciones Framer Motion
  - Estilos adaptables al tema con soporte para modo oscuro
  - Metadatos SEO y datos estructurados de breadcrumb
- Página Pública de Equipo para sitios web de clínicas
  - Ruta dinámica `/[clinicSlug]/equipo` mostrando los miembros del staff
  - Fotos del personal subidas vía Cloudinary
  - Visibilidad configurable del staff (bandera showOnPublicPage)
  - Visualización de biografía profesional y especialidades
- Sistema Completo de Testimonios
  - Formulario de envío de testimonios de clientes
  - Panel de administración para gestión de testimonios (aprobar/rechazar/destacar)
  - Sección pública de testimonios en páginas de clínicas
  - Sistema de calificación con estrellas (1-5 estrellas)
  - Plantilla de email para solicitar testimonios
- Gestión de fotos del personal
  - Integración con Cloudinary para fotos de perfil del staff
  - Carga de fotos en el modal de configuración del staff

### Corregido
- Botón de compartir no ocupaba todo el ancho en móvil en la sección hero
- Posición del menú del staff en la barra de navegación pública

### Seguridad
- Actualizado jspdf para corregir vulnerabilidad crítica (CVE-2024-XXXXX)

---

## [Anterior] - 2025-12-17

### Agregado
- Sistema de autenticación API v1 (VETIF-36)
  - Autenticación con API key usando claves hasheadas SHA-256
  - API keys con alcance por ubicación para control de acceso multi-sucursal
  - Permisos granulares (read:pets, write:appointments, etc.)
  - Límite de tasa configurable por API key (predeterminado 1000 req/hora)
  - Utilidades de gestión de API keys con generación segura de claves
- Seguimiento de ventas por ubicación (VETIF-95)
  - Agregado locationId al modelo Sale para reportes por sucursal
  - Filtrado basado en ubicación en consultas de ventas
  - Índices de rendimiento para consultas de ventas por ubicación
- Infraestructura de testing completa con GitHub Actions CI
  - Pruebas unitarias con Jest (49 suites, 1600+ pruebas)
  - Pruebas de integración para rutas API (40+ suites, 600+ pruebas)
  - Pruebas E2E con Playwright (490 pruebas en Chrome, Firefox, Safari)
  - Reportes de cobertura con umbrales configurables
  - Hooks pre-commit para lint-staged y pruebas unitarias
- Cobertura extendida de pruebas de integración (Fase 2 de iniciativa de testing)
  - Pruebas de API de Facturación y Precios Admin (VETIF-94)
  - Pruebas de integración de checkout y webhook de Stripe (VETIF-93)
  - Pruebas de API de Suscripción incluyendo upgrades/downgrades (VETIF-92)
  - Pruebas de API de Configuración y Onboarding (VETIF-61)
  - Pruebas unitarias de hooks para useErrorHandler y useThemeAware (VETIF-60)
- Sistema de notificaciones por email para citas
  - Plantillas de notificación configurables
  - Soporte para recordatorios y confirmaciones de citas
  - Nuevos tipos de plantillas de email en enum de base de datos
- Soporte de modo oscuro para páginas públicas de tenants
  - Estilos adaptables al tema para páginas de cara al cliente
  - Experiencia consistente de modo oscuro en todas las vistas
- Preferencias de notificación en configuración
  - Configuración de notificaciones por email y push personalizable por usuario
  - Controles de toggle por tipo de notificación
- Soporte de ubicación en gestión de inventario
  - Asignación de ubicación de sucursal para artículos de inventario
  - Campo de ubicación de almacenamiento para colocación precisa de artículos
  - Filtrado basado en ubicación en vistas de inventario

### Corregido
- Inconsistencias de bordes en modo oscuro en componentes del dashboard
- Fallo al guardar horarios de atención con locationId nulo
- Estilos del modal de inventario y soporte correcto del campo de ubicación
- Alineación de tarjetas de estadísticas en el dashboard de inventario
- Manejo de desbordamiento de tabla de inventario para diseño correcto

### Modificado
- Umbral de cobertura reducido a 5% (estableciendo línea base inicial)
- Hooks pre-commit ahora ejecutan pruebas unitarias solo en archivos modificados
- Índices de rendimiento agregados a tablas consultadas frecuentemente

### Seguridad
- Agregado modelo Email Log para registro de auditoría de notificaciones enviadas
- Índices de rendimiento mejoran tiempos de respuesta de consultas
- Reemplazado paquete xlsx con exceljs para corregir vulnerabilidades de alta severidad
  - Resuelto GHSA-4r6h-8v6p-xvw6: Prototype Pollution
  - Resuelto GHSA-5pgg-2g8v-p4x9: ReDoS
