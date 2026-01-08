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

    // Parse each category
    const categories = ['Added', 'Fixed', 'Changed', 'Security'] as const;

    for (const category of categories) {
      const categoryRegex = new RegExp(
        `### ${category}\\n([\\s\\S]*?)(?=### |## |$)`,
        'i'
      );
      const categoryMatch = sectionContent.match(categoryRegex);

      if (categoryMatch) {
        const items = parseCategoryItems(categoryMatch[1]);
        if (items.length > 0) {
          entry.categories[category.toLowerCase() as keyof typeof entry.categories] = items;
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
const CHANGELOG_CONTENT = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-01-06

### Added
- Public Services Page for clinic websites (VETIF-new)
- Public Team Page for clinic websites
- Complete Testimonials System
- Staff photo management with Cloudinary integration

### Fixed
- Share button not full width on mobile in hero section
- Staff menu position in public navbar

### Security
- Updated jspdf to fix critical vulnerability

---

## [Previous] - 2025-12-17

### Added
- API v1 authentication system (VETIF-36)
- Per-location sales tracking (VETIF-95)
- Comprehensive testing infrastructure with GitHub Actions CI
- Email notification system for appointments
- Dark mode support for tenant public pages
- Notification preferences in settings
- Location support in inventory management

### Fixed
- Dark mode border inconsistencies across dashboard components
- Business hours save failing with null locationId
- Inventory modal styling and proper location field support
- Stats cards alignment in inventory dashboard
- Inventory table overflow handling for proper layout

### Changed
- Coverage threshold reduced to 5% (establishing initial baseline)
- Pre-commit hooks now run unit tests on changed files only
- Performance indexes added to frequently queried tables

### Security
- Added Email Log model for audit trail of sent notifications
- Replaced xlsx package with exceljs to fix high-severity vulnerabilities
`;
