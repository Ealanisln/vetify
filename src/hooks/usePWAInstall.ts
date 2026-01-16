'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackPWAInstall } from '@/lib/analytics/meta-events';

/**
 * BeforeInstallPromptEvent interface
 * This event is fired when the browser detects that the site can be installed as a PWA
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

export interface UsePWAInstallReturn {
  /** True when Android/Chrome can show install prompt */
  isInstallable: boolean;
  /** True when running on iOS device */
  isIOS: boolean;
  /** True when app is already installed as PWA */
  isStandalone: boolean;
  /** True when user has dismissed the prompt recently */
  isDismissed: boolean;
  /** Trigger the native install prompt (Android/Chrome only) */
  promptInstall: () => Promise<void>;
  /** Dismiss the prompt for DISMISS_DAYS */
  dismiss: () => void;
}

/**
 * Hook to manage PWA installation state and prompts
 *
 * - On Android/Chrome: Captures `beforeinstallprompt` event for programmatic install
 * - On iOS: Detects platform to show manual installation instructions
 * - Tracks dismissal state in localStorage
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to prevent flash

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return;

    // Detect iOS (iPhone, iPad, iPod)
    const userAgent = navigator.userAgent || navigator.vendor;
    const ios = /iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Detect standalone mode (already installed as PWA)
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standaloneMedia || iosStandalone);

    // Check if user dismissed the prompt recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const now = new Date();
      const daysSince = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      setIsDismissed(daysSince < DISMISS_DAYS);
    } else {
      setIsDismissed(false);
    }

    // Listen for beforeinstallprompt event (Chrome/Android/Edge)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      // Track that the prompt is available
      trackPWAInstall('pwa_prompt_shown');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      // Track successful installation
      trackPWAInstall('pwa_installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return;

    // Show the native install prompt
    installPrompt.prompt();

    // Wait for user response
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      // User accepted, clear the prompt
      setInstallPrompt(null);
      // Track accepted (appinstalled event will also fire)
      trackPWAInstall('pwa_install_accepted');
    } else {
      // User dismissed the prompt
      trackPWAInstall('pwa_install_dismissed');
    }
  }, [installPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setIsDismissed(true);
  }, []);

  return {
    isInstallable: !!installPrompt,
    isIOS,
    isStandalone,
    isDismissed,
    promptInstall,
    dismiss,
  };
}
