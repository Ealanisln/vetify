/**
 * Changelog Parser Utility
 *
 * Parses CHANGELOG.md files following the Keep a Changelog format
 * and returns structured data for display in the UI.
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  categories: {
    added?: string[];
    fixed?: string[];
    changed?: string[];
    security?: string[];
  };
}

/**
 * Parse a CHANGELOG.md content string into structured entries
 */
export function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];

  // Split content by version headers
  // Match: ## [Version] - YYYY-MM-DD or ## [Version]
  const versionRegex = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?/gm;

  // Find all version positions
  const versionMatches: { version: string; date: string; index: number }[] = [];
  let match;

  while ((match = versionRegex.exec(content)) !== null) {
    versionMatches.push({
      version: match[1],
      date: match[2] || '',
      index: match.index,
    });
  }

  // Parse each version section
  for (let i = 0; i < versionMatches.length; i++) {
    const current = versionMatches[i];
    const nextIndex = versionMatches[i + 1]?.index || content.length;
    const sectionContent = content.slice(current.index, nextIndex);

    const entry: ChangelogEntry = {
      version: current.version,
      date: current.date,
      categories: {},
    };

    // Parse each category (supports both English and Spanish headers)
    const categoryMappings: { key: keyof typeof entry.categories; patterns: string[] }[] = [
      { key: 'added', patterns: ['Added', 'Agregado'] },
      { key: 'fixed', patterns: ['Fixed', 'Corregido'] },
      { key: 'changed', patterns: ['Changed', 'Modificado'] },
      { key: 'security', patterns: ['Security', 'Seguridad'] },
    ];

    for (const { key, patterns } of categoryMappings) {
      for (const pattern of patterns) {
        const categoryRegex = new RegExp(
          `### ${pattern}\\n([\\s\\S]*?)(?=### |## |$)`,
          'i'
        );
        const categoryMatch = sectionContent.match(categoryRegex);

        if (categoryMatch) {
          const items = parseCategoryItems(categoryMatch[1]);
          if (items.length > 0) {
            entry.categories[key] = items;
            break; // Found this category, move to next
          }
        }
      }
    }

    // Only add entries that have at least one category
    if (Object.keys(entry.categories).length > 0) {
      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Parse category items from markdown list
 * Handles nested lists by combining them with the parent item
 */
function parseCategoryItems(content: string): string[] {
  const lines = content.split('\n');
  const items: string[] = [];
  let currentItem = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check if it's a main list item (starts with -)
    if (trimmed.startsWith('- ')) {
      // Save previous item if exists
      if (currentItem) {
        items.push(currentItem.trim());
      }
      // Start new item
      currentItem = trimmed.slice(2);
    }
    // Check if it's a nested item (indented with spaces then -)
    else if (line.match(/^\s+- /)) {
      // Append to current item as sub-point
      const subItem = trimmed.slice(2);
      currentItem += ` | ${subItem}`;
    }
  }

  // Don't forget the last item
  if (currentItem) {
    items.push(currentItem.trim());
  }

  return items;
}

/**
 * Format a date string to Spanish locale
 */
export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';

  try {
    // Add time to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get changelog content (for server-side use)
 * This reads from a static string or could be extended to read from file
 */
export function getChangelogContent(): string {
  // This will be replaced with actual CHANGELOG.md content at build time
  // For now, we return the hardcoded content
  return CHANGELOG_CONTENT;
}

// Hardcoded changelog content - updated manually or via build script
const CHANGELOG_CONTENT = `# Registro de Cambios

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Sin Publicar]

### Agregado
- Página de Actualizaciones (/actualizaciones)
  - Vista de timeline con historial de versiones
  - Categorías con código de colores (Agregado, Corregido, Modificado, Seguridad)
  - Parser de CHANGELOG con soporte para español e inglés
- Botón Flotante de Reporte de Errores
  - Modal de formulario con campos: descripción, pasos, comportamiento esperado
  - Soporte para captura de pantallas (hasta 3 imágenes)
  - Integración con Resend para envío de emails
- Sistema de Control de Versiones
  - Versión mostrada en el footer del sitio
  - Endpoint API /api/version para consultar versión

---

## [1.0.0] - 2026-01-06

### Agregado
- Página Pública de Servicios para sitios web de clínicas
- Página Pública de Equipo para sitios web de clínicas
- Sistema Completo de Testimonios
- Gestión de fotos del personal con integración Cloudinary

### Corregido
- Botón de compartir no ocupaba todo el ancho en móvil en la sección hero
- Posición del menú del staff en la barra de navegación pública

### Seguridad
- Actualizado jspdf para corregir vulnerabilidad crítica

---

## [Anterior] - 2025-12-17

### Agregado
- Sistema de autenticación API v1 (VETIF-36)
- Seguimiento de ventas por ubicación (VETIF-95)
- Infraestructura de testing completa con GitHub Actions CI
- Sistema de notificaciones por email para citas
- Soporte de modo oscuro para páginas públicas de tenants
- Preferencias de notificación en configuración
- Soporte de ubicación en gestión de inventario

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
- Reemplazado paquete xlsx con exceljs para corregir vulnerabilidades de alta severidad
`;
