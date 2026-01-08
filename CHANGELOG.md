# Registro de Cambios

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Sin Publicar] - 2026-01-06

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
