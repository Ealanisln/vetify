#!/usr/bin/env node

/**
 * Script de sincronización de CHANGELOG
 *
 * Lee el archivo CHANGELOG.md y genera el contenido para changelog-parser.ts
 * Esto asegura que la página /actualizaciones siempre esté actualizada.
 *
 * Uso:
 *   node scripts/sync-changelog.mjs
 *
 * Se ejecuta automáticamente en:
 *   - Build de producción
 *   - Pre-commit hook (cuando CHANGELOG.md cambia)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');
const PARSER_PATH = join(ROOT_DIR, 'src', 'lib', 'changelog-parser.ts');

// Colores para output en terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readChangelog() {
  try {
    const content = readFileSync(CHANGELOG_PATH, 'utf-8');
    log(`✓ Leído CHANGELOG.md (${content.length} caracteres)`, 'green');
    return content;
  } catch (error) {
    log(`✗ Error leyendo CHANGELOG.md: ${error.message}`, 'red');
    process.exit(1);
  }
}

function readCurrentParser() {
  try {
    return readFileSync(PARSER_PATH, 'utf-8');
  } catch (error) {
    log(`✗ Error leyendo changelog-parser.ts: ${error.message}`, 'red');
    process.exit(1);
  }
}

function escapeForTemplate(content) {
  // Escapar backticks y ${} para template literals
  return content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function updateParserFile(changelogContent) {
  const currentParser = readCurrentParser();
  const escapedContent = escapeForTemplate(changelogContent);

  // Buscar y reemplazar el contenido entre los marcadores
  const startMarker = '// --- CHANGELOG_CONTENT_START ---';
  const endMarker = '// --- CHANGELOG_CONTENT_END ---';

  // Si los marcadores no existen, buscar el patrón antiguo
  if (!currentParser.includes(startMarker)) {
    // Patrón antiguo: const CHANGELOG_CONTENT = `...`;
    const oldPattern = /const CHANGELOG_CONTENT = `[\s\S]*?`;/;

    if (oldPattern.test(currentParser)) {
      const newContent = currentParser.replace(
        oldPattern,
        `${startMarker}\nconst CHANGELOG_CONTENT = \`${escapedContent}\`;\n${endMarker}`
      );

      writeFileSync(PARSER_PATH, newContent, 'utf-8');
      log('✓ Actualizado changelog-parser.ts (agregados marcadores)', 'green');
      return true;
    } else {
      log('✗ No se encontró CHANGELOG_CONTENT en el archivo', 'red');
      return false;
    }
  }

  // Reemplazar contenido entre marcadores
  const regex = new RegExp(
    `${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}`,
    'g'
  );

  const newContent = currentParser.replace(
    regex,
    `${startMarker}\nconst CHANGELOG_CONTENT = \`${escapedContent}\`;\n${endMarker}`
  );

  if (newContent === currentParser) {
    log('→ Sin cambios en changelog-parser.ts', 'yellow');
    return false;
  }

  writeFileSync(PARSER_PATH, newContent, 'utf-8');
  log('✓ Actualizado changelog-parser.ts', 'green');
  return true;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  log('\n📋 Sincronizando CHANGELOG.md → changelog-parser.ts\n', 'cyan');

  const changelogContent = readChangelog();
  const updated = updateParserFile(changelogContent);

  if (updated) {
    log('\n✅ Sincronización completada exitosamente\n', 'green');
  } else {
    log('\n✅ El archivo ya está actualizado\n', 'green');
  }
}

main();
