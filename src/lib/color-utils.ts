/**
 * Color manipulation utilities for generating dark mode variants
 * Used primarily for public tenant pages with customizable theme colors
 */

export interface HSL {
  h: number; // Hue: 0-360
  s: number; // Saturation: 0-100
  l: number; // Lightness: 0-100
}

export interface DarkThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
  border: string;
  cardBg: string;
  heroGradientFrom: string;
  heroGradientTo: string;
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): HSL {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust color lightness
 */
export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  const newL = Math.max(0, Math.min(100, hsl.l + amount));
  return hslToHex(hsl.h, hsl.s, newL);
}

/**
 * Adjust color saturation
 */
export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  const newS = Math.max(0, Math.min(100, hsl.s + amount));
  return hslToHex(hsl.h, newS, hsl.l);
}

/**
 * Get relative luminance for contrast calculations
 */
export function getRelativeLuminance(hex: string): number {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Check if color is considered "light"
 */
export function isLightColor(hex: string): boolean {
  return getRelativeLuminance(hex) > 0.5;
}

/**
 * Generate dark mode color variants from a primary color
 * Maintains the hue of the original color while adjusting for dark backgrounds
 */
export function generateDarkColors(primaryHex: string): DarkThemeColors {
  const hsl = hexToHSL(primaryHex);

  // For dark mode, we need to:
  // 1. Keep the hue (brand identity)
  // 2. Adjust lightness to be visible on dark backgrounds
  // 3. Reduce saturation slightly for less eye strain

  // Calculate adjusted primary for dark mode
  // If the color is too dark, lighten it; if too light, it's probably fine
  const primaryL = hsl.l < 50 ? Math.min(hsl.l + 20, 65) : hsl.l;
  const primaryS = Math.max(hsl.s - 10, 20);

  return {
    // Primary colors - adjusted for visibility on dark backgrounds
    primary: hslToHex(hsl.h, primaryS, primaryL),
    primaryHover: hslToHex(hsl.h, primaryS, Math.min(primaryL + 10, 75)),
    primaryLight: hslToHex(hsl.h, Math.max(primaryS - 30, 10), 15), // Dark with hint of color

    // Secondary - muted version of primary
    secondary: hslToHex(hsl.h, Math.max(primaryS - 40, 10), 60),

    // Accent - slightly brighter version
    accent: hslToHex(hsl.h, Math.min(primaryS + 10, 80), Math.min(primaryL + 5, 70)),

    // Dark mode backgrounds (standard dark grays)
    background: '#111827', // gray-900
    backgroundAlt: '#1f2937', // gray-800
    cardBg: '#1f2937', // gray-800

    // Text colors for dark mode
    text: '#f9fafb', // gray-50
    textMuted: '#9ca3af', // gray-400

    // Borders
    border: '#374151', // gray-700

    // Hero gradients - subtle dark gradient with hint of primary hue
    heroGradientFrom: hslToHex(hsl.h, Math.max(primaryS - 60, 5), 10),
    heroGradientTo: hslToHex(hsl.h, Math.max(primaryS - 70, 3), 7),
  };
}

/**
 * Adjust a specific color for dark mode based on its usage type
 */
export function adjustColorForDarkMode(
  hex: string,
  type: 'background' | 'text' | 'border' | 'accent' | 'button'
): string {
  const hsl = hexToHSL(hex);

  switch (type) {
    case 'background':
      // Make backgrounds darker
      return hslToHex(hsl.h, Math.max(hsl.s - 20, 10), Math.max(hsl.l - 60, 10));

    case 'text':
      // Make text lighter for contrast
      return hslToHex(hsl.h, Math.max(hsl.s - 30, 0), Math.min(hsl.l + 50, 95));

    case 'border':
      // Borders should be subtle but visible
      return hslToHex(hsl.h, Math.max(hsl.s - 40, 10), 30);

    case 'accent':
      // Accents should be vibrant but not harsh
      return hslToHex(hsl.h, Math.min(hsl.s + 10, 70), Math.min(hsl.l + 15, 65));

    case 'button':
      // Buttons need good contrast - lighten if too dark
      if (hsl.l < 40) {
        return hslToHex(hsl.h, hsl.s, hsl.l + 20);
      }
      return hex;

    default:
      return hex;
  }
}

/**
 * Get contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA requirements
 * Normal text: 4.5:1, Large text: 3:1
 */
export function meetsWCAGContrast(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Get a text color (black or white) that contrasts well with the given background
 */
export function getContrastTextColor(backgroundHex: string): string {
  const luminance = getRelativeLuminance(backgroundHex);
  return luminance > 0.5 ? '#111827' : '#f9fafb';
}

/**
 * CSS variable names for public theme colors
 */
export const publicThemeVars = {
  primary: '--public-primary',
  primaryHover: '--public-primary-hover',
  primaryLight: '--public-primary-light',
  secondary: '--public-secondary',
  accent: '--public-accent',
  background: '--public-bg',
  backgroundAlt: '--public-bg-alt',
  text: '--public-text',
  textMuted: '--public-text-muted',
  border: '--public-border',
  cardBg: '--public-card-bg',
  heroGradientFrom: '--public-hero-from',
  heroGradientTo: '--public-hero-to',
} as const;

/**
 * Generate CSS variables string for both light and dark modes
 */
export function generateThemeCSSVariables(
  primaryHex: string,
  lightColors: Partial<DarkThemeColors> = {}
): { light: Record<string, string>; dark: Record<string, string> } {
  const hsl = hexToHSL(primaryHex);
  const darkColors = generateDarkColors(primaryHex);

  // Light mode defaults (can be overridden)
  const lightDefaults: DarkThemeColors = {
    primary: primaryHex,
    primaryHover: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 10, 20)),
    primaryLight: hslToHex(hsl.h, Math.max(hsl.s - 40, 20), 95),
    secondary: '#2d3748',
    accent: primaryHex,
    background: '#ffffff',
    backgroundAlt: '#f7fafc',
    text: '#1a202c',
    textMuted: '#718096',
    border: '#e2e8f0',
    cardBg: '#ffffff',
    heroGradientFrom: hslToHex(hsl.h, Math.max(hsl.s - 40, 20), 95),
    heroGradientTo: hslToHex(hsl.h, Math.max(hsl.s - 50, 15), 97),
    ...lightColors,
  };

  return {
    light: {
      [publicThemeVars.primary]: lightDefaults.primary,
      [publicThemeVars.primaryHover]: lightDefaults.primaryHover,
      [publicThemeVars.primaryLight]: lightDefaults.primaryLight,
      [publicThemeVars.secondary]: lightDefaults.secondary,
      [publicThemeVars.accent]: lightDefaults.accent,
      [publicThemeVars.background]: lightDefaults.background,
      [publicThemeVars.backgroundAlt]: lightDefaults.backgroundAlt,
      [publicThemeVars.text]: lightDefaults.text,
      [publicThemeVars.textMuted]: lightDefaults.textMuted,
      [publicThemeVars.border]: lightDefaults.border,
      [publicThemeVars.cardBg]: lightDefaults.cardBg,
      [publicThemeVars.heroGradientFrom]: lightDefaults.heroGradientFrom,
      [publicThemeVars.heroGradientTo]: lightDefaults.heroGradientTo,
    },
    dark: {
      [publicThemeVars.primary]: darkColors.primary,
      [publicThemeVars.primaryHover]: darkColors.primaryHover,
      [publicThemeVars.primaryLight]: darkColors.primaryLight,
      [publicThemeVars.secondary]: darkColors.secondary,
      [publicThemeVars.accent]: darkColors.accent,
      [publicThemeVars.background]: darkColors.background,
      [publicThemeVars.backgroundAlt]: darkColors.backgroundAlt,
      [publicThemeVars.text]: darkColors.text,
      [publicThemeVars.textMuted]: darkColors.textMuted,
      [publicThemeVars.border]: darkColors.border,
      [publicThemeVars.cardBg]: darkColors.cardBg,
      [publicThemeVars.heroGradientFrom]: darkColors.heroGradientFrom,
      [publicThemeVars.heroGradientTo]: darkColors.heroGradientTo,
    },
  };
}
