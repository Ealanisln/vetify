/**
 * PWA Manifest Integration Tests
 *
 * Tests the PWA manifest.json structure and offline page functionality.
 * These tests validate that the PWA is properly configured for installation
 * and offline use.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('PWA Manifest Integration Tests', () => {
  const manifestPath = join(process.cwd(), 'public', 'manifest.json');
  let manifest: Record<string, unknown>;

  beforeAll(() => {
    if (existsSync(manifestPath)) {
      const content = readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(content);
    }
  });

  describe('Manifest File', () => {
    it('should exist in public directory', () => {
      expect(existsSync(manifestPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const content = readFileSync(manifestPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('Required PWA Fields', () => {
    it('should have name field', () => {
      expect(manifest).toHaveProperty('name');
      expect(typeof manifest.name).toBe('string');
      expect((manifest.name as string).length).toBeGreaterThan(0);
    });

    it('should have short_name field', () => {
      expect(manifest).toHaveProperty('short_name');
      expect(typeof manifest.short_name).toBe('string');
      // Short name should be concise (typically < 12 chars for best display)
      expect((manifest.short_name as string).length).toBeLessThanOrEqual(15);
    });

    it('should have start_url field', () => {
      expect(manifest).toHaveProperty('start_url');
      expect(manifest.start_url).toBe('/');
    });

    it('should have display field set to standalone', () => {
      expect(manifest).toHaveProperty('display');
      expect(manifest.display).toBe('standalone');
    });

    it('should have background_color field', () => {
      expect(manifest).toHaveProperty('background_color');
      expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have theme_color matching brand color', () => {
      expect(manifest).toHaveProperty('theme_color');
      expect(manifest.theme_color).toBe('#75a99c');
    });
  });

  describe('Icons Configuration', () => {
    it('should have icons array', () => {
      expect(manifest).toHaveProperty('icons');
      expect(Array.isArray(manifest.icons)).toBe(true);
    });

    it('should have at least one icon', () => {
      const icons = manifest.icons as Array<Record<string, unknown>>;
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have 192x192 icon (minimum for PWA)', () => {
      const icons = manifest.icons as Array<Record<string, unknown>>;
      const has192 = icons.some((icon) =>
        (icon.sizes as string)?.includes('192x192')
      );
      expect(has192).toBe(true);
    });

    it('should have 512x512 icon (required for splash screen)', () => {
      const icons = manifest.icons as Array<Record<string, unknown>>;
      const has512 = icons.some((icon) =>
        (icon.sizes as string)?.includes('512x512')
      );
      expect(has512).toBe(true);
    });

    it('should have maskable icons for adaptive display', () => {
      const icons = manifest.icons as Array<Record<string, unknown>>;
      const hasMaskable = icons.some((icon) =>
        (icon.purpose as string)?.includes('maskable')
      );
      expect(hasMaskable).toBe(true);
    });

    it('all icons should have required properties', () => {
      const icons = manifest.icons as Array<Record<string, unknown>>;
      icons.forEach((icon) => {
        expect(icon).toHaveProperty('src');
        expect(icon).toHaveProperty('sizes');
        expect(icon).toHaveProperty('type');
      });
    });
  });

  describe('Optional but Recommended Fields', () => {
    it('should have description field', () => {
      expect(manifest).toHaveProperty('description');
      expect(typeof manifest.description).toBe('string');
    });

    it('should have orientation preference', () => {
      expect(manifest).toHaveProperty('orientation');
    });

    it('should have language configuration', () => {
      expect(manifest).toHaveProperty('lang');
      expect(manifest.lang).toBe('es');
    });

    it('should have categories for app stores', () => {
      expect(manifest).toHaveProperty('categories');
      expect(Array.isArray(manifest.categories)).toBe(true);
    });
  });

  describe('PWA Install Criteria', () => {
    it('should meet minimum installability requirements', () => {
      // Chrome PWA install requirements:
      // 1. Valid manifest with name/short_name, start_url, display (standalone/fullscreen/minimal-ui)
      // 2. At least 192x192 icon
      // 3. Service worker (tested separately)

      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('start_url');
      expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(manifest.display);

      const icons = manifest.icons as Array<Record<string, unknown>>;
      const has192 = icons.some((icon) =>
        (icon.sizes as string)?.includes('192x192')
      );
      expect(has192).toBe(true);
    });
  });
});

describe('Offline Page Integration Tests', () => {
  const offlinePagePath = join(process.cwd(), 'src', 'app', 'offline', 'page.tsx');

  describe('Offline Page Structure', () => {
    it('should exist at the correct path', () => {
      expect(existsSync(offlinePagePath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = readFileSync(offlinePagePath, 'utf-8');
      expect(content).toContain("'use client'");
    });

    it('should have Spanish content for offline message', () => {
      const content = readFileSync(offlinePagePath, 'utf-8');
      expect(content).toContain('Sin conexión');
    });

    it('should have retry functionality', () => {
      const content = readFileSync(offlinePagePath, 'utf-8');
      expect(content).toContain('Reintentar');
      expect(content).toContain('handleRetry');
    });

    it('should use proper icons', () => {
      const content = readFileSync(offlinePagePath, 'utf-8');
      expect(content).toContain('WifiOff');
      expect(content).toContain('RefreshCw');
    });

    it('should have proper styling for dark mode', () => {
      const content = readFileSync(offlinePagePath, 'utf-8');
      expect(content).toContain('dark:');
    });

    it('should use brand colors', () => {
      const content = readFileSync(offlinePagePath, 'utf-8');
      expect(content).toContain('#75a99c');
    });
  });
});

describe('Next.js PWA Configuration Integration', () => {
  const nextConfigPath = join(process.cwd(), 'next.config.js');

  it('should have next.config.js file', () => {
    expect(existsSync(nextConfigPath)).toBe(true);
  });

  describe('PWA Configuration', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(nextConfigPath, 'utf-8');
    });

    it('should import next-pwa package', () => {
      expect(configContent).toContain("import withPWAInit from 'next-pwa'");
    });

    it('should configure PWA destination as public', () => {
      expect(configContent).toContain("dest: 'public'");
    });

    it('should disable PWA in development', () => {
      expect(configContent).toContain("disable: process.env.NODE_ENV === 'development'");
    });

    it('should configure offline fallback', () => {
      expect(configContent).toContain("document: '/offline'");
    });

    it('should have runtimeCaching configuration', () => {
      expect(configContent).toContain('runtimeCaching:');
    });

    it('should wrap config with withPWA', () => {
      expect(configContent).toContain('withPWA(nextConfig)');
    });
  });

  describe('Caching Strategies', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(nextConfigPath, 'utf-8');
    });

    it('should have NetworkFirst strategy for API routes', () => {
      expect(configContent).toContain("handler: 'NetworkFirst'");
      expect(configContent).toContain('api-cache');
    });

    it('should have StaleWhileRevalidate for static API', () => {
      expect(configContent).toContain("handler: 'StaleWhileRevalidate'");
      expect(configContent).toContain('api-static');
    });

    it('should have CacheFirst for fonts', () => {
      expect(configContent).toContain("handler: 'CacheFirst'");
      expect(configContent).toContain('google-fonts');
    });

    it('should have CacheFirst for images', () => {
      expect(configContent).toContain('static-images');
      expect(configContent).toContain('cloudinary-images');
    });

    it('should configure cache expiration for API (5 minutes)', () => {
      expect(configContent).toContain('maxAgeSeconds: 5 * 60');
    });

    it('should configure longer expiration for static API (1 hour)', () => {
      expect(configContent).toContain('maxAgeSeconds: 60 * 60');
    });

    it('should configure network timeout for API cache', () => {
      expect(configContent).toContain('networkTimeoutSeconds: 10');
    });
  });
});

describe('Layout PWA Integration', () => {
  const layoutPath = join(process.cwd(), 'src', 'app', 'layout.tsx');

  it('should have layout.tsx file', () => {
    expect(existsSync(layoutPath)).toBe(true);
  });

  describe('PWA Components in Layout', () => {
    let layoutContent: string;

    beforeAll(() => {
      layoutContent = readFileSync(layoutPath, 'utf-8');
    });

    it('should import PWA components', () => {
      expect(layoutContent).toContain("import { UpdatePrompt, InstallPrompt } from '@/components/pwa'");
    });

    it('should include UpdatePrompt in the layout', () => {
      expect(layoutContent).toContain('<UpdatePrompt');
    });

    it('should include InstallPrompt in the layout', () => {
      expect(layoutContent).toContain('<InstallPrompt');
    });

    it('should configure manifest link', () => {
      expect(layoutContent).toContain("manifest: '/manifest.json'");
    });

    it('should configure apple web app settings', () => {
      expect(layoutContent).toContain('appleWebApp');
    });

    it('should configure theme color for light and dark modes', () => {
      expect(layoutContent).toContain('themeColor');
      expect(layoutContent).toContain('#75a99c');
    });
  });
});
