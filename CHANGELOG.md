# Registro de Cambios

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

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
