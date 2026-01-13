/**
 * @jest-environment node
 *
 * Unit tests for sync-changelog.mjs script
 *
 * Tests the CHANGELOG.md synchronization functionality by verifying
 * the expected file structure and content after sync.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..', '..', '..');
const SCRIPT_PATH = join(ROOT_DIR, 'scripts', 'sync-changelog.mjs');
const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');
const PARSER_PATH = join(ROOT_DIR, 'src', 'lib', 'changelog-parser.ts');

describe('sync-changelog.mjs', () => {
  describe('Script Existence', () => {
    it('should have sync-changelog.mjs script in scripts directory', () => {
      expect(existsSync(SCRIPT_PATH)).toBe(true);
    });

    it('should have CHANGELOG.md in root directory', () => {
      expect(existsSync(CHANGELOG_PATH)).toBe(true);
    });

    it('should have changelog-parser.ts in lib directory', () => {
      expect(existsSync(PARSER_PATH)).toBe(true);
    });
  });

  describe('Script Structure', () => {
    let scriptContent: string;

    beforeAll(() => {
      scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('should be an ES module', () => {
      expect(scriptContent).toContain('import {');
      expect(scriptContent).toContain("from 'fs'");
    });

    it('should have readChangelog function', () => {
      expect(scriptContent).toContain('function readChangelog');
    });

    it('should have updateParserFile function', () => {
      expect(scriptContent).toContain('function updateParserFile');
    });

    it('should have escapeForTemplate function', () => {
      expect(scriptContent).toContain('function escapeForTemplate');
    });

    it('should handle escaping of backticks', () => {
      // Script should escape backticks for template literals
      expect(scriptContent).toMatch(/replace.*`/);
    });

    it('should have error handling with process.exit', () => {
      expect(scriptContent).toContain('process.exit(1)');
    });

    it('should use the correct marker constants', () => {
      expect(scriptContent).toContain('CHANGELOG_CONTENT_START');
      expect(scriptContent).toContain('CHANGELOG_CONTENT_END');
    });
  });

  describe('Content Synchronization Verification', () => {
    let changelogContent: string;
    let parserContent: string;

    beforeAll(() => {
      changelogContent = readFileSync(CHANGELOG_PATH, 'utf-8');
      parserContent = readFileSync(PARSER_PATH, 'utf-8');
    });

    it('should have sync markers in changelog-parser.ts', () => {
      expect(parserContent).toContain('// --- CHANGELOG_CONTENT_START ---');
      expect(parserContent).toContain('// --- CHANGELOG_CONTENT_END ---');
    });

    it('should have CHANGELOG_CONTENT constant between markers', () => {
      const startMarker = '// --- CHANGELOG_CONTENT_START ---';
      const endMarker = '// --- CHANGELOG_CONTENT_END ---';

      const startIndex = parserContent.indexOf(startMarker);
      const endIndex = parserContent.indexOf(endMarker);

      expect(startIndex).toBeGreaterThan(-1);
      expect(endIndex).toBeGreaterThan(startIndex);

      const betweenMarkers = parserContent.slice(startIndex, endIndex);
      expect(betweenMarkers).toContain('const CHANGELOG_CONTENT');
    });

    it('should contain the changelog title in parser', () => {
      expect(parserContent).toContain('Registro de Cambios');
    });

    it('should contain version 1.1.0 in parser', () => {
      expect(parserContent).toContain('[1.1.0]');
    });

    it('should contain version 1.0.0 in parser', () => {
      expect(parserContent).toContain('[1.0.0]');
    });

    it('should properly escape backticks in synced content', () => {
      // Check that backticks are escaped in the parser file
      // The CHANGELOG.md has backticks like `/api/invitations/*`
      if (changelogContent.includes('`')) {
        // In the parser, these should be escaped as \`
        expect(parserContent).toMatch(/\\`/);
      }
    });

    it('should have matching section headers between files', () => {
      // Check key section headers are present
      const sections = ['Agregado', 'Corregido', 'Modificado', 'Seguridad'];

      sections.forEach((section) => {
        if (changelogContent.includes(`### ${section}`)) {
          expect(parserContent).toContain(section);
        }
      });
    });
  });

  describe('package.json Integration', () => {
    let packageJson: Record<string, unknown>;

    beforeAll(() => {
      packageJson = JSON.parse(
        readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8')
      );
    });

    it('should have sync:changelog script in package.json', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts['sync:changelog']).toBeDefined();
      expect(scripts['sync:changelog']).toContain('sync-changelog.mjs');
    });

    it('should be included in prebuild script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts.prebuild).toContain('sync-changelog.mjs');
    });

    it('should be included in vercel-build script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts['vercel-build']).toContain('sync-changelog.mjs');
    });

    it('should have lint-staged config for CHANGELOG.md', () => {
      const lintStaged = packageJson['lint-staged'] as Record<string, string[]>;
      expect(lintStaged['CHANGELOG.md']).toBeDefined();
      expect(lintStaged['CHANGELOG.md']).toContain(
        'node scripts/sync-changelog.mjs'
      );
    });

    it('should auto-stage changelog-parser.ts in lint-staged', () => {
      const lintStaged = packageJson['lint-staged'] as Record<string, string[]>;
      expect(lintStaged['CHANGELOG.md']).toContain(
        'git add src/lib/changelog-parser.ts'
      );
    });
  });

  describe('Escaping Logic', () => {
    it('should escape backticks correctly', () => {
      // Test the escaping logic used in the script
      const escapeForTemplate = (content: string) => {
        return content
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$\{/g, '\\${');
      };

      // Test cases
      expect(escapeForTemplate('`code`')).toBe('\\`code\\`');
      expect(escapeForTemplate('${var}')).toBe('\\${var}');
      expect(escapeForTemplate('path\\to\\file')).toBe('path\\\\to\\\\file');
      expect(escapeForTemplate('normal text')).toBe('normal text');
    });

    it('should handle mixed special characters', () => {
      const escapeForTemplate = (content: string) => {
        return content
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$\{/g, '\\${');
      };

      const input = 'Use `command` with ${VAR} and path\\to\\file';
      const expected = 'Use \\`command\\` with \\${VAR} and path\\\\to\\\\file';
      expect(escapeForTemplate(input)).toBe(expected);
    });
  });
});
