/**
 * PWA Install Prompt Integration Tests
 *
 * Tests the InstallPrompt component and usePWAInstall hook integration:
 * - localStorage persistence for dismissal state
 * - Platform detection logic
 * - Component export and integration in layout
 * - BeforeInstallPromptEvent handling
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('PWA Install Prompt Integration Tests', () => {
  describe('usePWAInstall Hook File Structure', () => {
    const hookPath = join(process.cwd(), 'src', 'hooks', 'usePWAInstall.ts');

    it('should exist at the correct path', () => {
      expect(existsSync(hookPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain("'use client'");
    });

    it('should export usePWAInstall function', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('export function usePWAInstall');
    });

    it('should define UsePWAInstallReturn interface', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('export interface UsePWAInstallReturn');
    });

    it('should handle beforeinstallprompt event', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('beforeinstallprompt');
      expect(content).toContain("window.addEventListener('beforeinstallprompt'");
    });

    it('should handle appinstalled event', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('appinstalled');
      expect(content).toContain("window.addEventListener('appinstalled'");
    });

    it('should detect iOS platform', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('iPad|iPhone|iPod');
      expect(content).toContain('setIsIOS');
    });

    it('should detect standalone mode', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('display-mode: standalone');
      expect(content).toContain('navigator');
      expect(content).toContain('standalone');
    });

    it('should use localStorage for dismissal persistence', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('localStorage.getItem');
      expect(content).toContain('localStorage.setItem');
      expect(content).toContain('pwa-install-dismissed');
    });

    it('should configure 7-day dismissal period', () => {
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('DISMISS_DAYS = 7');
    });
  });

  describe('InstallPrompt Component File Structure', () => {
    const componentPath = join(process.cwd(), 'src', 'components', 'pwa', 'InstallPrompt.tsx');

    it('should exist at the correct path', () => {
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain("'use client'");
    });

    it('should export InstallPrompt function', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('export function InstallPrompt');
    });

    it('should import usePWAInstall hook', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain("import { usePWAInstall } from '@/hooks/usePWAInstall'");
    });

    it('should use lucide-react icons', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain("from 'lucide-react'");
      expect(content).toContain('Download');
      expect(content).toContain('Share');
      expect(content).toContain('X');
    });

    it('should have Spanish text for iOS instructions', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('Instalar Vetify');
      expect(content).toContain('Para instalar la app en tu dispositivo');
      expect(content).toContain('Toca el boton');
      expect(content).toContain('Compartir');
      expect(content).toContain('Agregar a inicio');
      expect(content).toContain('Entendido');
    });

    it('should have Spanish text for Android/Chrome variant', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('acceso rapido y uso sin conexion');
      expect(content).toContain('Instalar');
      expect(content).toContain('Mas tarde');
    });

    it('should have loading state for installation', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('isInstalling');
      expect(content).toContain('Instalando');
    });

    it('should use proper styling with animations', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('animate-in');
      expect(content).toContain('slide-in-from-bottom');
    });

    it('should have fixed positioning', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('fixed bottom-20');
    });

    it('should be responsive', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('sm:');
      expect(content).toContain('sm:w-96');
    });

    it('should have accessibility attributes', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('aria-label');
      expect(content).toContain('Cerrar');
    });

    it('should have delay before showing prompt', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('setTimeout');
      expect(content).toContain('3000');
    });
  });

  describe('PWA Component Exports', () => {
    const indexPath = join(process.cwd(), 'src', 'components', 'pwa', 'index.ts');

    it('should export InstallPrompt', () => {
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toContain("export { InstallPrompt } from './InstallPrompt'");
    });

    it('should export UpdatePrompt', () => {
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toContain("export { UpdatePrompt } from './UpdatePrompt'");
    });
  });

  describe('Layout Integration', () => {
    const layoutPath = join(process.cwd(), 'src', 'app', 'layout.tsx');

    it('should import InstallPrompt component', () => {
      const content = readFileSync(layoutPath, 'utf-8');
      expect(content).toContain('InstallPrompt');
    });

    it('should include InstallPrompt in the layout', () => {
      const content = readFileSync(layoutPath, 'utf-8');
      expect(content).toContain('<InstallPrompt');
    });

    it('should render InstallPrompt after UpdatePrompt', () => {
      const content = readFileSync(layoutPath, 'utf-8');
      const updateIndex = content.indexOf('<UpdatePrompt');
      const installIndex = content.indexOf('<InstallPrompt');
      expect(updateIndex).toBeLessThan(installIndex);
    });
  });
});

describe('PWA Install Prompt localStorage Integration', () => {
  const DISMISS_KEY = 'pwa-install-dismissed';

  describe('Dismissal Key Format', () => {
    it('should use correct localStorage key', () => {
      const hookPath = join(process.cwd(), 'src', 'hooks', 'usePWAInstall.ts');
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain(`DISMISS_KEY = '${DISMISS_KEY}'`);
    });

    it('should store ISO date string on dismiss', () => {
      const hookPath = join(process.cwd(), 'src', 'hooks', 'usePWAInstall.ts');
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('new Date().toISOString()');
    });
  });

  describe('Dismissal Time Calculation', () => {
    it('should calculate days since dismissal', () => {
      const hookPath = join(process.cwd(), 'src', 'hooks', 'usePWAInstall.ts');
      const content = readFileSync(hookPath, 'utf-8');
      // Check for day calculation formula
      expect(content).toContain('1000 * 60 * 60 * 24');
    });
  });
});

describe('BeforeInstallPromptEvent Interface', () => {
  const hookPath = join(process.cwd(), 'src', 'hooks', 'usePWAInstall.ts');

  it('should define BeforeInstallPromptEvent interface', () => {
    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('interface BeforeInstallPromptEvent');
  });

  it('should extend Event interface', () => {
    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('BeforeInstallPromptEvent extends Event');
  });

  it('should have prompt method', () => {
    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('prompt(): Promise<void>');
  });

  it('should have userChoice property', () => {
    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('userChoice: Promise<');
    expect(content).toContain("outcome: 'accepted' | 'dismissed'");
  });

  it('should augment WindowEventMap', () => {
    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('declare global');
    expect(content).toContain('interface WindowEventMap');
    expect(content).toContain('beforeinstallprompt: BeforeInstallPromptEvent');
  });
});

describe('PWA Install Prompt UX Guidelines', () => {
  const componentPath = join(process.cwd(), 'src', 'components', 'pwa', 'InstallPrompt.tsx');

  describe('Non-Intrusive Behavior', () => {
    it('should have delay before showing', () => {
      const content = readFileSync(componentPath, 'utf-8');
      // 3 second delay is reasonable for not being intrusive
      expect(content).toMatch(/setTimeout.*3000/s);
    });

    it('should not show when standalone', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('isStandalone');
      expect(content).toContain('!isStandalone');
    });

    it('should not show when dismissed', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('isDismissed');
      expect(content).toContain('!isDismissed');
    });

    it('should have dismiss button', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('handleDismiss');
      expect(content).toContain('onClick={handleDismiss}');
    });
  });

  describe('Platform-Specific UI', () => {
    it('should show different UI for iOS', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('if (isIOS)');
    });

    it('should show Share icon for iOS', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('<Share');
    });

    it('should show Download icon for Android', () => {
      const content = readFileSync(componentPath, 'utf-8');
      expect(content).toContain('<Download');
    });
  });
});
